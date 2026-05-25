import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isRegister: { label: "Is Register", type: "text" },
        id: { label: "ID", type: "text" },
        name: { label: "Name", type: "text" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.isRegister === "true") {
          return {
            id: credentials.id as string,
            name: credentials.name as string,
            email: credentials.email as string,
            accessToken: credentials.token as string,
          }
        }

        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const data = await res.json().catch(() => null)

          if (!res.ok || !data?.success) {
            throw new Error(data?.message || "Invalid email or password")
          }

          const user = data?.data?.user || data?.user
          const token = data?.data?.token || data?.token

          if (user && token) {
            return {
              id: String(user.id),
              name: user.name ?? user.full_name ?? "",
              email: user.email,
              accessToken: token,
            }
          }

          throw new Error("Invalid response from server")
        } catch (error: any) {
          throw new Error(error.message || "An error occurred during login")
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "google") {

        console.info("account", account)
        try {
          const response = await fetch(`${API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              id_token: account.access_token
            }),
          });

          console.info("response", response);

          const data = await response.json();
          const backendToken = data?.data?.token || data?.token;
          const backendUser = data?.data?.user || data?.user;

          if (response.ok && backendToken) {
            // Mutate account object so the backend token is passed to the jwt callback
            (account as any).backendToken = backendToken;
            (account as any).backendUserId = backendUser?.id ? String(backendUser.id) : user.id;
            return true;
          }
          return false; // Deny sign-in if Laravel backend fails or no token returned
        } catch (error) {
          console.error("Google signIn error:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        // This runs only on initial sign in for OAuth
        if ((account as any).backendToken) {
          token.accessToken = (account as any).backendToken;
          token.id = (account as any).backendUserId;
        }
      } else if (user) {
        token.accessToken = (user as typeof user & { accessToken: string }).accessToken
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ; (session as typeof session & { accessToken: string }).accessToken = token.accessToken as string
          ; (session.user as typeof session.user & { id: string }).id = token.id as string
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
}
