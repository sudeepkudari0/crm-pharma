"use client";

import Image from "next/image";
import { UserNav } from "./user-nav";
import { cn } from "@/lib/utils";

export function Navbar({
  user,
}: {
  user: {
    name: string;
    email: string;
    role: string;
    avatar: string;
    phone: string;
    territory: string;
    isActive: boolean;
  };
}) {
  return (
    <header
      className={cn(
        "fixed flex md:hidden top-0 left-0 right-0 h-16 items-center justify-between border-b bg-gradient-to-r from-[#b3f0fb] to-[#f9badf] z-10 px-6 transition-all duration-300 ease-in-out"
      )}
    >
      <Image
        src="/images/logo-nobg.png"
        alt="logo"
        width={100}
        height={100}
        className="w-[120px] h-[50px] object-contain"
      />
      <div className="flex items-center space-x-4">
        <UserNav user={user} />
      </div>
    </header>
  );
}
