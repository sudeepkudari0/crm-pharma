"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { forwardRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { InputProps } from "@/components/ui/input";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = InputProps & {
  inputClassName?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, inputClassName, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const disabled =
      props.value === "" || props.value === undefined || props.disabled;

    return (
      <div className={cn("relative w-full", className)}>
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("hide-password-toggle", inputClassName)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
        >
          {showPassword && !disabled ? (
            <EyeIcon className="size-4" aria-hidden="true" />
          ) : (
            <EyeOffIcon className="size-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {showPassword ? "Hide password" : "Show password"}
          </span>
        </Button>

        {/* hides browsers password toggles */}
        <style>{`
					.hide-password-toggle::-ms-reveal,
					.hide-password-toggle::-ms-clear {
						visibility: hidden;
						pointer-events: none;
						display: none;
					}
				`}</style>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
