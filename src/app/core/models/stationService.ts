export interface Service {
  Id: number;
  StationId: number;
  StationName: string;
  Name: string; 
  Type: number;
  Description: string;
  PhoneNumber: string;
  Location: string;
  Latitude: number;
  Longitude: number;
  IsAvailable: boolean;
  OperatingHours: string;
  Menu: string;
  ImagePath: string;
  MenuImagePath: string;
}

export interface ServiceResponse {
  items?: Service[];
  Data?: Service[];
  Services?: Service[];
  results?: Service[];
  TotalItems?: number;
  PageNumber?: number;
  PageSize?: number;
  TotalPages?: number;
  // Additional properties from actual API response
  StationId?: number;
  StationName?: string;
}