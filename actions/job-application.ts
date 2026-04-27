'use server';

import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { FeedbackBase } from '@/types/api';
import { UpdateJobOrder } from '@/types/db/job-application';
import { getSession } from '@/lib/auth/helper-functions';
import { Board, Column, JobApplication } from '@/lib/db/models';
import dbConnect from '@/lib/db/connect';
import { isAuthenticated } from '@/lib/utils/server-utils';
import { isDefaultBoard } from './board';
import {
  createJobApplicationInputSchema,
  updateJobApplicationInputSchema,
} from '@/lib/validations/job-application';
import type {
  CreateJobApplicationInputType,
  UpdateJobApplicationInputType,
} from '@/lib/validations/job-application';

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

export const createJobApplication = async (
  jobData: CreateJobApplicationInputType,
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

export const updateJobApplication = async (
  id: string,
  updatedJobData: UpdateJobApplicationInputType,
): Promise<FeedbackBase> => {
  try {
    const fullSession = await getSession();
    if (!fullSession?.user) throw new Error('Unauthorized');

    const result = updateJobApplicationInputSchema.safeParse(updatedJobData);
    if (!result.success) throw new Error('Invalid job update data');

    const tags = result.data.tags
      ? result.data.tags.split(',').map((tag) => tag.trim())
      : [];

    const job = {
      ...result.data,
      tags: tags,
    };

    await dbConnect();

    const updatedJob = await JobApplication.findByIdAndUpdate(id, job);
    if (!updatedJob) throw new Error('No job found');

    updateTag(`board-${updatedJob.boardId}`);
    const isDefault = await isDefaultBoard(updatedJob.boardId);
    if (isDefault) updateTag(`board-default-${fullSession.user.id}`);
    return { success: true, message: 'Job updated successfully' };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message:
        (error as Error)?.message ?? 'Failed to update the job application',
    };
  }
};

export const updateJobColumnAndOrder = async (
  boardId: string,
  updatedJobs: UpdateJobOrder[],
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

export const deleteJob = async (id: string): Promise<FeedbackBase> => {
  const session = await JobApplication.startSession();

  try {
    const fullSession = await getSession();
    if (!fullSession?.user) throw new Error('Unauthorized');

    session.startTransaction();

    const deletedJob = await JobApplication.findByIdAndDelete(id, { session });

    if (!deletedJob) {
      throw new Error('No job found');
    }

    const jobColumn = await Column.findById(deletedJob.columnId).session(
      session,
    );

    if (!jobColumn) {
      throw new Error('Inavlid job');
    }

    jobColumn.jobApplications = jobColumn.jobApplications.filter(
      (jobId) => !jobId.equals(deletedJob._id),
    );
    await jobColumn.save();

    const isDefault = await isDefaultBoard(deletedJob.boardId);

    await session.commitTransaction();

    updateTag(`board-${deletedJob.boardId.toString()}`);
    if (isDefault) updateTag(`board-default-${fullSession.user.id}`);
    return { success: true, message: 'Job application deleted successfully' };
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    return {
      success: false,
      message: (error as Error)?.message ?? 'Job application deletion failed',
    };
  } finally {
    await session.endSession();
  }
};
