import NextAuth, { User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { type Account } from "next-auth";
import { type JWT } from "next-auth/jwt";
import { type Session } from "next-auth";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
       clientId: process.env.GOOGLE_CLIENT_ID,
       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          try {
             const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
                 method: 'POST',
                 body: JSON.stringify({ email, password }),
                 headers: { "Content-Type": "application/json" }
             });
             // Backend trả { status, message, data: { user, accessToken } }
             const json = await res.json();
             
             if (res.ok && json?.data?.user) {
                 return { ...json.data.user, accessToken: json.data.accessToken };
             }
          } catch(e) {
              console.log(e);
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
     ...authConfig.callbacks,
    async jwt({ token, user, account }: { token: JWT; user?: NextAuthUser; account?: Account | null }) {
        if (user) {
            token.id = user.id;
            token.role = user.role || "STUDENT";
            token.accessToken = user.accessToken;
            // If Google Login, sync with backend
            if (account?.provider === 'google') {
                 try {
                     const syncRes = await fetch(API_ENDPOINTS.AUTH.GOOGLE_SYNC, {
                         method: 'POST',
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({
                             email: user.email,
                             name: user.name,
                             avatar: user.image,
                             googleId: account.providerAccountId
                         })
                     });
                     const syncJson = await syncRes.json();
                     if (syncRes.ok && syncJson?.data?.accessToken) {
                         token.accessToken = syncJson.data.accessToken;
                         if (syncJson.data.user?.id) token.id = syncJson.data.user.id;
                     }
                 } catch (e) { console.error("Google Sync Failed", e); }
            }
        }
        return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
        if (session.user) {
            session.user.id = token.id ?? "";
            session.user.role = token.role ?? "STUDENT";
            session.user.accessToken = token.accessToken;
        }
        return session;
    }
  }
});
