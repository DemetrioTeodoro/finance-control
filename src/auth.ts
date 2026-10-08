import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { setValueVisibility } from "@/services/user-preferences";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user) {
          return null;
        }

        const validPassword = await compare(
          credentials.password as string,
          user.password,
        );

        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token }) {
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
  events: {
    // Todo login começa com os valores ocultos, independente de como a
    // preferência ficou na última sessão (ou em outro dispositivo).
    async signIn({ user }) {
      if (!user.id) {
        return;
      }

      try {
        await setValueVisibility(user.id, false);
      } catch (error) {
        console.error("Erro ao ocultar valores no login:", error);
      }
    },
  },
  pages: {
    signIn: "/login",
  },

  secret: process.env.AUTH_SECRET,
});
