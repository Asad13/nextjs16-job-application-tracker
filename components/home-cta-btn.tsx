'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/auth-client';

const HomeCtaBtn = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { data } = useSession();

  return (
    <Button
      size="lg"
      render={<Link href={data?.user ? '/dashboard' : '/auth/signup'} />}
      className="bg-primary hover:bg-primary/90 h-12 cursor-pointer px-8 text-lg font-medium"
    >
      {isLoggedIn || data?.user ? 'Go to dashboard' : 'Start for free'}{' '}
      <ArrowRight className="-mb-0.5 ml-2" />
    </Button>
  );
};

export default HomeCtaBtn;
