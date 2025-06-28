// src/app/core/services/user.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Offer, Request,DecodedToken } from '../models/user';
import { environment } from '../../../environments/environment';
import { CookieService } from 'ngx-cookie-service';
import {jwtDecode} from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})

export class UserService {
  private apiUrl: string = environment.apiUrl;
  constructor(private http: HttpClient  ) {}
  private cookieService = inject(CookieService);
  private token = this.cookieService.get('auth_token');
 

  private getUserId(): string {
  const token = this.cookieService.get('auth_token');
  if (!token) {
    throw new Error('Token not found in cookies');
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    return userId;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

private getUserRole(): string{
  const token = this.cookieService.get('auth_token');
  if (!token) {
    throw new Error('Token not found in cookies');
  }
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const role = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];
    return role;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

  getUserProfile(): Observable<User> {
    // const userId = this.getUserId();
    return this.http.get<User>(`${this.apiUrl}UserProfile/GetUserData`, { withCredentials: true });
  }

  updateUserData(user: User): Observable<User> {
    // const userId = this.getUserId();
    return this.http.put<User>(`${this.apiUrl}UserProfile/EditUserData`, user, { withCredentials: true });
  }

  getProfileImage(): Observable<{ imageUrl: string }> {
    // const userId = this.getUserId();
    return this.http.get<{ imageUrl: string }>(`${this.apiUrl}UserProfile/GetProfileImage`, { withCredentials: true });
  }

  uploadProfileImage(file: File): Observable<{ imageUrl: string }> {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error('صيغة الملف غير مدعومة. الرجاء رفع ملف بصيغة PNG، JPG، JPEG، أو GIF.');
    }

    // const userId = this.getUserId();
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}UserProfile/UpdateProfileImage`, formData, { withCredentials: true });
  }

  getUserBalance(): Observable<{ balance: number }> {
    // const userId = this.getUserId();
    return this.http.get<{ balance: number }>(`${this.apiUrl}UserProfile/GetUserBalance`, { withCredentials: true });
  }

  getUserOffers(): Observable<Offer[]> {
    // const userId = this.getUserId();
    return this.http.get<Offer[]>(`${this.apiUrl}UserProfile/GetUserOffers`, { withCredentials: true });
  }

  getUserRequests(): Observable<Request[]> {
    // const userId = this.getUserId();
    return this.http.get<Request[]>(`${this.apiUrl}UserProfile/GetUserRequests`, { withCredentials: true });
  }
  deposit(Amount: number, PaymentMethod: paymentMethod): Observable<{ PaymentToken: string, PaymentId: number, PaymentMethod: string }> {
    console.log('Sending deposit request:', { Amount, PaymentMethod });
    return this.http.post<{ PaymentToken: string, PaymentId: number, PaymentMethod: string }>(
      `${this.apiUrl}UserProfile/Deposit`,
      { Amount, PaymentMethod },
      { withCredentials: true }
    );
  }

  withdraw(Amount: number, PaymentMethod: paymentMethod, AccountNumber: string): Observable<{ message: string }> {
    console.log('Sending withdraw request:', { Amount, PaymentMethod, AccountNumber });
    return this.http.post<{ message: string }>(
      `${this.apiUrl}UserProfile/Withdraw`,
      { Amount, PaymentMethod, AccountNumber },
      { withCredentials: true }
    );
  }
  
}
export enum paymentMethod {
  EtisalatCash = 0,
  VodafoneCash = 1,
   PayPal= 2,
   Stripe = 3,
   AccountNumber = 4,

}


