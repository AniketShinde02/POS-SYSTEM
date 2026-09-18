"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Store, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/validations/auth.schema";
import { auth } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@pos.local", password: "Admin@123456" },
  });

  const onSubmit = async (data: LoginInput) => {
    setError("");
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      } catch (err: unknown) {
        const fbErr = err as { code?: string; message?: string };

        // Auto-bootstrap: if the account doesn't exist yet, create it
        if (
          fbErr.code === "auth/user-not-found" ||
          fbErr.code === "auth/invalid-credential"
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          } catch {
            throw new Error("Invalid email or password");
          }
        } else {
          throw err;
        }
      }

      const idToken = await userCredential.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to establish session");
        return;
      }

      const userRole = (json.data?.user?.role || "cashier").toLowerCase();
      const targetUrl =
        searchParams.get("callbackUrl") ||
        (userRole === "cashier" || userRole === "employee" || userRole === "staff"
          ? "/workspace"
          : "/dashboard");

      router.push(targetUrl);
      router.refresh();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" || e.code === "auth/user-not-found") {
        setError("Invalid email or password. Please verify your credentials.");
      } else if (e.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again in a few minutes.");
      } else {
        setError(e.message || "An unexpected error occurred during sign in.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Your Google account is not authorized for this POS tenant.");
        setIsGoogleSubmitting(false);
        return;
      }

      const userRole = (json.data?.user?.role || "cashier").toLowerCase();
      const targetUrl =
        searchParams.get("callbackUrl") ||
        (userRole === "cashier" || userRole === "employee" || userRole === "staff"
          ? "/workspace"
          : "/dashboard");

      router.push(targetUrl);
      router.refresh();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/popup-closed-by-user") {
        setIsGoogleSubmitting(false);
        return;
      }
      if (e.code === "auth/configuration-not-found") {
        setError("Google Sign-In is not yet enabled in Firebase Console. Enable it under Build > Authentication > Sign-in providers.");
      } else {
        setError(e.message || "Failed to authenticate with Google. Please try again.");
      }
      setIsGoogleSubmitting(false);
    }
  };


  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black p-4 text-zinc-100 sm:p-6 lg:p-8 overflow-hidden">
      {/* Cinematic Brand Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#E85002]/20 via-[#C10801]/10 to-transparent blur-3xl opacity-70" />

      <Card className="relative z-10 w-full max-w-md border-zinc-800/80 bg-zinc-950/90 p-2 shadow-2xl shadow-black/90 backdrop-blur-xl sm:rounded-2xl">
        <CardHeader className="space-y-3 text-center pt-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E85002] to-[#C10801] text-white shadow-lg shadow-[#E85002]/40">
            <Store className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
              RetailPOS
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 font-medium">
              Enterprise Point of Sale & Multi-Tenant Terminal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pb-6">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-800/60 bg-red-950/50 p-3.5 text-xs text-red-300 shadow-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="cashier@store.local"
                className="h-11 border-zinc-800 bg-zinc-900/90 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-[#E85002] focus-visible:ring-[#E85002]"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs font-semibold text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#E85002] hover:text-[#FF5F12] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 pr-10 border-zinc-800 bg-zinc-900/90 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-[#E85002] focus-visible:ring-[#E85002]"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#E85002] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-semibold text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-[#E85002] via-[#F16001] to-[#C10801] font-bold text-white shadow-lg shadow-[#E85002]/30 hover:opacity-95 transition-all text-sm"
              disabled={isSubmitting || isGoogleSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In to Terminal"
              )}
            </Button>
          </form>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800/80" />
            </div>
            <span className="relative bg-zinc-950 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Or continue with
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full border-zinc-800 bg-zinc-900/80 font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all"
            disabled={isSubmitting || isGoogleSubmitting}
            onClick={handleGoogleSignIn}
          >
            {isGoogleSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <svg className="mr-2.5 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
