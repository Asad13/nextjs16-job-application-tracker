import { Schema, Types, Document, models, model, type Model } from 'mongoose';
import { transformDoc } from '@/lib/db-helper-functions';

export interface IBoard extends Document {
  name: string;
  description: string;
  userId: Types.ObjectId;
  columns: Types.ObjectId[];
  isDefault: boolean;
  colorLight: string;
  colorDark: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IBoardRet = Omit<IBoard, '_id' | '__v'> & { id: Types.ObjectId };

const boardSchema = new Schema<IBoard>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    columns: {
      type: [Schema.Types.ObjectId],
      ref: 'Column',
      default: [],
    },
    isDefault: {
      type: 'boolean',
      default: false,
    },
    colorLight: {
      type: String,
      default: '#f76382',
    },
    colorDark: {
      type: String,
      default: '#f788a0',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc: Document, ret: Record<string, unknown>) => {
        return transformDoc<IBoardRet>(ret);
      },
    },
    toObject: {
      transform: (doc: Document, ret: Record<string, unknown>) => {
        return transformDoc<IBoardRet>(ret);
      },
    },
  },
);

// Indexes
boardSchema.index(
  { userId: 1, isDefault: 1 },
  { unique: true, name: 'uniq_user_default_board' },
);

export const Board =
  (models.Board as Model<IBoard>) || model<IBoard>('Board', boardSchema);
