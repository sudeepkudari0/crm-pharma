// import { CreateSystemAdmin } from "@/components/admin/create-system-admin";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/signin-form";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
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
        <SignInForm />

        {/* Create System Admin Component - Comment out if not needed */}
        {/* <CreateSystemAdmin /> */}
        <blockquote className="text-center flex flex-col mt-4 text-sm">
          <span className="font-semibold">SysAdmin Credentials</span>
          admin@gmail.com <br /> Admin@123
        </blockquote>
      </div>
    </div>
  );
}
