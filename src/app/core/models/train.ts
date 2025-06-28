export interface Train {
  ID: number;
  No: string;
  TrainType: string;
  Route_From: string;
  Route_To: string;
  Current_Location: string;
}

export interface TrainListViewModel {
  ID: number;
  No: string;
  TrainType: string;
  Route_From: string;
  Route_To: string;
  Current_Location: string;
}

export interface TrainSearchRequest {
  no?: string;
  type?: string;
  stationName?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  Data: T[];
  TotalCount: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
}

export interface TrainStation {
  StationId: number;
  StationName: string;
  ArrivalTime: string;
  Order: number;
}

export interface TrainWithStations {
  TrainNo: string;
  TrainType: string;
  Route_From: string;
  Route_To: string;
  TrainStations: TrainStation[];
}

export interface StationService {
  ServiceName: string;
  Description: string;
  // أضف المزيد من الحقول حسب هيكلية الـ serviceVMs اللي بترجع من الـ API
}

export interface StationServicesResponse {
  StationId: number;
  StationName: string;
  Services: StationService[];
}

export interface GuideRoleResponse {
  refreshToken: string;
  message: string;
}