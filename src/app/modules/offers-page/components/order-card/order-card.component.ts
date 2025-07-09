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
    // this.currentUserId = this.authService.getUserId();
    // console.log('OrderCard ngOnInit debug:', {
    //   currentUserId: this.currentUserId,
    //   order: this.order,
    //   orderSenderId: this.order?.senderId,
    //   orderUserId: this.order?.userId
    // });
    
    // Initial check
    this.checkOrderOwnership();
    
    // Check verification status
    this.verificationService.verificationStatus$.subscribe((status: CombinedVerificationStatus) => {
      this.isCourierVerified = status.courierStatus === 'Accepted';
      this.isSenderVerified = status.senderStatus === 'Accepted';
      
      console.log('OrderCard verification status updated:', {
        courierStatus: status.courierStatus,
        senderStatus: status.senderStatus,
        isCourierVerified: this.isCourierVerified,
        isSenderVerified: this.isSenderVerified
      });
    });
    
    // Listen to auth state changes and re-check ownership
    this.authService.authStateChanged$.subscribe(isAuth => {
      if (isAuth) {
        this.currentUserId = this.authService.getUserId();
        this.checkOrderOwnership();
        console.log('Auth state changed, rechecking ownership:', {
          isAuth,
          currentUserId: this.currentUserId,
          isOrderOwner: this.isOrderOwner
        });
      }
    });
  }

  private checkOrderOwnership(): void {
    if (!this.order) {
      console.log('checkOrderOwnership: No order data available');
      return;
    }
    
    if (!this.currentUserId) {
      console.log('checkOrderOwnership: No current user ID available');
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
    
    console.log('checkOrderOwnership debug:', {
      currentUserId: this.currentUserId,
      currentUserIdType: typeof this.currentUserId,
      possibleSenderIds: possibleSenderIds,
      possibleSenderIdsTypes: possibleSenderIds.map(id => typeof id),
      isOrderOwner: this.isOrderOwner,
      order: this.order,
      authIsAuthenticated: this.authService.isAuthenticated(),
      authIsSender: this.authService.isSender()
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
    
    console.log('View requests clicked for order:', this.order.id);
    
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
    
    // For debugging - let's log the current state
    console.log('canViewRequests debug:', {
      isAuthenticated: this.authService.isAuthenticated(),
      isSender: isSender,
      isCourier: isCourier,
      isSenderVerified: this.isSenderVerified,
      isCourierVerified: this.isCourierVerified,
      isVerified: isVerified,
      isOrderOwner: this.isOrderOwner
    });
    
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
      
      console.log('Send request clicked for order:', this.order);
      
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
    
    // Check if user is a sender
    if (!this.authService.isSender()) {
      alert('يجب أن تكون مسجل كمرسل لتعديل العروض');
      return;
    }
    
    // Check sender verification status
    this.verificationService.verificationStatus$.subscribe(status => {
      if (status.senderStatus === 'Pending') {
        alert('طلب التحقق الخاص بك قيد المراجعة. يرجى انتظار الموافقة قبل تعديل العروض.');
        this.router.navigate(['/verification/status']);
        return;
      }
      
      if (status.senderStatus === 'Rejected') {
        if (confirm('تم رفض طلب التحقق الخاص بك. هل تريد إعادة المحاولة؟')) {
          this.router.navigate(['/verification'], { 
            queryParams: { roleType: 'Sender', returnUrl: this.router.url } 
          });
        }
        return;
      }
      
      if (status.senderStatus !== 'Accepted') {
        if (confirm('يجب التحقق من حسابك كمرسل أولاً. هل تريد الانتقال إلى صفحة التحقق؟')) {
          this.router.navigate(['/verification'], { 
            queryParams: { roleType: 'Sender', returnUrl: this.router.url } 
          });
        }
        return;
      }
      
      console.log('Edit clicked for order:', this.order);
      this.router.navigate(['/offers/add-offer', this.order.id]);
    }).unsubscribe();
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
    
    // Check if user is a sender
    if (!this.authService.isSender()) {
      alert('يجب أن تكون مسجل كمرسل لحذف العروض');
      return;
    }
    
    // Check sender verification status
    this.verificationService.verificationStatus$.subscribe(status => {
      if (status.senderStatus === 'Pending') {
        alert('طلب التحقق الخاص بك قيد المراجعة. يرجى انتظار الموافقة قبل حذف العروض.');
        this.router.navigate(['/verification/status']);
        return;
      }
      
      if (status.senderStatus === 'Rejected') {
        if (confirm('تم رفض طلب التحقق الخاص بك. هل تريد إعادة المحاولة؟')) {
          this.router.navigate(['/verification'], { 
            queryParams: { roleType: 'Sender', returnUrl: this.router.url } 
          });
        }
        return;
      }
      
      if (status.senderStatus !== 'Accepted') {
        if (confirm('يجب التحقق من حسابك كمرسل أولاً. هل تريد الانتقال إلى صفحة التحقق؟')) {
          this.router.navigate(['/verification'], { 
            queryParams: { roleType: 'Sender', returnUrl: this.router.url } 
          });
        }
        return;
      }
      
      console.log('Delete clicked for order:', this.order);
      if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
        // Use the API to delete the offer
        this.offerService.deleteOffer(this.order.id).subscribe({
          next: (response) => {
            console.log('Offer deleted successfully:', response);
            this.deleteOrder.emit(this.order.id);
          },
          error: (error) => {
            console.error('Error deleting offer:', error);
            alert('حدث خطأ أثناء حذف العرض');
          }
        });
      }
    }).unsubscribe();
  }

  canEditOrder(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const userRoles = this.authService.getUserRoles();
    
    // Primary logic: authenticated + sender role + owner
    const standardCheck = this.authService.isAuthenticated() && 
                         this.authService.isSender() && 
                         this.isOrderOwner;
    
    // Fallback logic: authenticated + owner (for cases where role might be different)
    const fallbackCheck = this.authService.isAuthenticated() && 
                          this.isOrderOwner &&
                          (this.authService.hasRole('Sender') || 
                           this.authService.hasRole('sender') ||
                           userRoles.some(role => role.toLowerCase().includes('sender')));
    
    // Simple ownership check (most permissive - owner can always edit their own offers)
    const ownershipCheck = this.authService.isAuthenticated() && this.isOrderOwner;
    
    const canEdit = standardCheck || fallbackCheck || ownershipCheck;
           
    console.log('canEditOrder debug:', {
      isAuthenticated: this.authService.isAuthenticated(),
      isSender: this.authService.isSender(),
      isOrderOwner: this.isOrderOwner,
      standardCheck: standardCheck,
      fallbackCheck: fallbackCheck,
      ownershipCheck: ownershipCheck,
      canEdit: canEdit,
      currentUser: currentUser,
      userRoles: userRoles,
      userRole: currentUser?.Role
    });
    
    return canEdit;
  }

  canDeleteOrder(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const userRoles = this.authService.getUserRoles();
    
    // Primary logic: authenticated + sender role + owner
    const standardCheck = this.authService.isAuthenticated() && 
                         this.authService.isSender() && 
                         this.isOrderOwner;
    
    // Fallback logic: authenticated + owner (for cases where role might be different)
    const fallbackCheck = this.authService.isAuthenticated() && 
                          this.isOrderOwner &&
                          (this.authService.hasRole('Sender') || 
                           this.authService.hasRole('sender') ||
                           userRoles.some(role => role.toLowerCase().includes('sender')));
    
    // Simple ownership check (most permissive - owner can always delete their own offers)
    const ownershipCheck = this.authService.isAuthenticated() && this.isOrderOwner;
    
    const canDelete = standardCheck || fallbackCheck || ownershipCheck;
           
    // console.log('canDeleteOrder debug:', {
    //   isAuthenticated: this.authService.isAuthenticated(),
    //   isSender: this.authService.isSender(),
    //   isOrderOwner: this.isOrderOwner,
    //   standardCheck: standardCheck,
    //   fallbackCheck: fallbackCheck,
    //   ownershipCheck: ownershipCheck,
    //   canDelete: canDelete,
    //   currentUser: currentUser,
    //   userRoles: userRoles,
    //   userRole: currentUser?.role
    // });
    
    return canDelete;
  }

  canSendRequest(): boolean {
    return this.authService.isAuthenticated() && 
           this.authService.isCourier() && 
           !this.isOrderOwner;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order']) {
      // console.log('OrderCard ngOnChanges - order changed:', {
      //   previousValue: changes['order'].previousValue,
      //   currentValue: changes['order'].currentValue,
      //   firstChange: changes['order'].firstChange
      // });
      
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
