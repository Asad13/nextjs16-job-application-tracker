import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from '@/lib/auth/auth-server';

const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_SERVER_URL!,
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession, updateUser } = authClient;

export type FullSession = typeof authClient.$Infer.Session;
export type User = FullSession['user'];
export type Session = FullSession['session'];
