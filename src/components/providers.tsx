"use client";

import type React from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster as SonnerToaster } from "./ui/sonner";
import { Toaster } from "./ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
      <SonnerToaster />
    </SessionProvider>
  );
}
