// src/app/core/interceptors/auth.interceptor.ts
import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service'; // Adjust path if needed

//This is a functional interceptor
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  
  console.log('🔄 Auth Interceptor:', {
    url: req.url,
    method: req.method,
    hasToken: !!token,
    token: token ? `${token.substring(0, 20)}...` : 'No token'
  });
  
  let clonedRequest = req;
  if (token) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('✅ Authorization header added to request');
  } else {
    console.log('❌ No token available, request sent without authorization');
  }

  return next(clonedRequest).pipe(
    tap(event => {
      if (event.type === 0) { // HttpEventType.Sent
        console.log('📤 Request sent:', req.url);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('❌ HTTP Error in interceptor:', {
        status: error.status,
        message: error.message,
        url: error.url
      });
      
      if (error.status === 401) {
        console.log('🔒 401 Unauthorized - redirecting to login');
        authService.LogOut();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
