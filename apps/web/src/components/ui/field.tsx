import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

const controlBase =
  "w-full min-w-0 rounded-[10px] border border-line bg-surface text-sm text-fg placeholder:text-faint " +
  "transition-[border-color,box-shadow] duration-150 outline-none hover:border-line-strong " +
  "focus:border-fg-strong focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed " +
  "aria-invalid:border-danger/80";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-[13px] font-medium text-muted", className)} {...props} />;
}

interface InputProps extends ComponentProps<"input"> {
  icon?: ReactNode;
  trailing?: ReactNode;
  /** `sm` matches the dense editor panels (13px, 8px radius). */
  density?: "sm" | "md";
}

export function Input({ icon, trailing, density = "md", className, ...props }: InputProps) {
  const dense = density === "sm";
  return (
    <div className="relative flex w-full items-center">
      {icon && (
        <span className="pointer-events-none absolute left-3 flex text-muted" aria-hidden>
          {icon}
        </span>
      )}
      <input
        className={cn(
          controlBase,
          dense ? "h-[38px] rounded-lg px-2.5 text-[13px]" : "h-10 px-3",
          icon && (dense ? "pl-8" : "pl-9"),
          trailing && "pr-10",
          className,
        )}
        {...props}
      />
      {trailing && <span className="absolute right-2 flex">{trailing}</span>}
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/** Label + control + message, wired for accessibility. */
export function Field({ label, hint, error, className, labelClassName, children }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  const message = error ?? hint;
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {children(id, message ? msgId : undefined)}
      {message && (
        <p id={msgId} className={cn("text-xs", error ? "text-danger" : "text-subtle")}>
          {message}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends Omit<ComponentProps<"select">, "size"> {
  options: { value: string; label: string }[];
  size?: "sm" | "md";
}

/** Native select styled as the Figma dropdown — keeps keyboard & mobile pickers for free. */
export function Select({ options, className, size = "md", ...props }: Omit<SelectProps, "children">) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <select
        className={cn(
          controlBase,
          "cursor-pointer appearance-none pr-10",
          size === "sm" ? "h-[34px] rounded-lg pl-4 text-sm" : "h-10 pl-3",
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-fg", size === "sm" ? "right-4 size-3.5" : "right-3 size-4")}
        aria-hidden
      />
    </div>
  );
}
