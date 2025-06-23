import { signIn } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ clientId: process.env.AUTH_GOOGLE_ID });
}

const loginWithGoogle = async (credential: string) => {
  try {
    await signIn("googleonetap", {
      credential: credential,
      redirect: false,
    });
    return { ok: true, error: null };
  } catch (error: any) {
    console.error("signIn('googleonetap') caught error:", error);
    if (error.type === "CredentialsSignin") {
      return { ok: false, error: "CredentialsSignin" };
    }
    return { ok: false, error: error.message || "Unknown sign-in error" };
  }
};

export async function POST(request: Request) {
  const { credential } = await request.json();
  const result = await loginWithGoogle(credential);
  return NextResponse.json(result);
}
