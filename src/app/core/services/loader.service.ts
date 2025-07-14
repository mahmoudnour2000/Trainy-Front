import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  private totalRequests = 0;

  showLoader() {
    // console.log('Showing loader, totalRequests:', this.totalRequests); // للتصحيح
    this.totalRequests++;
    this.isLoadingSubject.next(true);
  }

  hideLoader() {
    this.totalRequests--;
    // console.log('Hiding loader, totalRequests:', this.totalRequests); // للتصحيح
    if (this.totalRequests <= 0) {
      this.totalRequests = 0;
      this.isLoadingSubject.next(false);
    }
  }
}