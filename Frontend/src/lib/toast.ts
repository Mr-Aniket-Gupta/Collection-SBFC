import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastOptions = ExternalToast;

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    sonnerToast.success(message, options),
  error: (message: string, options?: ToastOptions) =>
    sonnerToast.error(message, options),
  info: (message: string, options?: ToastOptions) =>
    sonnerToast.info(message, options),
  warning: (message: string, options?: ToastOptions) =>
    sonnerToast.warning(message, options),
};

export type AppToast = typeof toast;
