export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let toasts: Toast[] = [];
let listeners: Array<(t: Toast[]) => void> = [];
let seq = 0;

function emit() {
  for (const l of listeners) l(toasts);
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function show(type: ToastType, message: string) {
  const id = ++seq;
  toasts = [...toasts, { id, type, message }];
  emit();
  setTimeout(() => dismiss(id), 4000);
}

export const toast = {
  success: (m: string) => show('success', m),
  error: (m: string) => show('error', m),
  info: (m: string) => show('info', m),
  dismiss,
  subscribe(l: (t: Toast[]) => void) {
    listeners.push(l);
    l(toasts);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  },
};

/** Pull a human message out of an API error body / Error / unknown. */
export function errorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; code?: string };
    if (typeof e.message === 'string') return e.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
