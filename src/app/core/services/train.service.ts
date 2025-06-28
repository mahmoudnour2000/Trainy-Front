import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
searchTrains(request: TrainSearchRequest = {}): Observable<PaginatedResponse<TrainListViewModel>> {
    const params: { [key: string]: string } = {
      pageNumber: (request.pageNumber?.toString() || '1'),
      pageSize: (request.pageSize?.toString() || '10')
    };
    if (request['no'] && request['no'].trim() !== '') params['no'] = request['no'];
    if (request['type'] && request['type'].trim() !== '') params['type'] = request['type'];
    if (request['stationName'] && request['stationName'].trim() !== '') params['stationName'] = request['stationName'];

    return this.http.get<PaginatedResponse<TrainListViewModel>>(`${this.apiUrl}/search`, { params });
  }

  getTrainStations(trainId: number, searchTerm: string = ''): Observable<PaginatedResponse<TrainStation>> {
    const params: { [key: string]: string } = { pageSize: '100' };
    if (searchTerm.trim()) params['stationName'] = searchTerm;
    return this.http.get<PaginatedResponse<TrainStation>>(`${this.apiUrl}/stations/${trainId}`, { params });
  }

  getServicesByStationId(StationId: number): Observable<StationServicesResponse> {
    return this.http.get<StationServicesResponse>(`http://localhost:5299/api/StationServicesApi/ByStation/${StationId}`);
  }


  requestGuideRole(): Observable<GuideRoleResponse> {
    return this.http.post<GuideRoleResponse>(`http://localhost:5299/api/TrainTracking/request-guide-role`, { });
  }
} 

