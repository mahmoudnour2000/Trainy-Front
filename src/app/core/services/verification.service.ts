import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Keep existing status type if it matches backend
export type VerificationStatusType = 'Accepted' | 'Pending' | 'Rejected'; // Updated to match new requirements

// Interface for the data returned by GET /api/verification/my-status (for each item in the list)
export interface VerificationRequest {
  Id: string; // or number - API returns capital I
  RequestedRole: 'Sender' | 'Courier'; // API returns capital R
  Status: VerificationStatusType; // API returns capital S
  NationalId?: string; // API returns capital N - May or may not be returned
  RejectionReason?: string; // API returns capital R
  CreatedAt: string; // API returns capital C - Assuming ISO date string
  UpdatedAt: string; // API returns capital U - Assuming ISO date string
  UserId: string; // API returns capital U
  UserName: string; // API returns capital U
  // Add other properties returned by your backend for each verification request
}

// Interface for the model used in POST /api/verification/submit
export interface VerificationRequestCreateModel {
  requestedRole: 'Sender' | 'Courier';
  nationalId: string;
  photo1: File;
  photo2: File;
}

// Simplified/adapted combined status, derived from the list of VerificationRequest
export interface CombinedVerificationStatus {
  isVerified: boolean; // General verification status
  senderStatus: VerificationStatusType;
  courierStatus: VerificationStatusType;
  // We might need to store the raw list too, or specific rejection reasons
  lastSenderRejectionReason?: string;
  lastCourierRejectionReason?: string;
  verificationRequests: VerificationRequest[]; // Store the raw list
}

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private apiUrl = `${environment.apiUrl}Verification`; // Base URL for verification

  private verificationStatusSubject = new BehaviorSubject<CombinedVerificationStatus>({
    isVerified: false,
    senderStatus: 'Pending',
    courierStatus: 'Pending',
    verificationRequests: []
  });
  verificationStatus$ = this.verificationStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('Verification Service initialized. API URL:', this.apiUrl);

    this.authService.authStateChanged$.subscribe((isLoggedIn: boolean) => {
      if (isLoggedIn) {
        this.refreshVerificationStatus();
      } else {
        this.verificationStatusSubject.next({
          isVerified: false,
          senderStatus: 'Pending',
          courierStatus: 'Pending',
          verificationRequests: []
        });
      }
    });
  }

  private processVerificationRequests(requests: VerificationRequest[]): CombinedVerificationStatus {
    let senderStatus: VerificationStatusType = 'Pending';
    let courierStatus: VerificationStatusType = 'Pending';
    let lastSenderRejectionReason: string | undefined;
    let lastCourierRejectionReason: string | undefined;

    const senderRequests = requests.filter(r => r.RequestedRole === 'Sender').sort((a,b) => new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime());
    const courierRequests = requests.filter(r => r.RequestedRole === 'Courier').sort((a,b) => new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime());

    if (senderRequests.length > 0) {
      senderStatus = senderRequests[0].Status;
      if (senderStatus === 'Rejected') {
        lastSenderRejectionReason = senderRequests[0].RejectionReason;
      }
    }
    if (courierRequests.length > 0) {
      courierStatus = courierRequests[0].Status;
      if (courierStatus === 'Rejected') {
        lastCourierRejectionReason = courierRequests[0].RejectionReason;
      }
    }
    
    // Define "isVerified" based on your application's logic.
    // For example, if either role is accepted, or a specific role.
    // Here, let's say user is considered "verified" if either sender or courier role is accepted.
    const isVerified = senderStatus === 'Accepted' || courierStatus === 'Accepted';

    return {
      isVerified,
      senderStatus,
      courierStatus,
      lastSenderRejectionReason,
      lastCourierRejectionReason,
      verificationRequests: requests
    };
  }

  // Fetches all verification statuses for the logged-in user
  getMyVerificationStatus(requestedRole?: 'Sender' | 'Courier'): Observable<VerificationRequest[]> {
    if (!this.authService.isAuthenticated()) {
      return of([]);
    }
    let params = new HttpParams();
    if (requestedRole) {
      params = params.set('requestedRole', requestedRole);
    }
    console.log(`Fetching verification status from: ${this.apiUrl}/my-status`, { params });
    return this.http.get<VerificationRequest[]>(`${this.apiUrl}/my-status`, { params }).pipe(
      catchError(this.handleError)
    );
  }
  
  refreshVerificationStatus(): void {
    if (!this.authService.isAuthenticated()) {
      console.log('❌ User not authenticated, skipping verification status refresh.');
      this.verificationStatusSubject.next({ isVerified: false, senderStatus: 'Pending', courierStatus: 'Pending', verificationRequests: [] });
      return;
    }
    console.log('🔄 Refreshing verification status...');
    console.log('🔑 API URL:', `${this.apiUrl}/my-status`);
    console.log('🔑 Token present:', !!this.authService.getToken());
    
    this.getMyVerificationStatus().subscribe({
      next: (requests) => {
        console.log('✅ Raw verification requests from API:', requests);
        const combinedStatus = this.processVerificationRequests(requests);
        console.log('🔄 Processed verification status:', combinedStatus);
        this.verificationStatusSubject.next(combinedStatus);
      },
      error: (err) => {
        console.error('❌ Error refreshing verification status:', err);
        console.error('❌ Error details:', {
          status: err.status,
          message: err.message,
          url: err.url
        });
        // Keep previous state or set to a default error state
         this.verificationStatusSubject.next({ 
            isVerified: false, 
            senderStatus: 'Pending', 
            courierStatus: 'Pending', 
            verificationRequests: [],
            lastSenderRejectionReason: 'Failed to load status',
            lastCourierRejectionReason: 'Failed to load status'
        });
      }
    });
  }

  // Submits a new verification request
  submitVerification(data: VerificationRequestCreateModel): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    const formData = new FormData();
    formData.append('RequestedRole', data.requestedRole);
    formData.append('NationalId', data.nationalId);
    formData.append('Photo1', data.photo1, data.photo1.name);
    formData.append('Photo2', data.photo2, data.photo2.name);

    console.log(`Submitting verification to: ${this.apiUrl}/submit`);
    return this.http.post<any>(`${this.apiUrl}/submit`, formData).pipe(
      tap(response => {
        console.log('Verification submission successful:', response);
        this.refreshVerificationStatus(); // Refresh status after successful submission
      }),
      catchError(this.handleError)
    );
  }

  // Simple accessors for derived status, components can subscribe to verificationStatus$ and derive as needed too
  isUserVerified(): Observable<boolean> {
    return this.verificationStatus$.pipe(map(status => status.isVerified));
  }

  getSenderStatus(): Observable<VerificationStatusType> {
    return this.verificationStatus$.pipe(map(status => status.senderStatus));
  }

  getCourierStatus(): Observable<VerificationStatusType> {
    return this.verificationStatus$.pipe(map(status => status.courierStatus));
  }
  
  getAllVerificationRequests(): Observable<VerificationRequest[]> {
    return this.verificationStatus$.pipe(map(status => status.verificationRequests));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('VerificationService API Error:', error);
    // More specific error handling can be done here or in the component
    let errorMessage = 'An unknown error occurred in VerificationService.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = `Server-side error: ${error.status} - ${error.error?.message || error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  // Remove or adapt old methods like getVerificationStatus, uploadSenderVerification, uploadCourierVerification, mock data logic
  // For brevity, I'm omitting their removal/adaptation in this diff, but it should be done.
} 