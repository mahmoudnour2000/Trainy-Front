import { HttpEvent, HttpHandlerFn, HttpRequest, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

export const loaderInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const loaderService = inject(LoaderService);
  let totalRequests = 0; // عداد الطلبات

  // زيادة عداد الطلبات وإظهار الـ spinner
  totalRequests++;
  loaderService.showLoader();

  return next(req).pipe(
    finalize(() => {
      // تقليل عداد الطلبات وإخفاء الـ spinner لو كل الطلبات خلّصت
      totalRequests--;
      if (totalRequests === 0) {
        loaderService.hideLoader();
      }
    })
  );
};