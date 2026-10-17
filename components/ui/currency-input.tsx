"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/components/ds/cn";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string | number;
  onValueChange?: (value: string) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    React.useEffect(() => {
      if (value !== undefined) {
        const numericValue = typeof value === "string" ? parseFloat(value) || 0 : value;
        setDisplayValue(formatCurrency(numericValue));
      }
    }, [value]);

    const formatCurrency = (num: number): string => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(num);
    };

    const parseCurrency = (str: string): string => {
      const numbers = str.replace(/\D/g, "");
      const cents = parseInt(numbers || "0", 10);
      return (cents / 100).toFixed(2);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const numeric = parseCurrency(input);
      const formatted = formatCurrency(parseFloat(numeric));
      
      setDisplayValue(formatted);
      onValueChange?.(numeric);
    };

    return (
      <input
        type="text"
        inputMode="numeric"
        className={cn(
          fieldClass,
          "h-10 font-mono tabular-nums",
          className
        )}
        value={displayValue}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
