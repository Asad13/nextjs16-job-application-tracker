import { Schema, models, model, Document, Types, Model } from 'mongoose';

export const JOB_APPLICATION_STATUSES = [
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

export interface IJobApplication extends Document {
  title: string;
  company: string;
  position: string;
  location?: string;
  status: JobApplicationStatus;
  columnId: Types.ObjectId;
  boardId: Types.ObjectId;
  userId: Types.ObjectId;
  order: number;
  notes?: string;
  salary?: string;
  jobUrl?: string;
  appliedDate?: Date;
  tags?: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IJobApplicationRet = Omit<IJobApplication, '_id'> & {
  id: Types.ObjectId;
};

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      default: JOB_APPLICATION_STATUSES[0],
      enum: JOB_APPLICATION_STATUSES,
    },
    columnId: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    notes: {
      type: String,
    },
    salary: {
      type: String,
    },
    jobUrl: {
      type: String,
    },
    appliedDate: {
      type: Date,
    },
    tags: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc: Document, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;

        return ret as IJobApplicationRet;
      },
    },
  },
);

// Indexes
jobApplicationSchema.index({ columnId: 1 });
jobApplicationSchema.index({ boardId: 1 });
jobApplicationSchema.index({ userId: 1 });
jobApplicationSchema.index({ userId: 1, boardId: 1 });
jobApplicationSchema.index({ boardId: 1, columnId: 1, order: 1 });

export const JobApplication =
  (models.JobApplication as Model<IJobApplication>) ||
  model<IJobApplication>('JobApplication', jobApplicationSchema);
