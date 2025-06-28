export enum LostAndFoundStatus {
  pending = 0,
  verified = 1,
  rejected = 2
}

export interface LostAndFound {
  LfId?: number;
  TrainId: number; // معرف القطر كـ number
  Photo?: string; // URL الصورة
  ItemDescription: string;
  ContactDetails: string;
  DateLost?: string; // التاريخ كـ string لأن الفرونت بيبعت/يستقبل ISO format
  Status?: LostAndFoundStatus;
  UserId?: string;
}

export interface LostAndFoundSearchRequest {
  trainId: number;
  searchDate?: string;
  pageNumber: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  Data: T[];
  PageNumber: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
}