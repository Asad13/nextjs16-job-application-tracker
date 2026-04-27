'use server';

import { getSession } from '@/lib/auth/helper-functions';

export const isAuthenticated = async (): Promise<boolean> => {
  const fullSession = await getSession();

  if (!fullSession?.user) {
    return false;
  }

  return true;
};
