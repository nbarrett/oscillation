import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/server/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "PIN Login",
      credentials: {
        nickname: { label: "Nickname", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.nickname || !credentials?.pin) {
          return null
        }

        const nickname = credentials.nickname as string
        const pin = credentials.pin as string

        const user = await db.user.findUnique({
          where: { nickname },
        })

        if (!user) {
          return null
        }

        const isValidPin = await bcrypt.compare(pin, user.pinHash)

        if (!isValidPin) {
          return null
        }

        return {
          id: user.id,
          nickname: user.nickname,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.nickname = user.nickname
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.nickname = token.nickname as string
      }
      return session
    },
  },
  pages: {
    signIn: "/", // We'll use a modal, not a separate page
  },
  session: {
    strategy: "jwt",
  },
})
