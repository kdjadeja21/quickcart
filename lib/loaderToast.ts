import { toast } from 'sonner';

let pendingRequests = 0;
const TOAST_ID = 'api-loading';

export function startApiLoading(message: string = 'Working...'): void {
  pendingRequests += 1;
  if (pendingRequests === 1) {
    toast.loading(message, { id: TOAST_ID, duration: Infinity });
  }
}

export function endApiLoading(): void {
  pendingRequests = Math.max(0, pendingRequests - 1);
  if (pendingRequests === 0) {
    toast.dismiss(TOAST_ID);
  }
}


