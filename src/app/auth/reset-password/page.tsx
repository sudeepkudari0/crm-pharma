import type { Metadata } from "next";

import { ResetPasswordForm } from "./_components/reset-password";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default async function ResetPasswordPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return redirect("/auth/signin?error=true");
  }

  if (!session.user.firstLogin) {
    return redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/hero.png')`,
          }}
        />
      </div>
      <div className="max-w-md w-full bg-white rounded p-4 z-10">
        <div className="text-center relative">
          <Link href="/" className="absolute top-0 right-0 z-10">
            <Button variant="outline" size="sm" className="bg-white text-black">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
