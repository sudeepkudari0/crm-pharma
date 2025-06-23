import { headers as nextHeaders } from "next/headers";

export async function getRequestClientInfo(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const headersList = await nextHeaders();
    userAgent = headersList.get("user-agent") || null;

    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      ip = forwardedFor.split(",")[0].trim();
    } else {
      ip = headersList.get("x-real-ip") || null;
    }
  } catch (error) {
    console.warn("Could not get request client info:", error);
  }
  return { ipAddress: ip, userAgent };
}
