type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
  key: number;
}

let listener: ((state: ToastState) => void) | null = null;
let counter = 0;

export function registerToastListener(fn: (state: ToastState) => void) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

export function showToast(message: string, type: ToastType = "info") {
  counter += 1;
  listener?.({ message, type, key: counter });
}
