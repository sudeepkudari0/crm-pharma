"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormError } from "@/components/ui/error";
import { FormSuccess } from "@/components/ui/success";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, X, Mail, KeyRound, Loader2 } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(6, {
        message: "Password must be at least 6 characters.",
      })
      .regex(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/,
        "Password must include uppercase, lowercase, number, and special character."
      ),
    confirmPassword: z
      .string()
      .min(6, { message: "Confirm password is required." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormStep = "email" | "otp" | "password";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<FormStep>("email");
  const [emailForOtp, setEmailForOtp] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const [resendLoading, setResendLoading] = useState(false);
  const [otp, setOtp] = useState("");

  const router = useRouter();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    setError(undefined);
    setSuccess(undefined);
  }, [step]);

  const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      // const checkUserResponse = await fetch("/api/forgot-password/user-check", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     contactType: "email",
      //     contactValue: values.email,
      //   }),
      // });
      // const checkUserData = await checkUserResponse.json();

      // if (!checkUserResponse.ok || !checkUserData.exists) {
      //   setError(
      //     checkUserData.message || "No account found with this email address."
      //   );
      //   toast.error(checkUserData.message || "No account found.");
      //   setIsLoading(false);
      //   return;
      // }

      // const sendOtpResponse = await fetch("/api/forgot-password/otp", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email: values.email }),
      // });
      // const sendOtpData = await sendOtpResponse.json();

      // if (!sendOtpResponse.ok || sendOtpData.error) {
      //   setError(
      //     sendOtpData.message || "Failed to send OTP. Please try again."
      //   );
      //   toast.error(sendOtpData.message || "Failed to send OTP.");
      // } else {
      //   setSuccess(
      //     sendOtpData.message || "OTP sent successfully to your email."
      //   );
      //   toast.success(sendOtpData.message || "OTP sent!");
      //   setEmailForOtp(values.email);
      //   setStep("otp");
      //   emailForm.reset();
      // }
      toast.success("[TEST] - OTP sent successfully to your email.");
    } catch (e) {
      console.error("Email submit error:", e);
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (otp.length !== 4) {
      setError("OTP must be 4 digits.");
      toast.error("OTP must be 4 digits.");
      return;
    }
    setIsLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const verifyOtpResponse = await fetch("/api/forgot-password/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForOtp, otp: otp }),
      });
      const verifyOtpData = await verifyOtpResponse.json();

      if (!verifyOtpResponse.ok || verifyOtpData.error) {
        setError(verifyOtpData.message || "Invalid or expired OTP.");
        toast.error(verifyOtpData.message || "Invalid or expired OTP.");
      } else {
        setSuccess(verifyOtpData.message || "OTP verified successfully!");
        toast.success(verifyOtpData.message || "OTP verified!");
        setStep("password");
      }
    } catch (e) {
      console.error("OTP verification error:", e);
      setError("An unexpected error occurred during OTP verification.");
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!emailForOtp) {
      setError("Email address is not available to resend OTP.");
      toast.error("Email not found for resending OTP.");
      return;
    }
    setResendLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const resendOtpResponse = await fetch("/api/forgot-password/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForOtp }),
      });
      const resendOtpData = await resendOtpResponse.json();

      if (!resendOtpResponse.ok || resendOtpData.error) {
        setError(resendOtpData.message || "Failed to resend OTP.");
        toast.error(resendOtpData.message || "Failed to resend OTP.");
      } else {
        setSuccess(resendOtpData.message || "New OTP sent to your email.");
        toast.success(resendOtpData.message || "New OTP sent!");
      }
    } catch (e) {
      console.error("Resend OTP error:", e);
      setError("An unexpected error occurred while resending OTP.");
      toast.error("An unexpected error occurred.");
    } finally {
      setResendLoading(false);
    }
  };

  const handlePasswordSubmit = async (
    values: z.infer<typeof passwordSchema>
  ) => {
    setIsLoading(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const setNewPasswordResponse = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailForOtp,
          newPassword: values.password,
        }),
      });
      const setNewPasswordData = await setNewPasswordResponse.json();

      if (!setNewPasswordResponse.ok || setNewPasswordData.error) {
        setError(
          setNewPasswordData.message ||
            "Failed to reset password. The OTP might have expired or been used. Please try again."
        );
        toast.error(setNewPasswordData.message || "Failed to reset password.");
        if (setNewPasswordData.message?.toLowerCase().includes("otp")) {
          setStep("otp");
          setOtp("");
        }
      } else {
        setSuccess(
          setNewPasswordData.message ||
            "Password has been reset successfully! You can now log in."
        );
        toast.success(
          setNewPasswordData.message || "Password reset successfully!"
        );
        router.push("/auth/signin");
        passwordForm.reset();
      }
    } catch (e) {
      console.error("Set new password error:", e);
      setError("An unexpected error occurred while resetting your password.");
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormStep = () => {
    switch (step) {
      case "email":
        return (
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
              className="space-y-6"
            >
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-slate-700">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                          disabled={isLoading}
                          className="w-full h-10 pl-10 rounded-md border border-input text-sm focus:border-primary focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
                Send OTP
              </Button>
            </form>
          </Form>
        );
      case "otp":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <Label
                htmlFor="otp-input"
                className="text-sm text-slate-700 self-center mb-3"
              >
                Enter 4-digit OTP
              </Label>
              <InputOTP
                id="otp-input"
                maxLength={4}
                value={otp}
                onChange={setOtp}
                disabled={isLoading || resendLoading}
              >
                <InputOTPGroup className="gap-2">
                  {[...Array(4)].map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-12 w-10 text-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-xs text-slate-500 text-center">
              An OTP has been sent to{" "}
              <span className="font-medium text-slate-700">{emailForOtp}</span>.
            </p>
            <Button
              type="button"
              onClick={handleOtpVerification}
              disabled={isLoading || resendLoading || otp.length !== 4}
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Verify OTP
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm text-blue-600 hover:text-blue-700 p-0 h-auto"
                onClick={handleResendOtp}
                disabled={resendLoading || isLoading}
              >
                {resendLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}{" "}
                Resend Code
              </Button>
            </div>
          </div>
        );
      case "password":
        return (
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
              className="space-y-4"
            >
              {" "}
              {}
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm text-slate-700">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <PasswordInput
                            placeholder="Enter new password"
                            {...field}
                            disabled={isLoading}
                            className="w-full h-10 pl-10 rounded-md border border-input text-sm focus:border-primary focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md space-y-1 mt-2">
                          {[
                            {
                              test: (v: string) => v.length >= 6,
                              text: "At least 6 characters",
                            },
                            {
                              test: (v: string) => /[a-z]/.test(v),
                              text: "One lowercase letter",
                            },
                            {
                              test: (v: string) => /[A-Z]/.test(v),
                              text: "One uppercase letter",
                            },
                            {
                              test: (v: string) => /\d/.test(v),
                              text: "One number",
                            },
                            {
                              test: (v: string) => /[^a-zA-Z0-9]/.test(v),
                              text: "One special character",
                            },
                          ].map((requirement, index) => (
                            <div
                              key={index}
                              className={`flex items-center space-x-2 text-xs ${requirement.test(field.value) ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}
                            >
                              {requirement.test(field.value) ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                              <span>{requirement.text}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm text-slate-700">
                      Confirm New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <PasswordInput
                          placeholder="Confirm new password"
                          {...field}
                          disabled={isLoading}
                          className="w-full h-10 pl-10 rounded-md border border-input text-sm focus:border-primary focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
                Reset Password
              </Button>
            </form>
          </Form>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center ">
      <Card className="w-full max-w-md border-none shadow-none rounded-lg bg-card">
        <CardHeader className="pb-4 pt-6">
          <div className="flex flex-col items-center space-y-3">
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Forgot Your Password?
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground text-center px-2">
              {step === "email" &&
                "No worries! Enter your email and we'll send you an OTP to reset your password."}
              {step === "otp" &&
                "Enter the 4-digit OTP sent to your email to proceed."}
              {step === "password" &&
                "Create a new strong password for your account."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {renderFormStep()}
          <FormError message={error} />
          <FormSuccess message={success} />

          {}
          {success && step === "password" ? (
            <div className="mt-6 text-center">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/auth/signin">Back to Login</Link>
              </Button>
            </div>
          ) : step !== "password" || !success ? (
            <div className="mt-6 text-center">
              <Link
                href="/auth/signin"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Remember your password?{" "}
                <span className="font-semibold text-primary">Sign In</span>
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
