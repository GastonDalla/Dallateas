"use client";

import { toast as sonnerToast } from "sonner";
import { WebHaptics } from "web-haptics";

const haptics = new WebHaptics();

type ToastArgs = Parameters<typeof sonnerToast.success>;

export const htoast = {
  ...sonnerToast,
  success: (...args: ToastArgs) => {
    haptics.trigger("success");
    return sonnerToast.success(...args);
  },
  error: (...args: ToastArgs) => {
    haptics.trigger("error");
    return sonnerToast.error(...args);
  },
  warning: (...args: ToastArgs) => {
    haptics.trigger("warning");
    return sonnerToast.warning(...args);
  },
  info: (...args: Parameters<typeof sonnerToast.info>) => {
    return sonnerToast.info(...args);
  },
};
