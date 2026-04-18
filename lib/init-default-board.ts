import dbConnect from './db';
import { Board, Column } from '@/models';

const DEFAULT_BOARD_COLUMN_NAMES = [
  'Wish List',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
];

export async function initDefaultBoard(userId: string) {
  try {
    await dbConnect();

    const board = await Board.create({
      userId: userId,
      name: 'Default Board',
    });

    const defaultColumns = DEFAULT_BOARD_COLUMN_NAMES.map(
      (columnName, index) => ({
        boardId: board._id,
        name: columnName,
        order: index,
      }),
    );

    const columns = await Column.insertMany(defaultColumns);

    board.columns = columns.map((column) => column._id);
    await board.save();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
