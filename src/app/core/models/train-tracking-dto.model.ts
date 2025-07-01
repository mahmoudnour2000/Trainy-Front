export interface TrainTrackingUpdateDto {
  TrainId: number;
  Latitude: number;
  Longitude: number;
  ExpectedArrival: string;
}

export interface GpsUpdateDto extends TrainTrackingUpdateDto {
  Speed: number;
}

export interface ManualUpdateDto extends TrainTrackingUpdateDto {}