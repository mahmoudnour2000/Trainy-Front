import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
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
export class OrderCardComponent implements OnInit {
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
    this.currentUserId = this.authService.getUserId();
    this.checkOrderOwnership();
    
    // Check verification status
    this.verificationService.verificationStatus$.subscribe((status: CombinedVerificationStatus) => {
      this.isCourierVerified = status.courierStatus === 'Accepted';
      this.isSenderVerified = status.senderStatus === 'Accepted';
    });
  }

  private checkOrderOwnership(): void {
    // Check if current user is the owner of this offer
    // Handle both senderId and userId properties for compatibility
    this.isOrderOwner = this.currentUserId === this.order.senderId || 
                       this.currentUserId === this.order.userId;
  }

  isOwner(senderId: string): boolean {
    // Handle both senderId and userId properties for compatibility
    return this.currentUserId === senderId || 
           this.currentUserId === this.order.senderId || 
           this.currentUserId === this.order.userId;
  }

  onShowDetails(): void {
    if (!this.order.id) {
      console.error('Order is missing ID');
      return;
    }
    
    // Navigate to the request page with the offer ID
    this.router.navigate(['/requests/offer', this.order.id]);
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
    return this.authService.isAuthenticated() && 
           this.authService.isSender() && 
           this.isOrderOwner &&
           this.isSenderVerified;
  }

  canDeleteOrder(): boolean {
    return this.authService.isAuthenticated() && 
           this.authService.isSender() && 
           this.isOrderOwner &&
           this.isSenderVerified;
  }

  canSendRequest(): boolean {
    return this.authService.isAuthenticated() && 
           this.authService.isCourier() && 
           this.isCourierVerified &&
           !this.isOrderOwner;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
