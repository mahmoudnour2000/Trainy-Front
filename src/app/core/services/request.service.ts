import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from './offer.service';

export interface Request {
  id: number;
  offerId: number;
  courierId: string;
  CourierId?: string;
  courierName?: string;
  courierImage?: string;
  CourierName?: string;
  CourierImage?: string;
  message: string;
  status: RequestStatus;
  Status?: RequestStatus;
  createdAt: Date;
  fromStationId?: number;
  pickupStationName?: string;
  PickupStationName?: string; // Added for backend compatibility
  senderId?: string;
  offerDescription?: string;
  updatedAt?: Date;
}

export enum RequestStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  Completed = 3
}

export interface RequestCreateModel {
  offerId: number;
  message: string;
  fromStationId: number;
  courierAge: number;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private apiUrl = `${environment.apiUrl}Request`;
  
  // Store offer details temporarily for components to share
  private offerDetailsSubject = new BehaviorSubject<any>(null);
  
  constructor(private http: HttpClient) { }
  
  // Temporary methods for offer details sharing between components
  setOfferDetails(offerDetails: any): void {
    this.offerDetailsSubject.next(offerDetails);
  }
  
  getOfferDetails(): Observable<any> {
    return this.offerDetailsSubject.asObservable();
  }
  
  // GET /api/Request
  getRequests(pageNumber = 1, pageSize = 10): Observable<PaginatedResponse<Request>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<Request>>(`${this.apiUrl}`, { params });
  }
  
  // GET /api/Request/{id}
  getRequestById(id: number): Observable<Request> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapBackendResponseToRequest(response))
    );
  }

  // Helper method to map backend response to frontend Request model
  private mapBackendResponseToRequest(backendResponse: any): Request {
    return {
      id: backendResponse.id || backendResponse.Id,
      offerId: backendResponse.offerId || backendResponse.OfferId,
      courierId: backendResponse.courierId || backendResponse.CourierId,
      CourierId: backendResponse.courierId || backendResponse.CourierId,
      courierName: backendResponse.courierName || backendResponse.CourierName,
      courierImage: backendResponse.courierImage || backendResponse.CourierImage,
      CourierName: backendResponse.courierName || backendResponse.CourierName,
      CourierImage: backendResponse.courierImage || backendResponse.CourierImage,
      message: backendResponse.message || backendResponse.Message,
      status: backendResponse.status !== undefined ? backendResponse.status : backendResponse.Status,
      Status: backendResponse.status !== undefined ? backendResponse.status : backendResponse.Status,
      createdAt: new Date(backendResponse.createdAt || backendResponse.CreatedAt),
      fromStationId: backendResponse.fromStationId || backendResponse.FromStationId,
      pickupStationName: backendResponse.pickupStationName || backendResponse.PickupStationName,
      PickupStationName: backendResponse.pickupStationName || backendResponse.PickupStationName,
      senderId: backendResponse.senderId || backendResponse.SenderId,
      offerDescription: backendResponse.offerDescription || backendResponse.OfferDescription,
      updatedAt: backendResponse.updatedAt ? new Date(backendResponse.updatedAt) : 
                  backendResponse.UpdatedAt ? new Date(backendResponse.UpdatedAt) : undefined
    };
  }
  
  // POST /api/Request
  createRequest(requestData: RequestCreateModel): Observable<Request> {
    return this.http.post<Request>(`${this.apiUrl}`, requestData);
  }


  
  // PUT /api/Request/{id}
  updateRequest(id: number, requestData: Partial<RequestCreateModel>): Observable<Request> {
    return this.http.put<Request>(`${this.apiUrl}/${id}`, requestData);
  }
  
  // DELETE /api/Request/{id}
  deleteRequest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  // GET /api/Request/offer/{offerId}
  getRequestsForOffer(offerId: number, pageNumber = 1, pageSize = 10): Observable<{ requests: Request[], totalCount: number, pageSize: number, pageNumber: number }> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any>(`${this.apiUrl}/offer/${offerId}`, { params }).pipe(
      map(response => ({
        requests: response.Data || [],
        totalCount: response.TotalCount,
        pageSize: response.PageSize,
        pageNumber: response.PageNumber
      }))
    );
  }
  
  // GET /api/Request/courier/{courierId}
  getRequestsByCourier(courierId: string, pageNumber = 1, pageSize = 10): Observable<PaginatedResponse<Request>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<Request>>(`${this.apiUrl}/courier/${courierId}`, { params });
  }
  
  // POST /api/Request/{requestId}/accept
  acceptRequest(requestId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${requestId}/accept`, {});
  }
  
  // POST /api/Request/{requestId}/reject
  rejectRequest(requestId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${requestId}/reject`, {});
  }
  
  // PUT /api/Request/{id}/status
  updateRequestStatus(id: number, status: RequestStatus): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, status, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Helper method to check if user has existing request for an offer
  // This is checked automatically by backend in CreateRequest, but useful for frontend validation
  hasExistingRequest(offerId: number, courierId: string): Observable<boolean> {
    return this.getRequestsByCourier(courierId).pipe(
      map(response => response.items.some(request => request.offerId === offerId && request.status === RequestStatus.Pending))
    );
  }
} 