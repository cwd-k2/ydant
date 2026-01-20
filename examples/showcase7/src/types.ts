export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export interface Notification {
  id: number;
  title: string;
  message: string;
}
