import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}
