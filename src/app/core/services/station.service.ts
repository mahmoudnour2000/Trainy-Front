import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interface for station data - can be updated when real API is ready
export interface Station {
  id: number;
  name: string;
  location: string;
}

export interface StationResponse {
  data: Station[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class StationService {
  private baseUrl = `${environment.apiUrl}StationsApi`;

  constructor(private http: HttpClient) {}

  // TODO: Implement this method when the real API is ready
  getStations(pageNumber: number = 1, pageSize: number = 100, searchString: string = ''): Observable<StationResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (searchString) params = params.set('searchString', searchString);
    
    return this.http.get<StationResponse>(`${this.baseUrl}`, { params })
      .pipe(
        tap(response => console.log('Stations API Response:', response)),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching stations:', error);
          return throwError(() => new Error(`Failed to fetch stations: ${error.statusText} - ${error.message}`));
        })
      );
  }

  // TODO: Add more methods as needed when the API is ready
  // getStationById(id: number): Observable<Station> { ... }
  // createStation(station: Station): Observable<Station> { ... }
  // updateStation(id: number, station: Station): Observable<Station> { ... }
  // deleteStation(id: number): Observable<void> { ... }
} 