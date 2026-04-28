'use client';

import { Board } from '@/types/db/board';
import { Column, UpdateColumnOrder } from '@/types/db/column';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import DynamicIcon from './DynamicIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import {
  ExternalLink,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { ReactNode, startTransition, useEffect, useRef, useState } from 'react';
import {
  DragDropProvider,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/react';
import { CollisionPriority } from '@dnd-kit/abstract';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { JobApplication, UpdateJobOrder } from '@/types/db/job-application';
import { updateColumnOrders } from '@/actions/column';
import { deleteJob, updateJobColumnAndOrder } from '@/actions/job-application';
import JobApplicationDialog, {
  JobData,
  Purpose,
} from './job-application-dialog';
import ConfirmDeleteDialog from './confirm-delete-dialog';

interface KanbanBoardProps {
  board: Board;
}

const DroppabaleItem = ({
  boardId,
  columnId,
  job,
}: {
  boardId: string;
  columnId: string;
  job: JobApplication;
}) => {
  const { ref } = useSortable({
    id: job.id,
    index: job.order,
    type: 'item',
    accept: 'item',
    group: columnId,
  });
  const [open, setOpen] = useState<boolean>(false);
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] =
    useState<boolean>(false);
  const [purpose, setPurpose] = useState<Purpose>('view');
  const { tags, ...rest } = job;
  const jobData = rest as JobData;
  if (tags && tags.length > 0) {
    jobData.tags = tags.join(', ');
  }
  return (
    <>
      <JobApplicationDialog
        boardId={boardId}
        columnId={columnId}
        jobData={jobData}
        open={open}
        setOpen={setOpen}
        showTrigger={false}
        purpose={purpose}
        setPurpose={setPurpose}
      />
      <ConfirmDeleteDialog
        title="Delete Job"
        deleteItemInfo={`the job "${job.title}"`}
        open={openConfirmDeleteDialog}
        setOpen={setOpenConfirmDeleteDialog}
        onConfirm={() => deleteJob(job.id)}
      />
      <Card
        ref={ref}
        className="w-full shrink-0 rounded-md px-2 py-4 shadow-md active:bg-gray-200"
      >
        <CardHeader className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1 text-sm font-semibold text-black">
              {job.title}
            </CardTitle>
            <p className="text-primary line-clamp-1">{job.company}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 cursor-pointer rounded-full text-black hover:bg-black/20 focus-visible:bg-black/20"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className="cursor-pointer text-yellow-600 hover:bg-yellow-200 not-data-[variant=destructive]:hover:**:text-yellow-200 not-data-[variant=destructive]:focus:**:text-yellow-600 focus-visible:bg-yellow-200"
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPurpose('view');
                      setOpen(true);
                    }}
                  />
                }
              >
                <Eye className="-mt-0.5 mr-2 h-4 w-4" />
                <span>View Full</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-sky-600 hover:bg-sky-200 not-data-[variant=destructive]:hover:**:text-sky-200 not-data-[variant=destructive]:focus:**:text-sky-600 focus-visible:bg-sky-200"
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPurpose('edit');
                      setOpen(true);
                    }}
                  />
                }
              >
                <Pencil className="-mt-0.5 mr-2 h-4 w-4" />
                <span>Edit Job</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenConfirmDeleteDialog(true);
                    }}
                  />
                }
              >
                <Trash2 className="-mt-0.5 mr-2 h-4 w-4" />
                <span>Delete Job</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-3 text-sm">
            {job.description}
          </p>
          {job?.tags && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {job.tags.map((tag, index) => (
                <span
                  key={`job-tag-${index}`}
                  className="inline-block rounded-2xl bg-sky-200 px-2 py-0.5 text-xs leading-none font-semibold text-sky-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {job?.jobUrl && (
            <Button
              type="button"
              variant="link"
              className="flex-start mt-2 cursor-pointer p-0"
              render={
                <a
                  href={job.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Visit Job URL"
                />
              }
              onClick={() => {
                console.log('Show Job Details');
              }}
            >
              <ExternalLink className="text-primary hover:text-primary/80 focus:text-primary/80 h-6 w-6" />
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
};

const DroppableColumn = ({
  boardId,
  column,
  children,
}: {
  boardId: string;
  column: Column;
  children: ReactNode;
}) => {
  const { ref } = useSortable({
    id: column.id,
    index: column.order,
    type: 'column',
    accept: ['item', 'column'],
    collisionPriority: CollisionPriority.Low,
  });

  const [open, setOpen] = useState<boolean>(false);

  return (
    <Card ref={ref} className="w-72 shrink-0 p-0 shadow-lg">
      <CardHeader
        style={{ backgroundColor: column.colorLight }}
        className="rounded-t-lg py-3 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DynamicIcon name={column.icon} className="h-4 w-4" />
            <CardTitle>
              <h3 className="text-base font-semibold text-white">
                {column.name}
              </h3>
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 cursor-pointer rounded-full text-white hover:bg-white/20 focus-visible:bg-white/20"
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="flex min-w-36 flex-col gap-1"
            >
              <DropdownMenuItem
                className="cursor-pointer text-emerald-600 hover:bg-emerald-200 not-data-[variant=destructive]:hover:**:text-emerald-600 focus:bg-emerald-200 not-data-[variant=destructive]:focus:**:text-emerald-600"
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setOpen(true);
                    }}
                  />
                }
              >
                <Plus className="-mt-0.5 mr-2 h-4 w-4" />
                <span>Add Job</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-sky-600 hover:bg-sky-200 not-data-[variant=destructive]:hover:**:text-sky-600 focus:bg-sky-200 not-data-[variant=destructive]:focus:**:text-sky-600"
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      console.log(
                        `Open edit column dialog for the column with ID: ${column.id}`,
                      );
                    }}
                  />
                }
              >
                <Pencil className="-mt-0.5 mr-2 h-4 w-4" />
                <span>Edit Column</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full items-center justify-start"
                    onClick={() => {
                      console.log(
                        `Open delete column dialog for the column with ID: ${column.id}`,
                      );
                    }}
                  />
                }
              >
                <Trash2 className="-mt-0.5 mr-2 h-4 w-4" />
                <span>Delete Column</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent
        tabIndex={0}
        className="no-scrollbar flex h-100 flex-col items-center justify-start gap-4 overflow-y-auto rounded-b-lg bg-gray-50/50 py-4 focus:border-none focus:outline-none"
      >
        <JobApplicationDialog
          boardId={boardId}
          columnId={column.id}
          color={column.colorLight}
          open={open}
          setOpen={setOpen}
        />
        {children}
      </CardContent>
    </Card>
  );
};

const KanbanBoard = ({ board }: KanbanBoardProps) => {
  const [updateColumn, setUpdateColumn] = useState<boolean>(false);
  const [updatItem, setUpdateItem] = useState<boolean>(false);
  const [columns, setColumns] = useState([...board.columns]);

  const [items, setItems] = useState(
    Object.fromEntries(
      columns.map((column) => [
        column.id,
        column.jobApplications as JobApplication[],
      ]),
    ),
  );

  const prevColumns = useRef(columns);
  const prevItems = useRef(items);

  useEffect(() => {
    if (updatItem) {
      const updatedJobs = Object.entries(items)
        .map(
          ([columnId, jobApplications]: [
            columnId: string,
            jobApplications: JobApplication[],
          ]) => {
            const movedJobs: UpdateJobOrder[] = [];
            for (let i = 0; i < jobApplications.length; i++) {
              if (jobApplications[i].columnId !== columnId) {
                movedJobs.push({
                  id: jobApplications[i].id,
                  columnId: columnId,
                  order: i,
                });
              } else if (jobApplications[i].order !== i) {
                movedJobs.push({
                  id: jobApplications[i].id,
                  columnId: columnId,
                  order: i,
                });
              }
            }

            return movedJobs;
          },
        )
        .flat();

      if (updatedJobs.length > 0) {
        startTransition(async () => {
          try {
            const feedback = await updateJobColumnAndOrder(
              board.id,
              updatedJobs,
            );
            setUpdateItem(false);
            if (feedback.success) {
              console.log(feedback.message);
            } else {
              throw new Error(feedback.message);
            }
          } catch (error) {
            console.error(error);
            setItems({ ...prevItems.current });
          }
        });
      }
    }
  }, [items, board.id, updatItem]);

  useEffect(() => {
    if (updateColumn) {
      const changedColumnIds: string[] = [];
      const updateColumns = columns
        .map((column, index) => {
          if (column.order !== index) {
            changedColumnIds.push(column.id);
          }

          return {
            id: column.id,
            order: index,
          };
        })
        .filter((column) =>
          changedColumnIds.includes(column.id),
        ) as UpdateColumnOrder[];

      if (updateColumns.length > 0) {
        startTransition(async () => {
          try {
            const feedback = await updateColumnOrders(board.id, updateColumns);
            setUpdateColumn(false);
            if (feedback.success) {
              console.log(feedback.message);
            } else {
              throw new Error(feedback.message);
            }
          } catch (error) {
            console.error(error);
            setColumns([...prevColumns.current]);
          }
        });
      }
    }
  }, [columns, board.id, updateColumn]);

  return (
    <div className="flex-1">
      <ScrollArea
        className="mx-auto w-full max-w-7xl flex-row rounded-lg border py-4 lg:py-6 2xl:max-w-4/5"
        viewportClassName="flex gap-4 md:gap-6 items-center -my-4 py-4 lg:-my-6 py-6 [&>*:first-child]:ml-4 after:content-[''] after:block after:min-w-[1px] after:shrink-0"
      >
        <DragDropProvider
          onDragStart={(event: DragStartEvent) => {
            if (event.operation.source?.type === 'column') {
              prevColumns.current = columns;
            }
            prevItems.current = items;
          }}
          onDragOver={(event: DragOverEvent) => {
            if (event.operation.source?.type === 'column') return;

            setItems((oldItems) => move(oldItems, event));
          }}
          onDragEnd={(event: DragEndEvent) => {
            if (event.canceled) {
              if (event.operation.source?.type === 'item') {
                setItems(prevItems.current);
              }

              return;
            }

            if (event.operation.source?.type === 'column') {
              setColumns((prevColumns) => move(prevColumns, event));
              setUpdateColumn(true);
            } else {
              setUpdateItem(true);
            }
          }}
        >
          {columns.map((column) => (
            <DroppableColumn key={column.id} boardId={board.id} column={column}>
              {items[column.id].map((job) => (
                <DroppabaleItem
                  key={job.id}
                  boardId={board.id}
                  columnId={column.id}
                  job={job}
                />
              ))}
            </DroppableColumn>
          ))}
          {/* <DragOverlay>
            <p>Drop here...</p>
          </DragOverlay> */}
        </DragDropProvider>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default KanbanBoard;
