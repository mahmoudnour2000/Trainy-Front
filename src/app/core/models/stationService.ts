export interface Service {
  Id: number;
  stationId: number;
  stationName: string;
  Name: string; 
  type: string;
  Description: string;
  phoneNumber: string;
  location: string;
  Latitude: number;
  Longitude: number;
  isAvailable: boolean;
  operatingHours: string;
  menu: string;
  imagePath: string;
  menuImagePath: string;
}

export interface ServiceResponse {
    items?: Service[];
  Data?: Service[];
  Services?: Service[];
  results?: Service[]; // أضف results كخيار
  TotalItems: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
}