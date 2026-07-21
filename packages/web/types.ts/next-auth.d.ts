import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session.user object
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * Extends the built-in user object (if accessing user directly in callbacks)
   */
  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT token
   */
  interface JWT {
    id?: string;
  }
}