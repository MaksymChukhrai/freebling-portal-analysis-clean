import NextAuth from "next-auth";
import { MoralisNextAuthProvider } from "@moralisweb3/next";

// NextAuth
export default NextAuth({
  providers: [MoralisNextAuthProvider()],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      return session;
    },
  },
});