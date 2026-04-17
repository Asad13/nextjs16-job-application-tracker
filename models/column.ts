import { Schema, Document, models, model, Types, Model } from 'mongoose';

export interface IColumn extends Document {
  name: string;
  boardId: Types.ObjectId;
  order: number;
  jobApplications: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type IColumnRet = Omit<IColumn, '_id'> & { id: Types.ObjectId };

const columnSchema = new Schema<IColumn>(
  {
    name: { type: String, required: true },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    order: {
      type: Schema.Types.Int32 as unknown as NumberConstructor,
      required: true,
      default: 0,
    },
    jobApplications: [
      {
        type: Schema.Types.ObjectId,
        ref: 'JobApplication',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc: Document, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;

        return ret as IColumnRet;
      },
    },
  },
);

// Indexes
columnSchema.index({ boardId: 1 });

export const Column =
  (models.Column as Model<IColumn>) || model<IColumn>('Column', columnSchema);
