import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TrainTracking } from '../models/train-tracking.model';
import { TrainTrackingUpdateDto, GpsUpdateDto, ManualUpdateDto } from '../models/train-tracking-dto.model';

@Injectable({
  providedIn: 'root'
})
export class TrainTrackingService {
  private apiUrl = `${environment.apiUrl}TrainTracking`;

  constructor(private http: HttpClient) {}

  // استرجاع بيانات التتبع النشطة
  getActiveTracking(trainId: number): Observable<TrainTracking> {
    return this.http.get<TrainTracking>(`${this.apiUrl}/${trainId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // تحديث بيانات التتبع
  updateTracking(dto: TrainTrackingUpdateDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/update`, dto, {
      headers: this.getAuthHeaders()
    });
  }

  // تحديث بيانات GPS
  updateGps(dto: GpsUpdateDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/gps-update`, dto, {
      headers: this.getAuthHeaders()
    });
  }

  // تحديث يدوي
  updateManual(dto: ManualUpdateDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/manual-update`, dto, {
      headers: this.getAuthHeaders()
    });
  }

  // استرجاع سجل التتبع
  getTrackingHistory(trainId: number, startDate?: string, endDate?: string): Observable<TrainTracking[]> {
    let url = `${this.apiUrl}/history/${trainId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<TrainTracking[]>(url, {
      headers: this.getAuthHeaders()
    });
  }

  // طلب دور Guide
  requestGuideRole(): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-guide-role`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}` // افتراض استخدام JWT
    });
  }
}