import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './lib/auth/helper-functions';

export async function proxy(req: NextRequest) {
  try {
    const session = await getSession();
    const isBasePath = req.nextUrl.pathname.startsWith('/');
    const isAuthPath = req.nextUrl.pathname.startsWith('/auth/');

    if (!session?.user && !isBasePath) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    } else if (session?.user && isAuthPath) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } catch (error) {
    throw error;
  }

  return NextResponse.next();
}
