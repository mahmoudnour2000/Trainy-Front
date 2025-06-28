// src/app/core/interceptors/loader.interceptor.ts
import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service'; // Adjust path if needed

export const loaderInterceptor: HttpInterceptorFn = ( // Ensure the export name is correct
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const loaderService = inject(LoaderService);

  loaderService.showLoader();

  return next(req).pipe(
    finalize(() => {
      loaderService.hideLoader();
    })
  );
};
