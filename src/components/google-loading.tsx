import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";

const AuthLoadingState = () => {
  return (
    <Card className="w-full max-w-md shadow-lg rounded-none animate-in fade-in duration-300">
      <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="relative">
          {/* Outer ring animation */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping" />

          {/* Google logo placeholder */}
          <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <Image
              src="/images/google-logo.png"
              alt="Google Logo"
              width={32}
              height={32}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <p className="text-md font-semibold text-slate-600">
            Completing Google Sign In...
          </p>
        </div>

        <div className="text-center space-y-1 pt-4">
          <p className="text-sm text-slate-500">Please wait while we</p>
          <p className="text-sm text-slate-500 animate-pulse">
            verify your credentials
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthLoadingState;
