import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import connectMongo from "./db/mongoose";
import { User } from "./model/user";

export const config = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID ?? "",
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? "",
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if ((account?.provider === "google" || account?.provider === "apple") && user?.email) {
        await connectMongo();
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          const newUser = await User.create({
            fullName: user.name || "",
            email: user.email,
            password: "", // no password for OAuth
            role: "user",
            isActive: true,
            avatarUrl: user.image,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          user.id = newUser._id.toString(); // attach MongoDB _id
        } else {
          user.id = existingUser._id.toString();
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.id,
          email: token.email,
        },
      };
    },

    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthOptions;

// Auth helper
export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, config);
}
