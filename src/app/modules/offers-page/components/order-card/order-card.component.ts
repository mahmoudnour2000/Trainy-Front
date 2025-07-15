import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RequestService } from '../../../../core/services/request.service';
import { OfferService } from '../../../../core/services/offer.service';
import { VerificationService, CombinedVerificationStatus } from '../../../../core/services/verification.service';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.css']
})
export class OrderCardComponent implements OnInit, OnChanges {
  @Input() order: any;
  @Output() deleteOrder = new EventEmitter<number>();
  
  currentUserRole: string = '';
  isOrderOwner: boolean = false;
  isCourierVerified: boolean = false;
  isSenderVerified: boolean = false;
  currentUserId: string | null = null;

  constructor(
    private router: Router,
    public authService: AuthService,
    private requestService: RequestService,
    private offerService: OfferService,
    private verificationService: VerificationService
  ) { }

  ngOnInit(): void {

    
    // Initial check
    this.checkOrderOwnership();
    
    // Check verification status
    this.verificationService.verificationStatus$.subscribe((status: CombinedVerificationStatus) => {
      this.isCourierVerified = status.courierStatus === 'Accepted';
      this.isSenderVerified = status.senderStatus === 'Accepted';
      

    });
    
    // Listen to auth state changes and re-check ownership
    this.authService.authStateChanged$.subscribe(isAuth => {
      if (isAuth) {
        this.currentUserId = this.authService.getUserId();
        this.checkOrderOwnership();

      }
    });
  }

  private checkOrderOwnership(): void {
    if (!this.order) {
      return;
    }
    
    if (!this.currentUserId) {
      this.isOrderOwner = false;
      return;
    }
    
    // Check if current user is the owner of this offer
    // Handle both senderId and userId properties for compatibility
    const orderAny = this.order as any;
    const possibleSenderIds = [
      this.order?.senderId,
      this.order?.userId, // This might exist from transform
      orderAny?.userId,
      orderAny?.SenderId,
      orderAny?.UserId,
      orderAny?.SenderID,
      orderAny?.UserID,
      orderAny?.ID && orderAny?.SenderId ? orderAny.SenderId : null // Direct API response
    ].filter(id => id != null && id !== undefined && id !== '');
    
    // Try both string and number comparisons
    this.isOrderOwner = possibleSenderIds.some(id => {
      const idStr = String(id);
      const userIdStr = String(this.currentUserId);
      return idStr === userIdStr || id === this.currentUserId;
    });
    

  }

  isOwner(senderId: string): boolean {
    // Handle both senderId and userId properties for compatibility
    const orderAny = this.order as any;
    const possibleSenderIds = [
      senderId,
      this.order?.senderId,
      orderAny?.userId,
      orderAny?.SenderId,
      orderAny?.UserId,
      orderAny?.SenderID,
      orderAny?.UserID
    ].filter(id => id != null);
    
    return possibleSenderIds.some(id => this.currentUserId === String(id));
  }

  onShowDetails(): void {
    if (!this.order.id) {
      console.error('Order is missing ID');
      return;
    }
    
    // Navigate to the request page with the offer ID
    this.router.navigate(['/requests/offer', this.order.id]);
  }

  onViewRequests(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.onLoginPrompt();
      return;
    }
    
    if (!this.order.id) {
      console.error('Order is missing ID');
      return;
    }
    

    
    // Navigate to the request page to view offer details and requests
    // Available for all authenticated users
    this.router.navigate(['/requests/offer', this.order.id]);
  }

  canViewRequests(): boolean {
    // Must be authenticated
    if (!this.authService.isAuthenticated()) {
      return false;
    }
    
    // Must be either a sender or courier
    const isSender = this.authService.isSender();
    const isCourier = this.authService.isCourier();
    
    if (!isSender && !isCourier) {
      return false;
    }
    
    // Check verification status based on role
    let isVerified = false;
    if (isSender) {
      isVerified = this.isSenderVerified;
    }
    if (isCourier) {
      isVerified = this.isCourierVerified;
    }
    

    
    // Show button for all authenticated senders and couriers (including offer owners)
    // Offer owners should also be able to view requests for their own offers
    return true; // Temporarily return true for debugging
  }

  onSendRequest(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.onLoginPrompt();
      return;
    }
    
    // Check if user is the offer owner - they shouldn't be able to send request to their own offer
    if (this.isOrderOwner) {
      alert('لا يمكنك إرسال طلب لعرضك الخاص');
      return;
    }
    
    // Check if user is a courier
    if (!this.authService.isCourier()) {
      alert('يجب أن تكون مسجل كموصل لإرسال طلب');
      return;
    }
    
    // Check comprehensive verification status
    this.verificationService.verificationStatus$.subscribe(status => {
      if (status.courierStatus === 'Pending') {
        alert('طلب التحقق الخاص بك قيد المراجعة. يرجى انتظار الموافقة قبل إرسال طلبات.');
        this.router.navigate(['/verification/status']);
        return;
      }
      
      if (status.courierStatus === 'Rejected') {
        if (confirm('تم رفض طلب التحقق الخاص بك. هل تريد إعادة المحاولة؟')) {
          this.router.navigate(['/verification'], { 
            queryParams: { roleType: 'Courier', returnUrl: this.router.url } 
          });
        }
        return;
      }
      
      if (status.courierStatus !== 'Accepted') {
        if (confirm('يجب التحقق من حسابك كموصل أولاً. هل تريد الانتقال إلى صفحة التحقق؟')) {
          this.router.navigate(['/verification'], { 
            queryParams: { roleType: 'Courier', returnUrl: this.router.url } 
          });
        }
        return;
      }
      

      
      // Ensure the order has an ID
      if (!this.order.id) {
        console.error('Order is missing ID');
        return;
      }
      
      // Navigate to the request page with the offer ID
      this.router.navigate(['/requests/offer', this.order.id]);
    }).unsubscribe(); // Unsubscribe immediately after getting the status
  }

  onLoginPrompt(): void {
    if (confirm('يجب تسجيل الدخول أولاً. هل تريد الانتقال إلى صفحة تسجيل الدخول؟')) {
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
    }
  }

  onEdit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.onLoginPrompt();
      return;
    }
    
    // Check if user is the offer owner
    if (!this.isOrderOwner) {
      alert('لا يمكنك تعديل عرض لا تملكه');
      return;
    }
    

    this.router.navigate(['/offers/add-offer', this.order.id]);
  }

  onDelete(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.onLoginPrompt();
      return;
    }
    
    // Check if user is the offer owner
    if (!this.isOrderOwner) {
      alert('لا يمكنك حذف عرض لا تملكه');
      return;
    }
    

    if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      // Use the API to delete the offer
      this.offerService.deleteOffer(this.order.id).subscribe({
        next: (response) => {

          this.deleteOrder.emit(this.order.id);
        },
        error: (error) => {
          console.error('Error deleting offer:', error);
          alert('حدث خطأ أثناء حذف العرض');
        }
      });
    }
  }

  canEditOrder(): boolean {
    // Simple ownership check - owner can always edit their own offers
    const canEdit = this.authService.isAuthenticated() && this.isOrderOwner;
    return canEdit;
  }

  canDeleteOrder(): boolean {
    // Simple ownership check - owner can always delete their own offers
    const canDelete = this.authService.isAuthenticated() && this.isOrderOwner;
    return canDelete;
  }

  canSendRequest(): boolean {
    return this.authService.isAuthenticated() && 
           this.authService.isCourier() && 
           !this.isOrderOwner;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order']) {

      
      if (changes['order'].currentValue) {
        this.currentUserId = this.authService.getUserId();
        this.checkOrderOwnership();
      }
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
