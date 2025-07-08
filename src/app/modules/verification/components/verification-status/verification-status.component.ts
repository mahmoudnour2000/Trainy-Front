import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VerificationService, CombinedVerificationStatus, VerificationStatusType, VerificationRequest } from '../../../../core/services/verification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-verification-status',
  templateUrl: './verification-status.component.html',
  styleUrls: ['./verification-status.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent]
})
export class VerificationStatusComponent implements OnInit {
  currentStatus$: Observable<CombinedVerificationStatus>;
  verificationStatus: CombinedVerificationStatus = {
    isVerified: false,
    senderStatus: 'Pending',
    courierStatus: 'Pending',
    verificationRequests: []
  };
  
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private verificationService: VerificationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.currentStatus$ = this.verificationService.verificationStatus$;
  }
  
  ngOnInit(): void {
    console.log('Verification Status Component initialized');
    
    // Check for redirect message
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.successMessage = params['message'];
      }
    });
    
    this.currentStatus$.subscribe(
      status => {
        console.log('Verification status received in StatusComponent:', status);
        this.verificationStatus = status;
        this.loading = false;
        if (!status || status.verificationRequests.length === 0) {
          // Potentially set a message if no requests are found and not loading
          // This might be handled by the template checking for requests
        }
      },
      error => {
        console.error('Error subscribing to verification status:', error);
        this.errorMessage = 'فشل في تحميل حالة التحقق.';
        this.loading = false;
      }
    );
  }

  /**
   * Calculate combined verification status based on both sender and courier statuses
   * Priority: Accepted > Pending > Rejected > NotSubmitted
   */
  getCombinedStatus(): VerificationStatusType {
    const senderStatus = this.verificationStatus.senderStatus;
    const courierStatus = this.verificationStatus.courierStatus;
    
    // If either is accepted, show accepted
    if (senderStatus === 'Accepted' || courierStatus === 'Accepted') {
      return 'Accepted';
    }
    
    // If either is pending, show pending
    if (senderStatus === 'Pending' || courierStatus === 'Pending') {
      return 'Pending';
    }
    
    // If either is rejected, show rejected
    if (senderStatus === 'Rejected' || courierStatus === 'Rejected') {
      return 'Rejected';
    }
    
    // Both are not submitted
    return 'NotSubmitted';
  }

  /**
   * Get the description text for the combined status
   */
  getCombinedStatusDescription(): string {
    const senderStatus = this.verificationStatus.senderStatus;
    const courierStatus = this.verificationStatus.courierStatus;
    const combinedStatus = this.getCombinedStatus();
    
    switch (combinedStatus) {
      case 'Accepted':
        if (senderStatus === 'Accepted' && courierStatus === 'Accepted') {
          return 'تم قبول طلبي التحقق للمرسل والموصل. يمكنك الآن استخدام جميع ميزات المنصة.';
        } else if (senderStatus === 'Accepted') {
          return 'تم قبول طلب التحقق كمرسل. يمكنك الآن إنشاء العروض وإرسال الطلبات.';
        } else {
          return 'تم قبول طلب التحقق كموصل. يمكنك الآن إرسال طلبات وإنشاء العروض.';
        }
        
      case 'Pending':
        const pendingRoles = [];
        if (senderStatus === 'Pending') pendingRoles.push('المرسل');
        if (courierStatus === 'Pending') pendingRoles.push('الموصل');
        return `طلب التحقق ${pendingRoles.join(' و ')} قيد المراجعة من قبل فريقنا.`;
        
      case 'Rejected':
        const rejectedRoles = [];
        if (senderStatus === 'Rejected') rejectedRoles.push('المرسل');
        if (courierStatus === 'Rejected') rejectedRoles.push('الموصل');
        
        let rejectionText = `تم رفض طلب التحقق ${rejectedRoles.join(' و ')}.`;
        
        // Add rejection reasons if available
        if (senderStatus === 'Rejected' && this.verificationStatus.lastSenderRejectionReason) {
          rejectionText += ` سبب رفض المرسل: ${this.verificationStatus.lastSenderRejectionReason}`;
        }
        if (courierStatus === 'Rejected' && this.verificationStatus.lastCourierRejectionReason) {
          rejectionText += ` سبب رفض الموصل: ${this.verificationStatus.lastCourierRejectionReason}`;
        }
        
        return rejectionText;
        
      case 'NotSubmitted':
      default:
        return 'لم تقم بتقديم طلب التحقق بعد. يرجى تقديم المستندات المطلوبة للتحقق من حسابك.';
    }
  }

  refreshStatus(): void {
    this.loading = true;
    this.errorMessage = '';
    this.verificationService.refreshVerificationStatus();
  }
  
  getDisplayRequestForRole(requests: VerificationRequest[] | undefined, role: 'Sender' | 'Courier'): VerificationRequest | undefined {
    if (!requests) return undefined;
    return requests
      .filter(r => r.RequestedRole === role)
      .sort((a,b) => new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime())
      [0];
  }

  getStatusText(status: VerificationStatusType | undefined): string {
    switch(status) {
      case 'NotSubmitted':
        return 'لم يتم التقديم';
      case 'Pending':
        return 'قيد المراجعة';
      case 'Accepted':
        return 'مقبول';
      case 'Rejected':
        return 'مرفوض';
      default:
        return 'قيد المراجعة';
    }
  }
  
  getStatusClass(status: VerificationStatusType | undefined): string {
    switch(status) {
      case 'NotSubmitted':
        return 'status-not-submitted';
      case 'Pending':
        return 'status-pending';
      case 'Accepted':
        return 'status-accepted';
      case 'Rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }
  
  getStatusIcon(status: VerificationStatusType | undefined): string {
    switch(status) {
      case 'NotSubmitted':
        return 'bi-dash-circle';
      case 'Pending':
        return 'bi-hourglass-split';
      case 'Accepted':
        return 'bi-check-circle-fill';
      case 'Rejected':
        return 'bi-x-circle-fill';
      default:
        return 'bi-hourglass-split';
    }
  }
  
  goToVerificationForm(): void {
    // Check if user can submit verification
    const canSubmitSender = this.verificationStatus.senderStatus === 'NotSubmitted' || this.verificationStatus.senderStatus === 'Rejected';
    const canSubmitCourier = this.verificationStatus.courierStatus === 'NotSubmitted' || this.verificationStatus.courierStatus === 'Rejected';
    
    if (canSubmitSender || canSubmitCourier) {
      this.router.navigate(['/verification'], {
        queryParams: { 
          returnUrl: '/verification/status',
          roleType: canSubmitSender ? 'Sender' : 'Courier'
        }
      });
    } else {
      this.successMessage = 'لديك طلب تحقق قيد المراجعة بالفعل أو تم قبوله';
    }
  }
  
  goToHome(): void {
    this.router.navigate(['/']);
  }
  
  goToOffers(): void {
    this.router.navigate(['/offers']);
  }
  
  canCreateOffers(): boolean {
    return this.verificationStatus.senderStatus === 'Accepted';
  }
  
  canSendRequests(): boolean {
    return this.verificationStatus.courierStatus === 'Accepted';
  }
} 