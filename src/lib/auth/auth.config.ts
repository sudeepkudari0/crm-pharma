import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHash } from "crypto";
import { loginSchema } from "../validations/auth";
import { getAccountByUserId, getUserByEmail } from "@/data/user";
import Google from "next-auth/providers/google";
import { AuditActionType, AuditEntityType, logAudit } from "../audit-logger";
import { getRequestClientInfo } from "../server-util";

export default {
  providers: [
    Google,
    Credentials({
      id: "googleonetap",
      name: "Google One Tap",
      credentials: {
        credential: { label: "Google ID Token", type: "text" },
      },
      async authorize(credentials) {
        const googleIdToken = credentials?.credential as string | undefined;

        if (!googleIdToken) {
          console.error("Google One Tap: No credential token received.");
          return null;
        }

        try {
          const verifyResponse = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${googleIdToken}`
          );

          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json();
            console.error(
              "Google One Tap: Token verification failed",
              errorData
            );
            throw new Error("Invalid Google token");
          }

          const payload = await verifyResponse.json();
          if (!payload.email || !payload.sub) {
            console.error("Google One Tap: Invalid payload structure", payload);
            throw new Error("Invalid token payload");
          }

          const user = await getUserByEmail(payload.email);
          if (!user) {
            console.log(
              `Google One Tap: User with email ${payload.email} not found. Sign-in only.`
            );
            return null;
          }

          return user;
        } catch (error: any) {
          console.error("Google One Tap Authorize Error:", error);
          return null;
        }
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;
        const user = await getUserByEmail(email);
        if (!user) {
          return null;
        }

        const account = await getAccountByUserId(user.id as string);

        if (!account || !account.password || !account.salt) {
          return null;
        }

        const saltedPassword = password + account.salt;
        const hashedPassword = createHash("sha256")
          .update(saltedPassword)
          .digest("hex");

        if (hashedPassword !== account.password) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        const returnUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          phone: user.phone,
          territory: user.territory,
          isActive: user.isActive,
          firstLogin: user.firstLogin,
        };

        const { ipAddress, userAgent } = await getRequestClientInfo();

        if (returnUser) {
          logAudit({
            action: AuditActionType.LOGIN_SUCCESS,
            entityType: AuditEntityType.SESSION,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            ipAddress,
            userAgent,
          });
          return returnUser;
        } else {
          logAudit({
            action: AuditActionType.LOGIN_FAILURE,
            entityType: AuditEntityType.SESSION,
            userId: user.id as string,
            details: { reason: "Invalid credentials" },
            ipAddress,
            userAgent,
          });
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
