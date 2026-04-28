import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useTransition,
} from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';
import { FeedbackBase } from '@/types/api';
import { toast } from '@/lib/utils/toast';
import { Spinner } from './ui/spinner';
import { cn } from '@/lib/utils';

interface ConfirmDeleteDialogProps extends PropsWithChildren {
  title: string;
  description?: string;
  deleteItemInfo?: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onConfirm: () => Promise<FeedbackBase>;
}

const ConfirmDeleteDialog = ({
  title,
  description,
  deleteItemInfo,
  open,
  setOpen,
  onConfirm,
}: ConfirmDeleteDialogProps) => {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const result = await onConfirm();
        if (result.success) {
          toast.success(result.message);
          setOpen(false);
        } else {
          toast.error(result.message);
          throw new Error(result.message);
        }
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description
              ? description
              : `Are you sure you want to delete${deleteItemInfo && ` ${deleteItemInfo}`}?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row items-center justify-end">
          <DialogClose
            render={
              <div
                className={cn('cursor-pointer', {
                  'cursor-not-allowed': isPending,
                })}
              >
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={isPending}
                  aria-disabled={isPending}
                  tabIndex={isPending ? -1 : 0}
                >
                  Cancel
                </Button>
              </div>
            }
          />
          <div
            className={cn({
              'cursor-not-allowed': isPending,
            })}
          >
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              className="cursor-pointer"
              disabled={isPending}
              aria-disabled={isPending}
              tabIndex={isPending ? -1 : 0}
            >
              {isPending && (
                <Spinner data-icon="inline-start" className="-mt-0.5" />
              )}
              <span>{isPending ? 'Deleting' : 'Delete'}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
