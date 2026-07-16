export type ToastVariant = "success"| "error" | "info";

export type ToastOptions = { //The parametrics that must be passed for ToastOptions
    message: string;
    variant?: ToastVariant;
    duration?: number;
}

export const DEFAULT_DURATION = 3000; 