export interface Notification {
  Id: number;
  TrainId: number;
  Message: string;
  NotificationTime: string;
  UserName: string;
  IsRead?: boolean;
}