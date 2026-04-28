'use client';

import { createRef, RefObject, useRef, useState } from 'react';
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
import { signUp } from '@/lib/auth/auth-client';
import { toast } from '@/lib/utils/toast';

type FormField = {
  id: 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword';
  label: string;
  type: 'text' | 'email' | 'password';
  defaultValue?: '';
  placeholder?: string;
};

const formFields: FormField[] = [
  {
    id: 'firstName',
    label: 'First Name',
    type: 'text',
    defaultValue: '',
    placeholder: 'John',
  },
  {
    id: 'lastName',
    label: 'Last Name',
    type: 'text',
    defaultValue: '',
    placeholder: 'Doe',
  },
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
  {
    id: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    defaultValue: '',
    placeholder: '********',
  },
];

const signUpSchema = z
  .strictObject({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.email('Invalid email'),
    password: z.string().min(8, 'Min 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    error: 'Passwords do not match',
  });

type FormInputs = z.infer<typeof signUpSchema>;
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

const Signup = () => {
  const router = useRouter();

  const formref = useRef<HTMLFormElement>(null);

  const refMap = Object.fromEntries(
    formFields.map((field) => [field.id, createRef<HTMLInputElement>()]),
  ) as Record<keyof FormInputs, RefObject<HTMLInputElement>>;

  const [loading, setLoading] = useState<boolean>(false);

  const [errors, setErrors] = useState<FormErrors>({
    ...initialErrors,
  });

  const handleBlurAndChange = (fieldId: keyof FormInputs) => {
    const value = refMap[fieldId].current?.value ?? '';

    if (fieldId === 'confirmPassword') {
      const password = refMap.password.current?.value ?? '';
      const result = signUpSchema.safeParse({
        firstName: 'a',
        lastName: 'z',
        email: 'a@a.com',
        password,
        confirmPassword: value,
      });

      if (!result.success) {
        const formattedError = formatError(result.error) as FormErrors;
        setErrors((prev) => ({
          ...prev,
          [fieldId]: formattedError[fieldId],
        }));
      } else {
        setErrors((prev) => ({ ...prev, [fieldId]: '' }));
      }
    } else {
      const schema = signUpSchema.shape[fieldId];
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
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (loading) return;

    const values = Object.fromEntries(
      formFields.map((field) => [
        field.id,
        refMap[field.id].current?.value ?? '',
      ]),
    );

    const result = signUpSchema.safeParse(values);
    if (!result.success) {
      const formattedError = formatError(result.error) as FormErrors;

      setErrors((prev) => ({ ...prev, ...formattedError }));
      return;
    }

    try {
      setLoading(true);

      await signUp.email(
        {
          name: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
        },
        {
          onSuccess: () => {
            toast.success('Registered successfully');
            if (formref?.current) formref.current.reset();
            router.push('/auth/signin');
          },
          onError: (ctx) => {
            toast.error(
              `${ctx.error.message ?? 'Unknown error'}. Registration unsuccessful`,
            );
            console.error(ctx.error);
          },
        },
      );
    } catch (error) {
      toast.error('Unknown error. Registration unsuccessful');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-11/12 max-w-96">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-black">
            Sign Up
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Create an account to start tracking your job applications
          </CardDescription>
        </CardHeader>
        <form ref={formref} onSubmit={handleSubmit} method="post">
          <CardContent className="mb-4">
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
                {loading ? 'Signing up...' : 'Sign up'}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Already has an account?{' '}
              <Link href="/signin" className="text-blue-500 underline">
                signin
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
