import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { professor: true, student: true },
        })

        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          professorId: user.professor?.id ?? null,
          studentId: user.student?.id ?? null,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any
        token.role = u.role
        token.professorId = u.professorId
        token.studentId = u.studentId
      }
      return token
    },
    async session({ session, token }) {
      const s = session as any
      s.user.id = token.sub!
      s.user.role = token.role
      s.user.professorId = token.professorId
      s.user.studentId = token.studentId
      return session
    },
  },
  pages: { signIn: "/login" },
}
