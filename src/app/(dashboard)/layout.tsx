import type React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;

  try {
    session = await auth();
  } catch (error) {
    console.error("Auth error:", error);
    redirect("/auth/signin");
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
        <Navbar user={session.user as any} />
        <main className="flex-1 overflow-auto p-3 md:p-6 md:pb-0 bg-blue-50">
          {children}
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}
