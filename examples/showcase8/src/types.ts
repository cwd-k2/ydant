export type NotificationType = "info" | "warning" | "error";

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  timestamp: number;
}
