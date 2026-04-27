'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { transformDoc } from '@/lib/db/helper-functions';
import { Board } from '@/lib/db/models';
import { Board as IBoard } from '@/types/db/board';
import { Column as IColumn } from '@/types/db/column';
import { JobApplication as IJobApplication } from '@/types/db/job-application';
import dbConnect from '@/lib/db/connect';
import { Types } from 'mongoose';

export const isDefaultBoard = async (id: Types.ObjectId): Promise<boolean> => {
  try {
    const board = await Board.findById(id).lean().select({ isDefault: 1 });
    if (!board) throw new Error('No board found');
    return board.isDefault;
  } catch (error) {
    throw error;
  }
};

export const getDefaultBoard = async (
  userId: string,
): Promise<IBoard | null> => {
  'use cache';
  cacheLife('hours');
  cacheTag(`board-default-${userId}`);

  try {
    await dbConnect();

    const boardDoc = await Board.findOne({ userId, isDefault: true })
      .lean()
      .populate({
        path: 'columns',
        options: { sort: { order: 1 } },
        populate: {
          path: 'jobApplications',
          options: { sort: { order: 1 } },
        },
      });

    const board: IBoard | null = boardDoc
      ? JSON.parse(JSON.stringify(transformDoc<IBoard>(boardDoc)))
      : null;

    if (board) {
      board.columns = board.columns.map(transformDoc<IColumn>);
      board.columns.forEach((column) => {
        column.jobApplications = column.jobApplications.map(
          transformDoc<IJobApplication>,
        );
      });
    }

    return board;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getBoardById = async (id: string): Promise<IBoard | null> => {
  'use cache';
  cacheLife('hours');
  cacheTag(`board-${id}`);

  try {
    await dbConnect();

    const boardDoc = await Board.findById(id)
      .lean()
      .populate({
        path: 'columns',
        options: { sort: { order: 1 } },
        populate: {
          path: 'jobApplications',
          options: { sort: { order: 1 } },
        },
      });

    const board: IBoard | null = boardDoc
      ? JSON.parse(JSON.stringify(transformDoc<IBoard>(boardDoc)))
      : null;

    if (board) {
      board.columns = board.columns.map(transformDoc<IColumn>);
      board.columns.forEach((column) => {
        column.jobApplications = column.jobApplications.map(
          transformDoc<IJobApplication>,
        );
      });
    }

    return board;
  } catch (error) {
    console.error(error);
    return null;
  }
};
