import type { Metadata } from 'next';
import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar';
import { Suspense } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Job Application Tracker',
  description: 'A simple day-to-day life job application tracker',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="selection:bg-primary flex min-h-screen flex-col selection:text-white">
        <Suspense
          fallback={
            <div className="fixed flex h-14 w-full items-center justify-between border-b bg-white px-4 sm:h-16"></div>
          }
        >
          <Navbar user={session?.user ?? null} />
        </Suspense>
        <div className="flex min-h-screen flex-col pt-14 sm:pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}
