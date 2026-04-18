'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/auth-client';

const DashbaordCtaBtn = () => {
  const { data } = useSession();

  return (
    <Link href={data?.user ? '/dashboard' : '/auth/signup'}>
      <Button
        size="lg"
        className="bg-primary hover:bg-primary/90 h-12 cursor-pointer px-8 text-lg font-medium"
      >
        {data?.user ? 'Go to dashboard' : 'Start for free'}{' '}
        <ArrowRight className="-mb-0.5 ml-2" />
      </Button>
    </Link>
  );
};

export default DashbaordCtaBtn;
