import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TrainListViewModel, TrainSearchRequest, PaginatedResponse,TrainWithStations,TrainStation
, StationServicesResponse, StationService, GuideRoleResponse
 } from '../models/train';
@Injectable({
  providedIn: 'root'
})
export class TrainService {
  private apiUrl = `${environment.apiUrl}TrainApi`;
private stationApiUrl = `${environment.apiUrl}Station`;
  constructor(private http: HttpClient) { }
 private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  
  //used in train-list.component.ts
  getAllTrains(pageNumber: number = 1, pageSize: number = 2): Observable<PaginatedResponse<TrainListViewModel>> {
    return this.http.get<PaginatedResponse<TrainListViewModel>>(this.apiUrl, {
      params: { pageNumber: pageNumber.toString(), pageSize: pageSize.toString() }
    });
  }
//used in train-details.component.ts
  getTrainById(trainId: number): Observable<TrainListViewModel> {
    return this.http.get<TrainListViewModel>(`${this.apiUrl}/train/${trainId}`);
  }

  //Not used in any component yet
 searchTrains(request: TrainSearchRequest): Observable<PaginatedResponse<TrainListViewModel>> {
    let params = new HttpParams()
      .set('pageNumber', (request.pageNumber ?? 1).toString()) // قيمة افتراضية 1
      .set('pageSize', (request.pageSize ?? 10).toString()); // قيمة افتراضية 10
    if (request.no) params = params.set('no', request.no);
    if (request.type) params = params.set('type', request.type);
    if (request.stationName) params = params.set('routeFrom', request.stationName);
    return this.http.get<PaginatedResponse<TrainListViewModel>>(`${this.apiUrl}/searchByRouteFrom`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  getStations(searchString: string = '', pageNumber: number = 1, pageSize: number = 20): Observable<PaginatedResponse<{ Name: string; Location: string }>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (searchString) params = params.set('searchString', searchString);
    return this.http.get<PaginatedResponse<{ Name: string; Location: string }>>(`${this.stationApiUrl}/all`, { params });
  }

  getTrainTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/types`, {
      headers: this.getAuthHeaders()
    });
  }

  getTrainNumbers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/numbers`, {
      headers: this.getAuthHeaders()
    });
  }

  getTrainStations(trainId: number, searchTerm: string = '', page: number = 1, pageSize: number = 4): Observable<PaginatedResponse<TrainStation>> {
  const params: { [key: string]: string } = { 
    pageNumber: page.toString(),
    pageSize: pageSize.toString() 
  };
  
  if (searchTerm.trim()) {
    params['stationName'] = searchTerm;
  }
  
  return this.http.get<PaginatedResponse<TrainStation>>(`${this.apiUrl}/stations/${trainId}`, { params });
}

  getServicesByStationId(StationId: number): Observable<StationServicesResponse> {
    return this.http.get<StationServicesResponse>(`http://localhost:5299/api/StationServicesApi/ByStation/${StationId}`);
  }


  requestGuideRole(): Observable<GuideRoleResponse> {
    return this.http.post<GuideRoleResponse>(`http://localhost:5299/api/TrainTracking/request-guide-role`, { });
  }

  isUserGuide(trainId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/trains/${trainId}/is-guide`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token')}`
      })
    });
  }
} 

