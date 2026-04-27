import dbConnect from './db/connect';
import { Board, Column } from '@/lib/db/models';

type ColumnFields = {
  name: string;
  colorLight: string;
  colorDark: string;
  icon: string;
};

const DEFAULT_BOARD_COLUMN_NAMES: ColumnFields[] = [
  {
    name: 'Wish List',
    colorLight: 'oklch(71.5% 0.143 215.221)',
    colorDark: 'oklch(91.7% 0.08 205.041)',
    icon: 'Calendar',
  },
  {
    name: 'Applied',
    colorLight: 'oklch(62.7% 0.265 303.9)',
    colorDark: 'oklch(82.7% 0.119 306.383)',
    icon: 'CheckCircle2',
  },
  {
    name: 'Interviewing',
    colorLight: 'oklch(72.3% 0.219 149.579)',
    colorDark: 'oklch(87.1% 0.15 154.449)',
    icon: 'Mic',
  },
  {
    name: 'Offer',
    colorLight: 'oklch(90.5% 0.182 98.111)',
    colorDark: 'oklch(94.5% 0.129 101.54)',
    icon: 'Award',
  },
  {
    name: 'Rejected',
    colorLight: 'oklch(63.7% 0.237 25.331)',
    colorDark: 'oklch(80.8% 0.114 19.571)',
    icon: 'XCircle',
  },
];

export async function initDefaultBoard(userId: string) {
  try {
    await dbConnect();

    const board = await Board.create({
      userId: userId,
      name: 'My Job Applications',
      description: 'Track your job applications',
      isDefault: true,
    });

    const defaultColumns = DEFAULT_BOARD_COLUMN_NAMES.map((column, index) => ({
      boardId: board._id,
      name: column.name,
      order: index,
      colorLight: column.colorLight,
      colorDark: column.colorDark,
    }));

    const columns = await Column.insertMany(defaultColumns);

    board.columns = columns.map((column) => column._id);
    await board.save();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
