import { Injectable } from '@angular/core';
import { IUserLogin, IUserRegister } from '../models/auth';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/auth';
import { tap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service'; 
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl: string = environment.apiUrl + 'Account/';
  constructor(private http: HttpClient, private cookieService: CookieService) { }

  Login(user: IUserLogin): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl + 'login', user).pipe(
      tap(response => {
        if (response?.token) {
          localStorage.setItem('token', response.token);
          this.cookieService.set('auth_token', response.token);  
        }
      })
    );
  }

  Register(user: IUserRegister): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl + 'register', user).pipe(
      tap(response => {
        if (response?.token) {
          localStorage.setItem('token', response.token);
          this.cookieService.set('auth_token', response.token); 
        }
      })
    );
  }

  LogOut(): Observable<any> {
    return this.http.post(this.apiUrl + 'signout', {}).pipe(
      tap(() => {
        this.clearToken();
      }),
      catchError((err) => {
        console.error('Logout error:', err);
        return throwError(() => new Error('Logout failed'));
      })
    );
  }

  getToken(): string | null {
    return this.cookieService.get('auth_token') || localStorage.getItem('token');
  }

  clearToken(): void {
    localStorage.removeItem('token');
    this.cookieService.delete('auth_token');   
    
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  ForgetPassword(email: string): Observable<any> {
    return this.http.post(this.apiUrl + 'forgot-password', { email }).pipe(
      catchError((err) => {
        console.error('Forget password error:', err);
        return throwError(() => new Error('Forget password failed'));
      })
    );
  }


  resetPassword(model: { email: string, token: string, newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}reset-password`, model);
  }
  
  getCurrentUserId(): string | null {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        console.log('Decoded token:', decoded);
        
        return decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }
}
