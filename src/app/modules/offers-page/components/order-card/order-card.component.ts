import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RequestService } from '../../../../core/services/request.service';
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

  constructor(
    private router: Router,
    public authService: AuthService,
    private requestService: RequestService,
    private verificationService: VerificationService
  ) { }

  ngOnInit(): void {
    // Check verification status
    this.verificationService.verificationStatus$.subscribe((status: CombinedVerificationStatus) => {
      this.isCourierVerified = status.courierStatus === 'Accepted';
    });
  }

  private getCurrentUser(): any {
    // Placeholder - temporarily returning default values
    return { id: 'user123', role: 'Courier' };
  }

  isOwner(senderId: string): boolean {
    const currentUserId = this.authService.getUserId();
    return currentUserId === senderId;
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
    // Check if user is authenticated and is a courier
    if (!this.authService.isAuthenticated()) {
      this.onLoginPrompt();
      return;
    }
    
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
    // Check if user is authenticated and is the owner
    if (!this.authService.isAuthenticated()) {
      this.onLoginPrompt();
      return;
    }
    
    if (!this.isOwner(this.order.senderId)) {
      alert('لا يمكنك تعديل عرض لا تملكه');
      return;
    }
    
    console.log('Edit clicked');
    this.router.navigate(['/offers/add-offer', this.order.id]);
  }

  onDelete(): void {
    // Check if user is authenticated and is the owner
    if (!this.authService.isAuthenticated()) {
      this.onLoginPrompt();
      return;
    }
    
    if (!this.isOwner(this.order.senderId)) {
      alert('لا يمكنك حذف عرض لا تملكه');
      return;
    }
    
    console.log('Delete clicked');
    if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      this.deleteOrder.emit(this.order.id);
    }
  }

  canEditOrder(): boolean {
    return this.authService.isAuthenticated() && this.isOwner(this.order.senderId);
  }

  canDeleteOrder(): boolean {
    return this.authService.isAuthenticated() && this.isOwner(this.order.senderId);
  }

  canSendRequest(): boolean {
    return this.authService.isAuthenticated() && 
           this.authService.isCourier() && 
           this.isCourierVerified &&
           !this.isOwner(this.order.senderId);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
