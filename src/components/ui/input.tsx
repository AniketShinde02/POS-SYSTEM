import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-sm text-zinc-100 shadow-inner placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85002] focus-visible:border-[#E85002] disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
