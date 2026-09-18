"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settingsSchema, type SettingsInput } from "@/validations/settings.schema";

const currencyOptions = [
  { label: "US Dollar (USD)", value: "USD" },
  { label: "Euro (EUR)", value: "EUR" },
  { label: "British Pound (GBP)", value: "GBP" },
  { label: "Philippine Peso (PHP)", value: "PHP" },
  { label: "Indian Rupee (INR)", value: "INR" },
];

const languageOptions = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
];

const themeOptions = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const fieldClass =
  "flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E85002]/50 disabled:cursor-not-allowed disabled:opacity-50";

export function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: "",
      storeAddress: "",
      storePhone: "",
      storeEmail: "",
      logo: "",
      currency: "USD",
      currencySymbol: "$",
      taxRate: 0,
      taxName: "VAT",
      language: "en",
      invoicePrefix: "INV",
      invoiceFooter: "",
      lowStockAlert: true,
      theme: "system",
    },
  });

  const loadSettings = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Unable to load settings");
        return;
      }

      reset(json.data);
    } catch {
      toast.error("Unable to load settings");
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const onSubmit = async (data: SettingsInput) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error ?? "Failed to save settings");
        return;
      }

      toast.success("Settings saved successfully");
      reset(json.data);
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const resetForm = () => {
    loadSettings();
  };

  return (
    <DashboardShell title="Settings">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Store Settings</h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Configure your store profile, currency, tax details, and invoice branding in one place.
          </p>
        </div>

        {isLoading ? (
          <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
            <CardContent>
              <p className="py-10 text-center text-sm text-zinc-400">Loading settings...</p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
                <CardHeader className="border-b border-zinc-800/80 pb-4">
                  <CardTitle className="text-zinc-100">Store Information</CardTitle>
                  <CardDescription className="text-zinc-400">Update your store details and contact information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-zinc-200">Store name</Label>
                      <Input className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#E85002]" {...register("storeName")} />
                      {errors.storeName && (
                        <p className="text-sm text-red-500">{errors.storeName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-200">Store email</Label>
                      <Input type="email" className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#E85002]" {...register("storeEmail")} />
                      {errors.storeEmail && (
                        <p className="text-sm text-red-500">{errors.storeEmail.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-zinc-200">Phone</Label>
                      <Input className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#E85002]" {...register("storePhone")} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-200">Logo URL</Label>
                      <Input className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#E85002]" {...register("logo")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-200">Address</Label>
                    <textarea
                      className={`${fieldClass} min-h-24 resize-none`}
                      {...register("storeAddress")}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
                  <CardHeader className="border-b border-zinc-800/80 pb-4">
                    <CardTitle className="text-zinc-100">Financial Settings</CardTitle>
                    <CardDescription className="text-zinc-400">Currency, tax, and locale settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-zinc-200">Currency</Label>
                        <select className={fieldClass} {...register("currency")}> 
                          {currencyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-200">Symbol</Label>
                        <Input className="bg-zinc-900 border-zinc-800 text-zinc-100 font-mono focus:border-[#E85002]" {...register("currencySymbol")} />
                        {errors.currencySymbol && (
                          <p className="text-sm text-red-500">{errors.currencySymbol.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-zinc-200">Tax name</Label>
                        <Input className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#E85002]" {...register("taxName")} />
                        {errors.taxName && (
                          <p className="text-sm text-red-500">{errors.taxName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-200">Tax rate</Label>
                        <Input type="number" step="0.01" className="bg-zinc-900 border-zinc-800 text-zinc-100 font-mono focus:border-[#E85002]" {...register("taxRate", { valueAsNumber: true })} />
                        {errors.taxRate && (
                          <p className="text-sm text-red-500">{errors.taxRate.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-zinc-200">Language</Label>
                        <select className={fieldClass} {...register("language")}> 
                          {languageOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-200">Theme</Label>
                        <select className={fieldClass} {...register("theme")}> 
                          {themeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                      <input
                        id="lowStockAlert"
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-800 text-[#E85002] focus:ring-[#E85002]"
                        {...register("lowStockAlert")}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="lowStockAlert" className="text-zinc-200">Low stock alerts</Label>
                        <p className="text-xs text-zinc-400">
                          Enable notifications for low stock products and restock reminders.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
                  <CardHeader className="border-b border-zinc-800/80 pb-4">
                    <CardTitle className="text-zinc-100">Invoice Customization</CardTitle>
                    <CardDescription className="text-zinc-400">Adjust the invoice prefix and footer text shown on receipts.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-200">Invoice prefix</Label>
                      <Input className="bg-zinc-900 border-zinc-800 text-zinc-100 font-mono focus:border-[#E85002]" {...register("invoicePrefix")} />
                      {errors.invoicePrefix && (
                        <p className="text-sm text-red-500">{errors.invoicePrefix.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-200">Invoice footer</Label>
                      <textarea
                        className={`${fieldClass} min-h-24 resize-none`}
                        {...register("invoiceFooter")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end pt-4">
              <Button type="button" variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900" onClick={resetForm} disabled={isSubmitting}>
                Reset
              </Button>
              <Button type="submit" variant="brandGradient" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
