export interface TrainTracking {
  ID: number;
  TrainID: number;
  TrainNo: string;
  CurrentStationId: number;
  CurrentStationName: string;
  NextStationId: number;
  NextStationName: string;
  Latitude: number;
  Longitude: number;
  ExpectedArrival: string;
  Status: string;
  DistanceToNextStation: number;
  Speed: number;
  LastUpdated: string;
  GuideId: string;
}