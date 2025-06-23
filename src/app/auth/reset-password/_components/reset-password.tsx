"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/ui/error";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { FormSuccess } from "@/components/ui/success";
import { Button } from "@/components/ui/button";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  password: z
    .string()
    .min(6, {
      message:
        "Password must contain at least 6 characters, one uppercase, one lowercase, one number and one special case character.",
    })
    .regex(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/,
      "Password must contain at least 6 characters, one uppercase, one lowercase, one number and one special case character."
    ),
  confirmPassword: z.string().min(6, {
    message: "This field has to be filled.",
  }),
});

export function ResetPasswordForm() {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | undefined>("");
  const [success, setSuccess] = React.useState<string | undefined>("");
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSuccess("");
    setError("");

    const { password, confirmPassword } = values;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: password }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          setError(data.message || "Failed to reset password.");
        } else if (data.success) {
          setSuccess(data.message);
          form.reset();
          toast.success("Password Reset Successfully!", {
            description: "You will be redirected to the dashboard.",
          });
        }
        router.push("/dashboard");
      } catch (e) {
        console.error("Reset password submission error:", e);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  }

  return (
    <Card className="rounded-none p-0 border-none shadow-none">
      <CardContent className="pt-4">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-lg font-semibold text-slate-800">
            Reset Password
          </h1>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm text-slate-700">
                    Password
                  </FormLabel>
                  <FormControl>
                    <>
                      <div className="relative">
                        <PasswordInput
                          placeholder="Enter new password"
                          {...field}
                          className="w-full h-9 rounded-md border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        />
                      </div>
                      <div className="bg-slate-50 p-3 rounded-md space-y-1">
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
                            test: (v: string) =>
                              /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v),
                            text: "One special character",
                          },
                        ].map((requirement, index) => (
                          <div
                            key={index}
                            className={`flex items-center space-x-2 text-xs ${
                              requirement.test(field.value)
                                ? "text-green-600"
                                : "text-slate-500"
                            }`}
                          >
                            {requirement.test(field.value) ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                            <span>{requirement.text}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-700">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <PasswordInput
                        placeholder="Confirm password"
                        {...field}
                        className="w-full h-9 rounded-md border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <FormError message={error} />
            <FormSuccess message={success} />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm rounded-md font-medium shadow-md transition-colors"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
