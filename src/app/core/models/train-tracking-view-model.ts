export interface TrainTrackingViewModel {
  id: number;
  trainId: number;
  trainNo: string;
  currentStationId?: number;
  currentStationName: string;
  nextStationId?: number;
  nextStationName: string;
  latitude: number;
  longitude: number;
  expectedArrival: string;
  status: string;
  distanceToNextStation?: number;
  speed?: number;
  lastUpdated: string;
  guideId?: string;
  guideName: string;
}