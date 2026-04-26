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
import { MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import CreateJobApplicationDialog from './create-job-application-dialog';
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
import { JobApplication, UpdateJob } from '@/types/db/job-application';
import { updateColumnOrders } from '@/actions/column';
import { updateJobColumnAndOrder } from '@/actions/job-applications';

interface KanbanBoardProps {
  board: Board;
}

const DroppabaleItem = ({
  columnId,
  job,
}: {
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
  return (
    <Card ref={ref} className="w-full shrink-0 rounded-md p-4 shadow-md">
      <CardHeader>
        <CardTitle>{job.title}</CardTitle>
      </CardHeader>
    </Card>
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
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 cursor-pointer rounded-full text-white hover:bg-white/20"
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
      <CardContent className="flex h-100 flex-col items-center justify-start gap-4 overflow-y-auto rounded-b-lg bg-gray-50/50 py-4">
        <CreateJobApplicationDialog
          boardId={boardId}
          columnId={column.id}
          colorLight={column.colorLight}
          colorDark={column.colorDark}
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
            const movedJobs: UpdateJob[] = [];
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
        try {
          startTransition(async () => {
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
          });
        } catch (error) {
          console.error(error);
          setItems({ ...prevItems.current });
        }
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
        try {
          startTransition(async () => {
            const feedback = await updateColumnOrders(board.id, updateColumns);
            setUpdateColumn(false);
            if (feedback.success) {
              console.log(feedback.message);
            } else {
              throw new Error(feedback.message);
            }
          });
        } catch (error) {
          console.error(error);
          setColumns([...prevColumns.current]);
        }
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
                <DroppabaleItem key={job.id} columnId={column.id} job={job} />
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
