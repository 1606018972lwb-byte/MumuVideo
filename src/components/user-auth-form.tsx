"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { cn } from "@/components/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import * as Icons from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  lang: string;
  disabled?: boolean;
  defaultMode?: "email" | "password-login" | "password-register";
}

// 邮箱登录 schema
const emailSchema = z.object({
  email: z.string().email(),
});

// 账号密码登录 schema
const passwordLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// 账号密码注册 schema
const passwordRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordLoginData = z.infer<typeof passwordLoginSchema>;
type PasswordRegisterData = z.infer<typeof passwordRegisterSchema>;

export function UserAuthForm({
  className,
  lang,
  disabled,
  defaultMode = "password-login",
  ...props
}: UserAuthFormProps) {
  const t = useTranslations("Login");
  const [authMode, setAuthMode] = React.useState<"email" | "password-login" | "password-register">(defaultMode);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const searchParams = useSearchParams();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const passwordLoginForm = useForm<PasswordLoginData>({
    resolver: zodResolver(passwordLoginSchema),
  });

  const passwordRegisterForm = useForm<PasswordRegisterData>({
    resolver: zodResolver(passwordRegisterSchema),
  });

  // Magic Link 登录
  async function onEmailSubmit(data: EmailFormData) {
    setIsLoading(true);

    try {
      await authClient.signIn.magicLink({
        email: data.email.toLowerCase(),
        callbackURL: searchParams?.get("from") ?? `/${lang}/my-creations`,
      });

      toast.success("Check your email", {
        description: "We sent you a login link. Be sure to check your spam too.",
      });
    } catch (error) {
      console.error("Error during sign in:", error);
      toast.error("Something went wrong.", {
        description: "Your sign in request failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 账号密码登录
  async function onPasswordLoginSubmit(data: PasswordLoginData) {
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email.toLowerCase(),
          password: data.password,
        }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        // Empty or invalid JSON response
        if (!response.ok) {
          toast.error("Login failed", {
            description: "Database connection error. Please try again later.",
          });
          setIsLoading(false);
          return;
        }
      }

      if (!response.ok || result.error) {
        toast.error("Login failed", {
          description: result.error?.message || "Invalid email or password",
        });
      } else {
        window.location.href = searchParams?.get("from") ?? `/${lang}/my-creations`;
      }
    } catch (error) {
      console.error("Error during password sign in:", error);
      toast.error("Something went wrong.", {
        description: "Your sign in request failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 账号密码注册
  async function onPasswordRegisterSubmit(data: PasswordRegisterData) {
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email.toLowerCase(),
          password: data.password,
        }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        // Empty or invalid JSON response
        if (!response.ok) {
          toast.error("Registration failed", {
            description: "Database connection error. Please try again later.",
          });
          setIsLoading(false);
          return;
        }
      }

      if (!response.ok || result.error) {
        toast.error("Registration failed", {
          description: result.error?.message || "Could not create account",
        });
      } else {
        toast.success("Account created", {
          description: "Welcome! You can now sign in with your password.",
        });
        setAuthMode("password-login");
        passwordLoginForm.setValue("email", data.email);
      }
    } catch (error) {
      console.error("Error during password sign up:", error);
      toast.error("Something went wrong.", {
        description: "Your registration request failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {/* 账号密码登录/注册表单 */}
      {authMode !== "email" && (
        <form
          onSubmit={authMode === "password-login"
            ? passwordLoginForm.handleSubmit(onPasswordLoginSubmit)
            : passwordRegisterForm.handleSubmit(onPasswordRegisterSubmit)
          }
        >
          <div className="grid gap-2">
            {authMode === "password-register" && (
              <div className="grid gap-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  autoCapitalize="none"
                  autoComplete="name"
                  disabled={isLoading}
                  {...passwordRegisterForm.register("name")}
                />
                {passwordRegisterForm.formState.errors.name && (
                  <p className="px-1 text-xs text-red-600">
                    {passwordRegisterForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            )}
            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoCapitalize="none"
                autoComplete="email"
                disabled={isLoading}
                {...(authMode === "password-login"
                  ? passwordLoginForm.register("email")
                  : passwordRegisterForm.register("email"))
                }
              />
              {(authMode === "password-login"
                ? passwordLoginForm.formState.errors.email
                : passwordRegisterForm.formState.errors.email) && (
                <p className="px-1 text-xs text-red-600">
                  {(authMode === "password-login"
                    ? passwordLoginForm.formState.errors.email
                    : passwordRegisterForm.formState.errors.email)?.message}
                </p>
              )}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Your password"
                autoCapitalize="none"
                autoComplete={authMode === "password-login" ? "current-password" : "new-password"}
                disabled={isLoading}
                {...(authMode === "password-login"
                  ? passwordLoginForm.register("password")
                  : passwordRegisterForm.register("password"))
                }
              />
              {(authMode === "password-login"
                ? passwordLoginForm.formState.errors.password
                : passwordRegisterForm.formState.errors.password) && (
                <p className="px-1 text-xs text-red-600">
                  {(authMode === "password-login"
                    ? passwordLoginForm.formState.errors.password
                    : passwordRegisterForm.formState.errors.password)?.message}
                </p>
              )}
            </div>
            {authMode === "password-register" && (
              <div className="grid gap-1">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...passwordRegisterForm.register("confirmPassword")}
                />
                {passwordRegisterForm.formState.errors.confirmPassword && (
                  <p className="px-1 text-xs text-red-600">
                    {passwordRegisterForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}
            <button
              type="submit"
              className={cn(buttonVariants())}
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {authMode === "password-login" ? t("submit_signin") : t("submit_signup")}
            </button>
          </div>
        </form>
      )}

      {/* Magic Link 登录表单 */}
      {authMode === "email" && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading || isGoogleLoading || disabled}
                {...emailForm.register("email")}
              />
              {emailForm.formState.errors?.email && (
                <p className="px-1 text-xs text-red-600">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className={cn(buttonVariants())}
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("signin_email")}
            </button>
          </div>
        </form>
      )}

      {/* 切换登录方式 */}
      {authMode !== "email" && (
        <Button
          type="button"
          variant="link"
          className="text-xs text-muted-foreground h-auto p-0"
          onClick={() => {
            if (authMode === "password-login") {
              setAuthMode("password-register");
            } else {
              setAuthMode("password-login");
            }
          }}
        >
          {authMode === "password-login"
            ? t("switch_to_signup")
            : t("switch_to_signin")}
        </Button>
      )}

      {authMode === "email" && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("signin_others")}
              </span>
            </div>
          </div>

          {/* 账号密码登录选项 */}
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }))}
            onClick={() => setAuthMode("password-login")}
            disabled={isLoading}
          >
            {t("signin_password")}
          </button>

          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }))}
            onClick={() => {
              setIsGoogleLoading(true);
              authClient.signIn
                .social({
                  provider: "google",
                  callbackURL: searchParams?.get("from") ?? `/${lang}/my-creations`,
                })
                .catch((error) => {
                  console.error("Google signIn error:", error);
                  setIsGoogleLoading(false);
                });
            }}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.Google className="mr-2 h-4 w-4" />
            )}{" "}
            {t("signin_google")}
          </button>
        </>
      )}
    </div>
  );
}
