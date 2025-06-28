import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrainTrackingViewModel } from '../../core/models/train-tracking-view-model';
import { TrainTrackingUpdateDto } from '../../core/models/train-tracking-update-dto';
import { GpsUpdateDto } from '../../core/models/gps-update-dto';
import { ManualUpdateDto } from '../../core/models/manual-update-dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrainTrackingService {
  private apiUrl = `${environment.apiUrl}TrainTracking`;

  constructor(private http: HttpClient) {}

  getActiveTracking(trainId: number): Observable<TrainTrackingViewModel> {
    return this.http.get<TrainTrackingViewModel>(`${this.apiUrl}/${trainId}`);
  }

  updateTracking(dto: TrainTrackingUpdateDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/update`, dto);
  }

  updateGps(dto: GpsUpdateDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/gps-update`, dto);
  }

  updateManual(dto: ManualUpdateDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/manual-update`, dto);
  }

  getTrackingHistory(trainId: number, startDate?: Date, endDate?: Date): Observable<TrainTrackingViewModel[]> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }
    return this.http.get<TrainTrackingViewModel[]>(`${this.apiUrl}/history/${trainId}`, { params });
  }
}