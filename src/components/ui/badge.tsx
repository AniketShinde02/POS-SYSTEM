import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors shadow-sm",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#E85002] text-white shadow-[#E85002]/20",
        secondary: "border-zinc-700 bg-zinc-800 text-zinc-200",
        destructive: "border-transparent bg-red-950/80 text-red-300 border-red-800/60",
        outline: "border-zinc-700 text-zinc-200 bg-zinc-900/50",
        success: "border-transparent bg-emerald-950/80 text-emerald-300 border-emerald-800/60",
        warning: "border-transparent bg-amber-950/80 text-amber-300 border-amber-800/60",
        brand: "border-transparent bg-[#E85002]/20 text-[#E85002] border-[#E85002]/40 font-extrabold",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
