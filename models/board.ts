import { Schema, Types, Document, models, model, type Model } from 'mongoose';

export interface IBoard extends Document {
  name: string;
  userId: Types.ObjectId;
  columns: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type IBoardRet = Omit<IBoard, '_id'> & { id: Types.ObjectId };

const boardSchema = new Schema<IBoard>(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    columns: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Column',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc: Document, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;

        return ret as IBoardRet;
      },
    },
  },
);

// Indexes
boardSchema.index({ userId: 1 });

export const Board =
  (models.Board as Model<IBoard>) || model<IBoard>('Board', boardSchema);
