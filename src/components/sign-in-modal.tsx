"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import * as Icons from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { useSigninModal } from "@/hooks/use-signin-modal";
import { toast } from "sonner";
import Link from "next/link";

interface SignInModalContentProps {
  lang: string;
}

export const SignInModalContent = ({ lang }: SignInModalContentProps) => {
  const t = useTranslations("SignInModal");
  const signInModal = useSigninModal();
  const searchParams = useSearchParams();
  const [signInClicked, setSignInClicked] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordMode, setPasswordMode] = useState<"magic" | "password">("magic");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const callbackURL = searchParams?.get("from") ?? `/${lang}${siteConfig.routes.defaultLoginRedirect}`;

  const handleSocialLogin = async (provider: "google") => {
    setSignInClicked(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch (error) {
      console.error(`${provider} signIn error:`, error);
      setSignInClicked(null);
      toast.error("Login failed", {
        description: `Could not sign in with ${provider}. Please try again.`,
      });
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");
    setSignInClicked("email");

    try {
      await authClient.signIn.magicLink({
        email: email.toLowerCase(),
        callbackURL,
      });

      toast.success("Check your email", {
        description: "We sent you a login link. Be sure to check your spam too.",
      });

      setEmail("");
      signInModal.onClose();
    } catch (error) {
      console.error("Magic link signIn error:", error);
      toast.error("Something went wrong", {
        description: "Your sign in request failed. Please try again.",
      });
    } finally {
      setSignInClicked(null);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    setIsLoading(true);
    setEmailError("");
    setPasswordError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password,
        }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
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
        signInModal.onClose();
        window.location.href = callbackURL;
      }
    } catch (error) {
      console.error("Password sign in error:", error);
      toast.error("Something went wrong.", {
        description: "Your sign in request failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isLoading = signInClicked !== null || isLoading;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col items-center justify-center space-y-3 border-b bg-background px-4 py-6 pt-8 text-center">
        <h3 className="font-urban text-2xl font-bold">
          {t("signin_title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("signin_subtitle")}
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-col space-y-4 bg-secondary/50 px-4 py-8">
        {/* Google Login - Priority */}
        {siteConfig.auth.enableGoogleLogin && (
          <Button
            variant="default"
            className="w-full"
            disabled={isLoading}
            onClick={() => handleSocialLogin("google")}
          >
            {signInClicked === "google" ? (
              <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.Google className="mr-2 h-4 w-4" />
            )}
            {t("continue_google")}
          </Button>
        )}

        {/* Login Options */}
        {(siteConfig.auth.enableMagicLinkLogin || siteConfig.auth.enablePasswordLogin) && (
          <>
            {siteConfig.auth.enableGoogleLogin && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-secondary/50 px-2 text-muted-foreground">
                    {t("or_continue_with")}
                  </span>
                </div>
              </div>
            )}

            {/* Switch between Email and Password */}
            {siteConfig.auth.enableMagicLinkLogin && siteConfig.auth.enablePasswordLogin && (
              <div className="flex rounded-md bg-muted p-1">
                <Button
                  variant={passwordMode === "magic" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPasswordMode("magic")}
                >
                  <Icons.Mail className="mr-2 h-4 w-4" />
                  {lang === "zh" ? "邮箱" : "Email"}
                </Button>
                <Button
                  variant={passwordMode === "password" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPasswordMode("password")}
                >
                  <Icons.Lock className="mr-2 h-4 w-4" />
                  {lang === "zh" ? "密码" : "Password"}
                </Button>
              </div>
            )}

            {/* Email/Password Form */}
            <form
              onSubmit={passwordMode === "magic" ? handleMagicLinkLogin : handlePasswordLogin}
              className="grid gap-2"
            >
              <div className="grid gap-1">
                <Label className="sr-only" htmlFor="modal-email">
                  Email
                </Label>
                <Input
                  id="modal-email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={cn(emailError && "border-red-500")}
                />
                {emailError && (
                  <p className="px-1 text-xs text-red-600">{emailError}</p>
                )}
              </div>

              {/* Password field - only show in password mode */}
              {passwordMode === "password" && (
                <div className="grid gap-1">
                  <Label className="sr-only" htmlFor="modal-password">
                    Password
                  </Label>
                  <PasswordInput
                    id="modal-password"
                    placeholder={lang === "zh" ? "输入密码" : "Your password"}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className={cn(passwordError && "border-red-500")}
                  />
                  {passwordError && (
                    <p className="px-1 text-xs text-red-600">{passwordError}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant={siteConfig.auth.enableGoogleLogin ? "outline" : "default"}
                className="w-full"
                disabled={isLoading}
              >
                {signInClicked === "email" || isLoading ? (
                  <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : passwordMode === "password" ? (
                  <Icons.Lock className="mr-2 h-4 w-4" />
                ) : (
                  <Icons.Mail className="mr-2 h-4 w-4" />
                )}
                {passwordMode === "password"
                  ? (lang === "zh" ? "密码登录" : "Sign In")
                  : t("continue_email")
                }
              </Button>
            </form>
          </>
        )}

        {/* Register link for password login */}
        {siteConfig.auth.enablePasswordLogin && passwordMode === "password" && (
          <p className="text-center text-sm text-muted-foreground">
            {lang === "zh"
              ? "还没有账户？"
              : "Don't have an account?"}{" "}
            <Link
              href={`/${lang}/register`}
              className="text-primary hover:underline"
              onClick={signInModal.onClose}
            >
              {lang === "zh" ? "立即注册" : "Sign up"}
            </Link>
          </p>
        )}

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground">
          {t("terms_notice")}
        </p>
      </div>
    </div>
  );
};