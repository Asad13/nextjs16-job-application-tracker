import { Schema, Document, models, model, Types, Model } from 'mongoose';
import { transformDoc } from '@/lib/db/helper-functions';
import { UpdateColumnOrder } from '@/types/db/column';

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

interface IColumnExtended extends Model<IColumn> {
  updateOrders(_updateColumns: UpdateColumnOrder[]): Promise<void>;
}

export type IColumnRet = Omit<IColumn, '_id' | '__v'> & { id: Types.ObjectId };

const columnSchema = new Schema<IColumn, IColumnExtended>(
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
    jobApplications: {
      type: [Schema.Types.ObjectId],
      ref: 'JobApplication',
      default: [],
    },
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
    statics: {
      async updateOrders(updateColumns: UpdateColumnOrder[]) {
        const columns = (await this.find({
          _id: { $in: updateColumns.map((col) => col.id) },
        }).select('boardId order')) as Pick<
          IColumn,
          '_id' | 'boardId' | 'order'
        >[];

        if (columns.length <= 1) throw new Error('No column found');

        const boardId = columns[0].boardId;
        for (let i = 1; i < columns.length; i++) {
          if (!columns[i].boardId.equals(boardId)) {
            throw new Error('Columns must belong to the same board');
          }
        }

        const session = await this.startSession();

        try {
          session.startTransaction();

          // Assign temp negative values to column order
          for (const column of columns) {
            await this.findByIdAndUpdate(
              column._id,
              { order: -1 * column.order - 1 },
              { session },
            );
          }

          // Update column order
          for (const column of updateColumns) {
            await this.findByIdAndUpdate(
              column.id,
              { order: column.order },
              { session },
            );
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
columnSchema.pre('save', async function () {
  const column = this as IColumn;

  if (!column.isNew) return;
  const lastColumn = await Column.findOne({ boardId: column.boardId })
    .sort({ order: -1 })
    .select('order')
    .lean();
  column.order = lastColumn ? lastColumn.order + 1 : 0;
});

// Indexes
columnSchema.index(
  { boardId: 1, order: 1 },
  { unique: true, name: 'uniq_board_column_order' },
); // Enforcing unique order for every column in a board

export const Column =
  (models.Column as IColumnExtended) ||
  model<IColumn, IColumnExtended>('Column', columnSchema);
