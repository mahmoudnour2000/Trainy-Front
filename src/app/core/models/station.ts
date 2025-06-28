export interface Station {
  ID: number;
  Name: string;
  Latitude: number;
  Longitude: number;
  Location: string;
}

export interface StationResponse {
  Data: Station[];
  TotalItems: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
}