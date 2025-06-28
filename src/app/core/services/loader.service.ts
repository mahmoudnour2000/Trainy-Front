import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  private requestCount = 0;

  showLoader(): void {
    if (this.requestCount === 0) {
      this.isLoadingSubject.next(true);
    }
    this.requestCount++;
  }

  hideLoader(): void {
    this.requestCount--;
    if (this.requestCount === 0) {
      this.isLoadingSubject.next(false);
    }
  }

  // For testing/debugging purposes
  resetLoader(): void {
    this.requestCount = 0;
    this.isLoadingSubject.next(false);
  }
}
