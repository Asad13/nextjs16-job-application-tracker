import { Schema, models, model, Document, Types, Model } from 'mongoose';
import { transformDoc } from '@/lib/db/helper-functions';
import { UpdateJobOrder } from '@/types/db/job-application';
import { Column } from './column';

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

export interface IJobApplicationExtended extends Model<IJobApplication> {
  pdateColumnAndOrder(_updatedJobs: UpdateJobOrder[]): Promise<void>;
}

export type IJobApplicationRet = Omit<IJobApplication, '_id' | '__v'> & {
  id: Types.ObjectId;
};

const jobApplicationSchema = new Schema<
  IJobApplication,
  IJobApplicationExtended
>(
  {
    title: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 100,
    },
    company: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 100,
    },
    position: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 100,
    },
    location: {
      type: String,
      maxLength: 150,
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
      type: Schema.Types.Int32 as unknown as NumberConstructor,
      required: true,
      default: 0,
    },
    notes: {
      type: String,
      maxLength: 5000,
    },
    salary: {
      type: String,
      maxLength: 50,
    },
    jobUrl: {
      type: String,
      maxLength: 2048,
    },
    appliedDate: {
      type: Date,
      default: new Date(),
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      maxLength: 5000,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc: Document, ret: Record<string, unknown>) => {
        return transformDoc<IJobApplicationRet>(ret);
      },
    },
    toObject: {
      transform: (doc: Document, ret: Record<string, unknown>) => {
        return transformDoc<IJobApplicationRet>(ret);
      },
    },
    statics: {
      async updateColumnAndOrder(updatedJobs: UpdateJobOrder[]) {
        const jobs = (await this.find({
          _id: { $in: updatedJobs.map((ujob) => ujob.id) },
        }).select({ boardId: 1, columnId: 1, order: 1 })) as Pick<
          IJobApplication,
          '_id' | 'boardId' | 'columnId' | 'order'
        >[];

        if (jobs.length === 0) throw new Error('No job found');

        const boardId = jobs[0].boardId;
        for (let i = 1; i < jobs.length; i++) {
          if (!jobs[i].boardId.equals(boardId)) {
            throw new Error('Jobs must belong to the same board');
          }
        }

        const session = await this.startSession();
        try {
          session.startTransaction();

          for (const job of jobs) {
            await this.findByIdAndUpdate(
              job._id,
              { order: -1 * job.order - 1 },
              { session },
            );
            const column = await Column.findById(job.columnId).session(session);
            if (column) {
              column.jobApplications = column.jobApplications.filter(
                (jobId) => !job._id.equals(jobId),
              );
              await column.save();
            }
          }

          for (const job of updatedJobs) {
            await this.findByIdAndUpdate(
              job.id,
              { order: job.order, columnId: job.columnId },
              { session },
            );
            const column = await Column.findById(job.columnId).session(session);
            const jobDb = jobs.find((j) => j._id.toString() === job.id);
            if (column && jobDb) {
              column.jobApplications.push(jobDb._id);
              await column.save();
            }
          }

          await session.commitTransaction();
        } catch (error) {
          console.error(error);
          await session.abortTransaction();
          throw error;
        } finally {
          await session.endSession();
        }
      },
    },
  },
);

// Hooks
jobApplicationSchema.pre('save', async function () {
  const jobApplication = this as IJobApplication;

  if (!jobApplication.isNew) return;
  const lastJob = await JobApplication.findOne({
    columnId: jobApplication.columnId,
  })
    .sort({ order: -1 })
    .select('order')
    .lean();

  jobApplication.order = lastJob ? lastJob.order + 1 : 0;
});

// Indexes
jobApplicationSchema.index({ columnId: 1 });
jobApplicationSchema.index({ userId: 1, boardId: 1 });
jobApplicationSchema.index(
  { boardId: 1, columnId: 1, order: 1 },
  { unique: true, name: 'uniq_board_column_job_order' },
);

export const JobApplication =
  (models.JobApplication as IJobApplicationExtended) ||
  model<IJobApplication, IJobApplicationExtended>(
    'JobApplication',
    jobApplicationSchema,
  );
