'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth/auth-client';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

const SignoutBtn = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<boolean>(false);

  return (
    <div
      className={cn({
        'cursor-not-allowed': submitting,
      })}
    >
      <Button
        onClick={async () => {
          setSubmitting(true);
          try {
            await signOut({
              fetchOptions: {
                onSuccess: () => {
                  toast.success('Logged out successfully');
                  router.push('/auth/signin');
                  router.refresh();
                },
                onError: (ctx) => {
                  toast.error('Logout unsuccessful');
                  console.error(ctx.error);
                },
              },
            });
          } catch (error) {
            toast.error('Logout unsuccessful');
            console.error(error);
          } finally {
            setSubmitting(false);
          }
        }}
        className="bg-primary hover:bg-primary/90 w-full cursor-pointer py-5"
        disabled={submitting}
        aria-disabled={submitting}
      >
        Log out
      </Button>
    </div>
  );
};

export default SignoutBtn;
