"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { creemClient } from "@creem_io/better-auth/client";

// Note: Better Auth v1.4.17 does not have a separate emailPasswordClient plugin
// Email/password is handled internally by createAuthClient

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [magicLinkClient(), creemClient()],
});

// Export commonly used methods
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  creem,
} = authClient;

// Re-export types
export type AuthClient = typeof authClient;

// User type for client components
// This matches the server-side User type structure
export type User = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isAdmin?: boolean | null;
};
