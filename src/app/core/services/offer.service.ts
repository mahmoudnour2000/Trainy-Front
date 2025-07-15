import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface Offer {
  id: number;
  description: string;
  price: number;
  weight: number;
  fromStationId: number;
  toStationId: number;
  fromStationName?: string;
  toStationName?: string;
  from?: number;
  to?: number;
  senderId: string;
  senderName?: string;
  senderImage?: string;
  SenderName?: string;
  SenderImage?: string;
  category: string;
  isBreakable: boolean;
  image?: string;
  createdAt: Date;
  status: OfferStatus;
  requestsCount?: number;
  paymentMethod: string;
}

export enum OfferStatus {
  Pending = 0,
  InProgress = 1,
  OnWay = 2,
  Delivered = 3,
  Completed = 4,
  Canceled = 5
}

export interface OfferCreateModel {
  title: string;
  description: string;
  price: number;
  weight: number;
  fromStationId: number;
  toStationId: number;
  category: string;
  isBreakable: boolean;
  image?: File;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private apiUrl = `${environment.apiUrl}Offer`;

  constructor(private http: HttpClient) { }

  // GET /api/Offer
  getOffers(pageNumber = 1, pageSize = 10): Observable<PaginatedResponse<Offer>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<Offer>>(`${this.apiUrl}`, { params });
  }

  // GET /api/Offer/{id}
  getOfferById(id: number): Observable<Offer> {
    return this.http.get<Offer>(`${this.apiUrl}/${id}`);
  }

  // POST /api/Offer
  createOffer(offerData: OfferCreateModel | FormData): Observable<Offer> {
    if (offerData instanceof FormData) {
      return this.http.post<Offer>(`${this.apiUrl}`, offerData);
    }
    // Create a FormData object if there's an image file
    if ((offerData as any).image) {
      const formData = new FormData();
      Object.keys(offerData).forEach(key => {
        if (key === 'image') {
          formData.append('ImageFile', (offerData as any)[key] as File); // Backend expects 'ImageFile'
        } else {
          formData.append(key, (offerData as any)[key]?.toString() || '');
        }
      });
      return this.http.post<Offer>(`${this.apiUrl}`, formData);
    }
    // Otherwise just send the JSON data
    return this.http.post<Offer>(`${this.apiUrl}`, offerData);
  }

  // PUT /api/Offer/{id}
  updateOffer(id: number, offerData: Partial<OfferCreateModel> | FormData): Observable<Offer> {
    if (offerData instanceof FormData) {
      return this.http.put<Offer>(`${this.apiUrl}/${id}`, offerData);
    }
    // Create a FormData object if there's an image file
    if ((offerData as any).image) {
      const formData = new FormData();
      Object.keys(offerData).forEach(key => {
        if (key === 'image') {
          formData.append('ImageFile', (offerData as any)[key] as File); // Backend expects 'ImageFile'
        } else if ((offerData as any)[key] !== undefined) {
          formData.append(key, (offerData as any)[key]?.toString() || '');
        }
      });
      return this.http.put<Offer>(`${this.apiUrl}/${id}`, formData);
    }
    // Otherwise just send the JSON data
    return this.http.put<Offer>(`${this.apiUrl}/${id}`, offerData);
  }

  // PUT /api/Offer/{id}/status
  updateOfferStatus(id: number, status: OfferStatus): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, status, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // DELETE /api/Offer/{id}
  deleteOffer(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // POST /api/Offer/{offerId}/confirm-delivery
  confirmDelivery(offerId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${offerId}/confirm-delivery`, {});
  }

  // GET /api/Offer/sender/{senderId}
  getOffersBySender(senderId: string, pageNumber = 1, pageSize = 10): Observable<PaginatedResponse<Offer>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<Offer>>(`${this.apiUrl}/sender/${senderId}`, { params });
  }

  // GET /api/Offer/courier/{courierId}
  getOffersByCourier(courierId: string, pageNumber = 1, pageSize = 10): Observable<PaginatedResponse<Offer>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<Offer>>(`${this.apiUrl}/courier/${courierId}`, { params });
  }

  // GET /api/Offer/station/{stationId}
  getOffersByStation(stationId: number, pageNumber = 1, pageSize = 10): Observable<PaginatedResponse<Offer>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<Offer>>(`${this.apiUrl}/station/${stationId}`, { params });
  }
} 