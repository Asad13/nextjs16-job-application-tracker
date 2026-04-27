'use server';

import { Board, Column } from '@/lib/db/models';
import { FeedbackBase } from '@/types/api';
import { UpdateColumnOrder } from '@/types/db/column';
import { updateTag } from 'next/cache';
import dbConnect from '@/lib/db/connect';
import { isAuthenticated } from '@/lib/utils/server-utils';

export const updateColumnOrders = async (
  boardId: string,
  updateColumns: UpdateColumnOrder[],
): Promise<FeedbackBase> => {
  try {
    const validUser = await isAuthenticated();
    if (!validUser) throw new Error('Unauthorized');

    await dbConnect();

    const board = await Board.findById(boardId)
      .lean()
      .select({ isDefault: 1, userId: 1 });

    if (!board) throw new Error(`No board found`);

    await Column.updateOrders(updateColumns);
    updateTag(`board-${board._id}`);
    if (board.isDefault) updateTag(`board-default-${board.userId.toString()}`);
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message:
        (error as Error)?.message ?? 'Swapping column order was unsuccessful',
    };
  }

  return { success: true, message: 'Swapped column order successfully' };
};
