'use server';

import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { z } from 'zod';
import { FeedbackBase } from '@/types/api';
import { CreateJobApplication, UpdateJob } from '@/types/db/job-application';
import { getSession } from '@/lib/auth/helper-functions';
import { Board, Column, JobApplication } from '@/models';
import dbConnect from '@/lib/db';
import { isAuthenticated } from '@/utils/server-utils';

export const getAllJobsByBoardIdByColumnId = async (
  boardId: string,
  _columnId: string,
) => {
  'use cache';
  cacheLife({
    stale: 3600, // 1 hour until considered stale
    revalidate: 7200, // 2 hours until revalidated
    expire: 86400, // 1 day until expired
  });
  cacheTag(`jobs-${boardId}`);

  const validUser = await isAuthenticated();
  if (!validUser) throw new Error('Unauthorized');

  try {
    await dbConnect();
  } catch (error) {
    console.error(error);
  }

  return [];
};

/*
  status: string;
  ** order: number;
  appliedDate: string | Date
*/

const createJobApplicationInputSchema = z.strictObject({
  title: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  position: z.string().min(1).max(100),
  salary: z.string().max(50).optional(),
  location: z.string().max(150).optional(),
  jobUrl: z.string().max(2048).optional(),
  notes: z.string().max(5000).optional(),
  description: z.string().max(5000).optional(),
  tags: z.string().max(500).optional(),
  boardId: z.string().length(24),
  columnId: z.string().length(24),
  userId: z.string().length(24).optional(),
});

export const createJobApplication = async (
  jobData: CreateJobApplication,
): Promise<FeedbackBase> => {
  try {
    const fullSession = await getSession();
    if (!fullSession?.user) throw new Error('Unauthorized');

    const result = createJobApplicationInputSchema.safeParse(jobData);

    if (!result.success) {
      return { success: false, message: 'Invalid input' };
    }

    const tags = result.data.tags
      ? result.data.tags.split(',').map((tag) => tag.trim())
      : [];

    const job = {
      ...result.data,
      userId: fullSession.user.id,
      tags: tags,
    };

    await dbConnect();
    const board = await Board.findById(job.boardId)
      .lean()
      .select({ isDefault: 1 });
    const column = await Column.findById(job.columnId);

    if (!board || !column) throw new Error(`No board or column found`);

    const newJob = await JobApplication.create(job);
    column.jobApplications.push(newJob._id);
    await column.save();

    // Revalidating
    updateTag(`board-${board._id}`);
    if (board.isDefault) updateTag(`board-default-${fullSession.user.id}`);
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: (error as Error).message ?? 'Error creating new job application',
    };
  }

  return { success: true, message: 'New job application added successfully' };
};

export const updateJobColumnAndOrder = async (
  boardId: string,
  updatedJobs: UpdateJob[],
): Promise<FeedbackBase> => {
  try {
    const isValidUser = await isAuthenticated();
    if (!isValidUser) throw new Error('Unauthorized');

    await dbConnect();
    const board = await Board.findById(boardId)
      .lean()
      .select({ isDefault: 1, userId: 1 });
    if (!board) throw new Error('No board found');

    // Update Jobs
    await JobApplication.updateColumnAndOrder(updatedJobs);
    updateTag(`board-${board._id}`);
    if (board.isDefault) updateTag(`board-default-${board.userId.toString()}`);

    return { success: true, message: 'Successfully updated jobs' };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message:
        (error as Error).message ??
        "Updating jobs' column and order was unsuccessful",
    };
  }
};
