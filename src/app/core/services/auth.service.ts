import { Injectable } from '@angular/core';
import { IUserLogin, IUserRegister } from '../models/auth';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/auth';
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
private currentUserSubject = new BehaviorSubject<User | null>(null);
public currentUser$ = this.currentUserSubject.asObservable();
private authStateSubject = new BehaviorSubject<boolean>(false);

private rolesSubject = new BehaviorSubject<string[]>([]);
public roles$ = this.rolesSubject.asObservable();

public authStateChanged$ = this.authStateSubject.asObservable();
  private apiUrl: string = environment.apiUrl + 'Account/';
  
  // Reactive state management
  
  
  constructor(private http: HttpClient, private cookieService: CookieService) { 
    // Initialize subjects with current state after dependencies are injected
    setTimeout(() => this.updateAuthState(), 0);
  }

 Login(user: IUserLogin): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(this.apiUrl + 'login', user).pipe(
    tap(response => {
      if ( response?.token) {
        localStorage.setItem('token', response.token);
        this.cookieService.set('auth_token', response.token);
        this.rolesSubject.next(response.Role || []);
         console.log('Login successful, Roles:', response.Role );
        this.updateAuthState();
      }
    }),
    catchError(err => {
      console.error('Login error:', err);
      return throwError(() => new Error('Login failed'));
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
  this.rolesSubject.next([]);
  this.updateAuthState();
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

 getCurrentUser(): User | null {
  const token = this.getToken();
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      const user: User = {
        Id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '',
        Name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
        Email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '',
        PhoneNumber: decoded['phone_number'] || '',
        Governorate: decoded['governorate'] || '',
        City: decoded['city'] || '',
        Image: decoded['image'] || 'assets/default-profile.png',
        CreatedAt: decoded['created_at'] || '',
        Balance: decoded['balance'] ? parseFloat(decoded['balance']) : 0
      };
      console.log('👤 Current user:', user);
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
    token: !!this.getToken(),
    roles: this.rolesSubject.value
  });

  this.authStateSubject.next(isAuth);
  this.currentUserSubject.next(user);
  this.LoggedUser.next(user);
}

  

  // Observable version of isAuthenticated
  isAuthenticated$(): Observable<boolean> {
    return this.authStateChanged$;
  }

  // Role-based authentication methods
  isSender(): boolean {
  const roles = this.rolesSubject.value.length > 0 ? this.rolesSubject.value : this.getUserRoles();
  return roles.some(role => role.toLowerCase() === 'sender');
}

isCourier(): boolean {
  const roles = this.rolesSubject.value.length > 0 ? this.rolesSubject.value : this.getUserRoles();
  return roles.some(role => role.toLowerCase() === 'courier');
}

getUserRoles(): string[] {
  const token = this.getToken();
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      return Array.isArray(roles) ? roles : roles ? [roles] : [];
    } catch (error) {
      console.error('Error decoding token roles:', error);
      return [];
    }
  }
  return [];
}

hasRole(role: string): boolean {
  const roles = this.rolesSubject.value.length > 0 ? this.rolesSubject.value : this.getUserRoles();
  return roles.some(r => r.toLowerCase() === role.toLowerCase());
}

}
