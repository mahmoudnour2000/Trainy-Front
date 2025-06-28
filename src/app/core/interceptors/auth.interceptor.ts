// src/app/core/interceptors/auth.interceptor.ts
import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service'; // Adjust path if needed

//This is a functional interceptor
export const authInterceptor: HttpInterceptorFn = ( // Ensure the export name is correct
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken(); // Ensure getToken() exists in AuthService
  let clonedRequest = req;
  if (token) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.LogOut(); // Ensure logout() exists in AuthService
        router.navigate(['/auth/login']); // Adjust login route if necessary
      }
      return throwError(() => error);
    })
  );
};
