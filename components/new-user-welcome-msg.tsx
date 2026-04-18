'use client';

import { updateUser, useSession } from '@/lib/auth/auth-client';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NewUserWelcomeMsg = () => {
  const { data } = useSession();
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!data) return;

  return (
    <>
      {data.user.isNewUser && (
        <div className="fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40">
          <Card className="w-11/12 max-w-72 sm:max-w-96">
            <CardHeader>
              <CardTitle>👋 Welcome aboard!</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We{`'`}re glad you{`'`}re here. This is your personal command
                center for tracking every job application — from the first click{' '}
                {`"`}Apply
                {`"`} to the final offer.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <div
                className={cn({
                  'cursor-not-allowed': submitting,
                })}
              >
                <Button
                  type="button"
                  size="lg"
                  className="bg-primary hover:bg-primary/90 h-10 cursor-pointer"
                  disabled={submitting}
                  aria-disabled={submitting}
                  tabIndex={submitting ? -1 : 0}
                  onClick={async () => {
                    setSubmitting(true);
                    await updateUser({
                      isNewUser: false,
                    });
                    setSubmitting(false);
                  }}
                >
                  Let{`'`}s Go 🚀
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
};

export default NewUserWelcomeMsg;
