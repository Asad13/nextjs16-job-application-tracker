import { ReactNode, ReactElement } from 'react';
import { toast as sonnerToast, type ExternalToast } from 'sonner';

type ToastType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading'
  | 'message';
type ToastMessage = (() => ReactNode) | ReactNode;
export type ToastProps = Record<
  ToastType,
  (_message: ToastMessage, _data?: ExternalToast) => string | number
> & {
  custom: (
    _jsx: (_id: number | string) => ReactElement,
    _data?: ExternalToast,
  ) => string | number;
  dismiss: (_id?: number | string) => string | number;
};

const DEFAULT_TOAST_DATA: ExternalToast = {
  position: 'top-right',
};

export const toast: ToastProps = {
  default: (message: ToastMessage, data?: ExternalToast) =>
    sonnerToast(message, {
      ...DEFAULT_TOAST_DATA,
      classNames: {
        toast: '!bg-gray-500 !text-white',
      },
      ...data,
    }),
  success: (message: ToastMessage, data?: ExternalToast) =>
    sonnerToast.success(message, {
      ...DEFAULT_TOAST_DATA,

      classNames: {
        toast: '!bg-green-600 !text-white',
      },
      ...data,
    }),
  error: (message: ToastMessage, data?: ExternalToast) =>
    sonnerToast.error(message, {
      ...DEFAULT_TOAST_DATA,
      classNames: {
        toast: '!bg-red-500 !text-white',
      },
      ...data,
    }),
  warning: (message: ToastMessage, data?: ExternalToast) =>
    sonnerToast.warning(message, {
      ...DEFAULT_TOAST_DATA,
      classNames: {
        toast: '!bg-orange-500 !text-white',
      },
      ...data,
    }),
  info: (message: ToastMessage, data?: ExternalToast) =>
    sonnerToast.warning(message, {
      ...DEFAULT_TOAST_DATA,
      classNames: {
        toast: '!bg-cyan-600 !text-white',
      },
      ...data,
    }),
  loading: (message: ToastMessage, data?: ExternalToast) =>
    sonnerToast.warning(message, {
      ...DEFAULT_TOAST_DATA,
      classNames: {
        toast: '!bg-indigo-500 !text-white',
      },
      ...data,
    }),
  message: (message: ToastMessage, data?: ExternalToast) =>
    sonnerToast.warning(message, {
      ...DEFAULT_TOAST_DATA,
      classNames: {
        toast: '!bg-gray-500 !text-white',
      },
      ...data,
    }),
  custom: (jsx: (_id: number | string) => ReactElement, data?: ExternalToast) =>
    toast.custom(jsx, { ...DEFAULT_TOAST_DATA, ...data }),
  dismiss: (id?: number | string) => sonnerToast.dismiss(id),
};
