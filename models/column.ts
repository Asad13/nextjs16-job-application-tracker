import { Schema, Document, models, model, Types, Model } from 'mongoose';
import { transformDoc } from '@/lib/db-helper-functions';

export interface IColumn extends Document {
  name: string;
  boardId: Types.ObjectId;
  order: number;
  jobApplications: Types.ObjectId[];
  colorLight: string;
  colorDark: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IColumnRet = Omit<IColumn, '_id' | '__v'> & { id: Types.ObjectId };

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
      // required: true, // Not needed - automatically added during create in pre save hook
      // default: 0, // Not needed - handled in pre save hook
    },
    jobApplications: [
      {
        type: Schema.Types.ObjectId,
        ref: 'JobApplication',
      },
    ],
    colorLight: {
      type: String,
      default: '#00b8db',
    },
    colorDark: {
      type: String,
      default: '#48dbf8',
    },
    icon: {
      type: String,
      default: 'Grid2X2',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc: Document, ret: Record<string, unknown>) => {
        return transformDoc<IColumnRet>(ret);
      },
    },
    toObject: {
      transform: (doc: Document, ret: Record<string, unknown>) => {
        return transformDoc<IColumnRet>(ret);
      },
    },
  },
);

// Hooks
columnSchema.pre('save', async function () {
  const column = this as IColumn;

  if (!column.isNew) return;
  const lastColumn = await Column.findOne({ boardId: column.boardId })
    .sort({ order: -1 })
    .select('order')
    .lean();
  column.order = lastColumn ? lastColumn.order + 1 : 0;
});

// Static Methods
columnSchema.statics.swapOrder = async function (
  columnAId: Types.ObjectId | string,
  columnBId: Types.ObjectId | string,
) {
  const [colA, colB] = (await this.find({
    _id: { $in: [columnAId, columnBId] },
  }).select('boardId order')) as Pick<IColumn, '_id' | 'boardId' | 'order'>[];

  if (!colA || !colB) throw new Error('One or both columns not found');

  if (!colA.boardId.equals(colB.boardId))
    throw new Error('Columns must belong to the same board');

  const TEMP_ORDER = -1;
  const session = await this.startSession();
  session.startTransaction();
  try {
    await this.findByIdAndUpdate(colA._id, { order: TEMP_ORDER }, { session });
    await this.findByIdAndUpdate(colB._id, { order: colA.order }, { session });
    await this.findByIdAndUpdate(colA._id, { order: colB.order }, { session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Indexes
columnSchema.index({ boardId: 1 });
columnSchema.index(
  { boardId: 1, order: 1 },
  { unique: true, name: 'uniq_board_column_order' },
); // Enforcing unique order for every column in a board

export const Column =
  (models.Column as Model<IColumn>) || model<IColumn>('Column', columnSchema);
