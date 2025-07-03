import { Injectable } from '@angular/core';
import { IUserLogin, IUserRegister } from '../models/auth';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, AUser } from '../models/auth';
import { tap, map } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service'; 
import { jwtDecode } from 'jwt-decode';
import { User } from '../models/user';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  LoggedUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  private apiUrl: string = environment.apiUrl + 'Account/';
  
  // Reactive state management
  private authStateSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<AUser | null>(null);
  
  public authStateChanged$ = this.authStateSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(private http: HttpClient, private cookieService: CookieService) { 
    // Initialize subjects with current state after dependencies are injected
    setTimeout(() => this.updateAuthState(), 0);
  }

  Login(user: IUserLogin): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl + 'login', user).pipe(
      tap(response => {
        if (response?.token) {
          localStorage.setItem('token', response.token);
          this.cookieService.set('auth_token', response.token);  
          this.updateAuthState(); // Update reactive state
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
          this.updateAuthState(); // Update reactive state
        }
      })
    );
  }

  LogOut(): Observable<any> {
    return this.http.post(this.apiUrl + 'signout', {}).pipe(
      tap(() => {
        this.clearToken();
        this.updateAuthState(); // Update reactive state
      }),
      catchError((err) => {
        console.error('Logout error:', err);
        return throwError(() => new Error('Logout failed'));
      })
    );
  }

  getToken(): string | null {
    return this.cookieService.get('auth_token');
  }

  clearToken(): void {

    localStorage.removeItem('token');
    this.cookieService.delete('auth_token');   
    this.updateAuthState(); // Update reactive state
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
        // console.log('Decoded token:', decoded);

        return decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  // Additional methods for compatibility and reactive state management

  getUserId(): string | null {
    return this.getCurrentUserId();
  }

  getCurrentUser(): AUser | null {
    const token = this.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // console.log('🔑 Decoded token:', decoded);
        const user = {
          id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '',
          email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '',
          name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
          role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || ''
        };
        // console.log('👤 Current user:', user);
        return user;
      } catch (error) {
        console.error('❌ Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  private updateAuthState(): void {
    const isAuth = this.isAuthenticated();
    const user = this.getCurrentUser();
    
    console.log('🔄 Auth state updated:', {
      isAuthenticated: isAuth,
      user: user,
      token: !!this.getToken()
    });
    
    this.authStateSubject.next(isAuth);
    this.currentUserSubject.next(user);
  }

  // Observable version of isAuthenticated
  isAuthenticated$(): Observable<boolean> {
    return this.authStateChanged$;
  }

  // Role-based authentication methods
  isSender(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Sender' || user?.role === 'sender';
  }

  isCourier(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Courier' || user?.role === 'courier';
  }

  // Get user roles from token
  getUserRoles(): string[] {
    const token = this.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        
        if (Array.isArray(role)) {
          return role;
        } else if (role) {
          return [role];
        }
      } catch (error) {
        console.error('Error decoding token roles:', error);
      }
    }
    return [];
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const roles = this.getUserRoles();
    return roles.some(r => r.toLowerCase() === role.toLowerCase());
  }
}
