'use client';

import { useSession } from '@/lib/auth/auth-client';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Eye, Pencil, Plus } from 'lucide-react';
import { Field, FieldGroup, FieldLabel, FieldDescription } from './ui/field';
import { Input } from './ui/input';
import {
  createRef,
  Dispatch,
  RefObject,
  SetStateAction,
  SubmitEvent,
  useState,
  useTransition,
} from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Spinner } from './ui/spinner';
import { z } from 'zod';
import {
  createJobApplication,
  updateJobApplication,
} from '@/actions/job-application';
import { FeedbackBase } from '@/types/api';
import { UpdateJobApplicationInputType } from '@/lib/validations/job-application';
import { Toggle } from './ui/toggle';

type ErrorKey = 'required' | 'maxLength';
type SchemaType = z.core.JSONSchema.StringSchema['type'] | undefined;

type FieldId =
  | 'title'
  | 'company'
  | 'position'
  | 'salary'
  | 'location'
  | 'jobUrl'
  | 'description'
  | 'tags'
  | 'notes';

interface FormField {
  id: FieldId;
  type: 'text' | 'textarea' | 'select' | 'date';
  schemaType: SchemaType;
  label: string;
  required: boolean;
  defaultValue: string;
  description: string;
  placeholder: string;
  maxLength?: number;
  errors: Partial<Record<ErrorKey, string>>;
}

const formFields: FormField[][] = [
  [
    {
      id: 'title',
      type: 'text',
      schemaType: 'string' as SchemaType,
      label: 'Title',
      required: true,
      defaultValue: '',
      description: 'Give this job a nice title',
      placeholder: 'e.g., "Dream Job", "Remote Senior Role"',
      maxLength: 100,
      errors: {
        required: 'Title is required',
        maxLength: 'Title cannot be more than 100 characters long',
      },
    },
    {
      id: 'company',
      type: 'text',
      schemaType: 'string' as SchemaType,
      label: 'Company',
      required: true,
      defaultValue: '',
      description: 'Name of the company',
      placeholder: 'e.g., "Google LLC", "Apple Inc."',
      maxLength: 100,
      errors: {
        required: 'Company name is required',
        maxLength: 'Company name cannot be more than 100 characters long',
      },
    },
  ],
  [
    {
      id: 'position',
      type: 'text',
      schemaType: 'string' as SchemaType,
      label: 'Position',
      required: true,
      defaultValue: '',
      description: 'Your job title or role',
      placeholder: 'e.g., "Product Manager", "Software Engineer"',
      maxLength: 100,
      errors: {
        required: 'Job position or role is required',
        maxLength: 'Job position cannot be more than 100 characters long',
      },
    },
    {
      id: 'salary',
      type: 'text',
      schemaType: 'string' as SchemaType,
      label: 'Salary',
      required: false,
      defaultValue: '',
      description: 'Salary or Range of Salary',
      placeholder: 'e.g., "$100k - $150k", "$70,000"',
      maxLength: 50,
      errors: {
        required: 'Company name is required',
        maxLength: 'Salary cannot be more than 50 characters long',
      },
    },
  ],
  [
    {
      id: 'location',
      type: 'text',
      schemaType: 'string' as SchemaType,
      label: 'Location',
      required: false,
      defaultValue: '',
      description: 'Address of the Company',
      placeholder: 'e.g., "Remote", "London, UK"',
      maxLength: 150,
      errors: {
        maxLength: 'Location cannot be more than 150 characters long',
      },
    },
  ],
  [
    {
      id: 'jobUrl',
      type: 'text',
      schemaType: 'string' as SchemaType,
      label: 'Job URL',
      required: false,
      defaultValue: '',
      description: 'Job webpage',
      placeholder: 'e.g., "https://example.com/jobs"',
      maxLength: 2048,
      errors: {
        maxLength: 'Location cannot be more than 2048 characters long',
      },
    },
  ],
  [
    {
      id: 'description',
      type: 'textarea',
      schemaType: 'string' as SchemaType,
      label: 'Job Description',
      required: false,
      defaultValue: '',
      description: 'Few words about the job',
      placeholder: 'Describe the job...',
      maxLength: 5000,
      errors: {
        maxLength: 'Description cannot be more than 5000 characters long',
      },
    },
  ],
  [
    {
      id: 'tags',
      type: 'text',
      schemaType: 'string' as SchemaType,
      label: 'Tags',
      required: false,
      defaultValue: '',
      description: 'Add tags to the job',
      placeholder: 'e.g., "remote, react, express"',
      maxLength: 500,
      errors: {
        maxLength: 'Tags cannot be more than 500 characters long',
      },
    },
  ],
  [
    {
      id: 'notes',
      type: 'textarea',
      schemaType: 'string' as SchemaType,
      label: 'Notes',
      required: false,
      defaultValue: '',
      description: 'Important things for the job',
      placeholder: 'Write the skills and other things needed for the job...',
      maxLength: 5000,
      errors: {
        maxLength: 'Notes cannot be more than 5000 characters long',
      },
    },
  ],
];

const plainFormFields = formFields.reduce((fields, formGroup) => {
  for (let i = 0; i < formGroup.length; i++) {
    fields.push(formGroup[i]);
  }

  return fields;
}, [] as FormField[]);

const createJobJsonSchema: z.core.JSONSchema.ObjectSchema = {
  type: 'object',
  properties: {},
  required: [],
};

plainFormFields.forEach((field) => {
  if (createJobJsonSchema.properties && createJobJsonSchema.required) {
    const fieldSchema: z.core.JSONSchema._JSONSchema & {
      minLength?: number;
      maxLength?: number;
    } = {
      type: field.schemaType,
    };

    if (field.required) {
      fieldSchema.minLength = 1;
      createJobJsonSchema.required.push(field.id);
    }

    if (field.maxLength) {
      fieldSchema.maxLength = field.maxLength;
    }

    createJobJsonSchema.properties[field.id] = fieldSchema;
  }
});

const createJobSchema = z.fromJSONSchema(createJobJsonSchema);
// type CreateJobType = z.infer<typeof createJobSchema>;

const ERROR_MSGS = formFields.reduce(
  (fields, formGroup) => {
    for (let i = 0; i < formGroup.length; i++) {
      fields[formGroup[i].id] = { ...formGroup[i].errors };
    }

    return fields;
  },
  {} as Record<FieldId, Partial<Record<ErrorKey, string>>>,
);

const initialErrorState = Object.fromEntries(
  Object.keys(ERROR_MSGS).map((key) => [key as FieldId, '']),
) as Record<FieldId, string>;

type ErrorState = typeof initialErrorState;

const formatError = (
  errors: z.core.$ZodIssue[],
  fieldId?: FieldId,
): Partial<ErrorState> => {
  return Object.fromEntries(
    errors.map((error) => {
      const key = fieldId ?? error.path[0];

      let category = 'required';
      if (error.code === 'too_big') {
        category = 'maxLength';
      } else if (error.code === 'too_small' && error.minimum > 1) {
        category = 'minLength';
      }
      const value = ERROR_MSGS[key as FieldId][category as ErrorKey];

      return [key, value];
    }),
  );
};

export type JobData = UpdateJobApplicationInputType & { id: string };
export type Purpose = 'view' | 'edit' | 'create';

const DialogHeaderData: Record<
  Purpose,
  { title: string; description: string }
> = {
  view: {
    title: 'Job Application Details',
    description: 'Review the details of your job application.',
  },
  edit: {
    title: 'Edit Job Application',
    description: 'Update the details of your job application.',
  },
  create: {
    title: 'Add Job Application',
    description: 'Track a new job opportunity by filling in the details below.',
  },
};

interface JobApplicationDialogProps {
  boardId: string;
  columnId: string;
  jobData?: JobData;
  color?: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  showTrigger?: boolean;
  purpose?: Purpose;
  setPurpose?: Dispatch<SetStateAction<Purpose>>;
}

const JobApplicationDialog = ({
  boardId,
  columnId,
  jobData,
  color,
  open,
  setOpen,
  showTrigger = true,
  purpose = 'create',
  setPurpose,
}: JobApplicationDialogProps) => {
  const { data: fullSession } = useSession();

  if (jobData && purpose !== 'create') {
    formFields.forEach((fieldGroup) => {
      fieldGroup.forEach((field) => {
        field.defaultValue = jobData[field.id] ?? '';
      });
    });
  } else {
    formFields.forEach((fieldGroup) => {
      fieldGroup.forEach((field) => {
        field.defaultValue = '';
      });
    });
  }

  const [feedback, setFeedBack] = useState<FeedbackBase | null>(null);
  const [isPending, startTransition] = useTransition();

  const refMap = Object.fromEntries(
    plainFormFields.map((field) => {
      if (field.type === 'textarea') {
        return [field.id, createRef<HTMLTextAreaElement>()];
      } else if (field.type === 'select') {
        return [field.id, createRef<HTMLSelectElement>()];
      }

      return [field.id, createRef<HTMLInputElement>()];
    }),
  ) as Record<
    FieldId,
    RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  >;

  const [errors, setErrors] = useState<ErrorState>({ ...initialErrorState });

  if (!fullSession) return;

  const handleBlurAndChange = (fieldId: FieldId) => {
    const value = refMap[fieldId].current?.value ?? '';

    if (createJobSchema instanceof z.ZodObject) {
      const schema = createJobSchema.shape[fieldId];
      const result = schema.safeParse(value);

      if (!result.success) {
        const errors = formatError(result.error.issues, fieldId);
        setErrors((prev) => ({ ...prev, ...errors }));
      } else {
        setErrors((prev) => ({ ...prev, [fieldId]: '' }));
      }
    }
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    if (purpose === 'view') return;

    const values = Object.fromEntries(
      plainFormFields.map((field) => [
        field.id,
        refMap[field.id as FieldId].current?.value ?? '',
      ]),
    ) as Record<FieldId, string>;

    const result = createJobSchema.safeParse(values);

    if (!result.success) {
      const errors = formatError(result.error.issues);
      setErrors((prev) => ({ ...prev, ...errors }));
      return;
    }
    startTransition(async () => {
      try {
        let result: FeedbackBase | null = null;

        if (purpose === 'create') {
          result = await createJobApplication({
            ...values,
            boardId,
            columnId,
          });
        } else if (jobData) {
          result = await updateJobApplication(jobData.id, values);
        }

        if (result) {
          setFeedBack({ ...result });
          if (!result.success) throw new Error(feedback?.message);
          setErrors({ ...initialErrorState });
          setOpen(false);
        }
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="lg"
              style={{
                borderColor: color,
              }}
              className="inset-shadow-lg h-10 w-full cursor-pointer items-center justify-start gap-4 px-4 hover:shadow-lg hover:inset-shadow-none focus:shadow-lg focus:inset-shadow-none sm:px-6"
            >
              <Plus className="-mt-0.5" />
              <span>Add Job</span>
            </Button>
          }
        />
      )}
      <DialogContent className="w-11/12 sm:max-w-xl md:max-w-2xl">
        <div className="xs:flex-row xs:items-center flex w-[90%] flex-col items-start justify-between">
          <DialogTitle
            className="text-lg font-bold sm:text-2xl"
            render={<h2 />}
          >
            {DialogHeaderData[purpose].title}
          </DialogTitle>
          {purpose !== 'create' && (
            <Toggle
              aria-label="Toggle View or Edit"
              size="sm"
              variant="outline"
              className={cn('cursor-pointer transition-colors', {
                'hover:border-primary hover:text-primary': purpose === 'view',
                'border-primary text-primary! hover:border-input hover:text-black!':
                  purpose === 'edit',
              })}
              onClick={() => {
                if (setPurpose) {
                  setPurpose((prev) => (prev === 'view' ? 'edit' : 'view'));
                }
              }}
            >
              {purpose === 'view' ? (
                <Pencil className="-mt-0.5 h-4 w-4 sm:mr-2" />
              ) : (
                <Eye className="-mt-0.5 h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline-block">
                {purpose === 'view' ? 'Edit' : 'View'}
              </span>
            </Toggle>
          )}
        </div>
        <DialogDescription className="text-xs font-semibold text-gray-500 sm:text-lg">
          {DialogHeaderData[purpose].description}
        </DialogDescription>
        <div className="h-5 w-full text-center">
          {feedback && !feedback.success && (
            <p className={cn('text-destructive text-base font-bold')}>
              {feedback.message}
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <ScrollArea
            tabIndex={0}
            className="-mx-4 mb-4 h-[40vh] px-4 md:h-[60vh]"
            viewportClassName="focus-visible:ring-0 focus-visible:outline-none px-1"
          >
            {formFields.map((fieldGroups, index) => (
              <FieldGroup
                key={`field-group-${index}`}
                className="flex-col gap-1 not-last:mb-4 sm:flex-row sm:items-start sm:gap-4"
              >
                {fieldGroups.map((field) => (
                  <Field key={field.id} className="gap-0">
                    <FieldLabel
                      htmlFor="title"
                      className="ml-1 flex gap-0.5 text-lg font-semibold"
                    >
                      <span>{field.label}</span>
                      {field.required && (
                        <span className="text-red-700">*</span>
                      )}
                    </FieldLabel>
                    <FieldDescription className="mb-0.5 ml-1 h-5 overflow-clip text-sm">
                      {field.description}
                    </FieldDescription>
                    {field.type === 'textarea' && (
                      <Textarea
                        ref={refMap[field.id] as RefObject<HTMLTextAreaElement>}
                        name={field.id}
                        id={field.id}
                        defaultValue={field.defaultValue}
                        placeholder={field.placeholder}
                        className="focus-visible:border-input-focus focus-visible:ring-input-focus/50"
                        disabled={isPending || purpose === 'view'}
                        aria-disabled={isPending || purpose === 'view'}
                        tabIndex={isPending || purpose === 'view' ? -1 : 0}
                        onChange={() => handleBlurAndChange(field.id)}
                        onBlur={() => handleBlurAndChange(field.id)}
                      />
                    )}
                    {field.type === 'text' && (
                      <Input
                        ref={refMap[field.id] as RefObject<HTMLInputElement>}
                        type={field.type}
                        name={field.id}
                        id={field.id}
                        defaultValue={field.defaultValue}
                        placeholder={field.placeholder}
                        className="focus-visible:border-input-focus focus-visible:ring-input-focus/50 h-10"
                        disabled={isPending || purpose === 'view'}
                        aria-disabled={isPending || purpose === 'view'}
                        tabIndex={isPending || purpose === 'view' ? -1 : 0}
                        onChange={() => handleBlurAndChange(field.id)}
                        onBlur={() => handleBlurAndChange(field.id)}
                      />
                    )}
                    <div className="mt-0.5 h-4 w-full overflow-hidden">
                      {errors[field.id] && (
                        <p className="text-destructive ml-1 text-xs">
                          {errors[field.id]}
                        </p>
                      )}
                    </div>
                  </Field>
                ))}
              </FieldGroup>
            ))}
          </ScrollArea>
          <DialogFooter className="xs:flex-row xs:justify-end">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="cursor-pointer bg-gray-400/15 px-6 hover:bg-gray-400/25"
                >
                  Close
                </Button>
              }
            />
            {purpose !== 'view' && (
              <div
                className={cn({
                  'cursor-not-allowed': isPending,
                })}
              >
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending}
                  aria-disabled={isPending}
                  tabIndex={isPending ? -1 : 0}
                  className={cn(
                    'hover:bg-primary/90 max-xs:w-full cursor-pointer px-6',
                  )}
                >
                  {isPending && (
                    <Spinner data-icon="inline-start" className="-mt-0.5" />
                  )}
                  {purpose === 'edit' ? (
                    <span>{isPending ? 'Updating' : 'Update'}</span>
                  ) : (
                    <span>{isPending ? 'Adding' : 'Add'}</span>
                  )}
                </Button>
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobApplicationDialog;
