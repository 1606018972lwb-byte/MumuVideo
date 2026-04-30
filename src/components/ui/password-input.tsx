"use client";

import * as React from "react";
import { cn } from "@/components/ui/utils/cn";
import { Button } from "@/components/ui/button";
import * as Icons from "@/components/ui/icons";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showToggle?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, type, showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <input
          type={showToggle && !showPassword ? "password" : "text"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />
        {showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <Icons.EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Icons.Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };