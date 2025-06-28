import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Station, StationResponse } from '../models/station';
import { ServiceResponse } from '../models/stationService';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = `${environment.apiUrl}StationsApi`; // تحديث المسار
  private baseUrl2 = `${environment.apiUrl}`; // تحديث المسار

  constructor(private http: HttpClient) {}

  
 getStations(pageNumber: number = 1, pageSize: number = 6, searchString: string = ''): Observable<StationResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (searchString) params = params.set('searchString', searchString);
    const headers = new HttpHeaders({
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...0RHo76C433JYNYKd4GbRs5EC6E4V6_o_biiylZj1vhY'
    });
    return this.http.get<StationResponse>(`${this.baseUrl}`, { params, headers })
      .pipe(
        tap(response => console.log('Stations API Response:', response)),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching stations:', error);
          return throwError(() => new Error(`Failed to fetch stations: ${error.statusText} - ${error.message}`));
        })
      );
  }


getServices(stationId: number, pageNumber: number = 1, pageSize: number = 6, searchString: string = ''): Observable<ServiceResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (searchString) params = params.set('searchString', searchString);
    const headers = new HttpHeaders({
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...0RHo76C433JYNYKd4GbRs5EC6E4V6_o_biiylZj1vhY'
    });
    return this.http.get<ServiceResponse>(`${this.baseUrl2}StationServicesApi/ByStation/${stationId}`, { params, headers })
      .pipe(
        tap(response => console.log('Services API Response:', response)),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching services:', error);
          return throwError(() => new Error(`Failed to fetch services: ${error.statusText} - ${error.message}`));
        })
      );
  }
}
