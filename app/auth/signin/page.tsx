'use client';

import { createRef, RefObject, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { z, ZodError } from 'zod';
import { signIn } from '@/lib/auth/auth-client';

type FormField = {
  id: 'email' | 'password';
  label: string;
  type: 'email' | 'password';
  defaultValue?: '';
  placeholder?: string;
};

const formFields: FormField[] = [
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    defaultValue: '',
    placeholder: 'johndoe@example.com',
  },
  {
    id: 'password',
    label: 'Password',
    type: 'password',
    defaultValue: '',
    placeholder: '********',
  },
];

const signInSchema = z.strictObject({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormInputs = z.infer<typeof signInSchema>;
type FormErrors = FormInputs;

const initialErrors = Object.fromEntries(
  formFields.map((field) => [field.id, '']),
) as FormErrors;

const formatError = (error: ZodError<Record<string, string>>) => {
  return Object.entries(z.flattenError(error).fieldErrors).reduce(
    (obj, [key, value]) => {
      if (value) obj[key] = value[0];
      return obj;
    },
    {} as Record<string, string>,
  );
};

const Signin = () => {
  const router = useRouter();

  const refMap = Object.fromEntries(
    formFields.map((field) => [field.id, createRef<HTMLInputElement>()]),
  ) as Record<keyof FormInputs, RefObject<HTMLInputElement>>;

  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [errors, setErrors] = useState<FormErrors>({
    ...initialErrors,
  });

  const handleBlurAndChange = (fieldId: keyof FormInputs) => {
    const value = refMap[fieldId].current?.value ?? '';

    const schema = signInSchema.shape[fieldId];
    const result = schema.safeParse(value);
    if (!result.success) {
      const errorMsg = z.flattenError(result.error).formErrors[0];
      setErrors((prev) => ({
        ...prev,
        [fieldId]: errorMsg,
      }));
    } else {
      setErrors((prev) => ({ ...prev, [fieldId]: '' }));
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    const values = Object.fromEntries(
      formFields.map((field) => [
        field.id,
        refMap[field.id].current?.value ?? '',
      ]),
    );

    const result = signInSchema.safeParse(values);
    if (!result.success) {
      const formattedError = formatError(result.error) as FormErrors;

      setErrors((prev) => ({ ...prev, ...formattedError }));
      return;
    }

    try {
      await signIn.email(
        {
          email: values.email,
          password: values.password,
        },
        {
          onSuccess: async () => {
            router.push('/dashboard');
            router.refresh();
          },
          onError: (ctx) => {
            setFeedback(ctx.error.message ?? 'Login unsuccessful');
          },
        },
      );
    } catch (error) {
      console.error(error);
      setFeedback('Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-11/12 max-w-96">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-black">
            Sign In
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} method="post">
          <CardContent className="mb-4">
            {feedback && (
              <div className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-center text-sm">
                {feedback}
              </div>
            )}
            {formFields.map((field) => (
              <div key={field.id} className="mb-1.5">
                <Label htmlFor={field.id} className="mb-1 ml-2">
                  {field.label}
                </Label>
                <Input
                  ref={refMap[field.id]}
                  type={field.type}
                  id={field.id}
                  name={field.id}
                  defaultValue={field.defaultValue ?? ''}
                  {...(field.placeholder && { placeholder: field.placeholder })}
                  className="focus-visible:border-input-focus focus-visible:ring-input-focus/50 h-10"
                  onChange={() => {
                    handleBlurAndChange(field.id);
                  }}
                  onBlur={() => {
                    handleBlurAndChange(field.id);
                  }}
                  aria-invalid={errors[field.id] !== ''}
                  disabled={loading}
                  aria-disabled={loading}
                />
                <div className="h-4 w-full overflow-hidden">
                  {errors[field.id] && (
                    <p className="text-destructive ml-2 text-xs">
                      {errors[field.id]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex w-full flex-col gap-1">
            <div
              className={cn('w-full', {
                'cursor-not-allowed': loading,
              })}
            >
              <Button
                type="submit"
                className={cn('w-full cursor-pointer py-5 text-lg')}
                disabled={loading}
                aria-disabled={loading}
                tabIndex={loading ? -1 : 0}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Don&lsquo;t have an account?{' '}
              <Link href="/signup" className="text-blue-500 underline">
                register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signin;
