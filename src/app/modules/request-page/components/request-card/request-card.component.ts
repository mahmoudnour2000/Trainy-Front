import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Request, RequestStatus, RequestService } from '../../../../core/services/request.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OfferService } from '../../../../core/services/offer.service';

@Component({
  selector: 'app-request-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-card.component.html',
  styleUrls: ['./request-card.component.css']
})
export class RequestCardComponent implements OnInit {
  @Input() request!: Request;
  @Output() accept = new EventEmitter<number>();
  @Output() reject = new EventEmitter<number>();
  @Output() contact = new EventEmitter<number>();
  
  limitedMessage: string = '';
  isActionInProgress: boolean = false;
  isOfferOwner: boolean = false;

  constructor(
    private router: Router,
    private requestService: RequestService,
    private authService: AuthService,
    private offerService: OfferService
  ) { }

  ngOnInit(): void {
    this.truncateMessageIfNeeded();
    
    // Check if the current user is the offer owner
    this.checkIfOfferOwner();
  }
  
  private checkIfOfferOwner(): void {
    if (!this.request || !this.request.offerId) return;
    
    this.offerService.getOfferById(this.request.offerId).subscribe({
      next: (offer) => {
        if (offer) {
          const currentUserId = this.authService.getUserId();
          this.isOfferOwner = currentUserId === offer.senderId;
        }
      },
      error: (err) => console.error('Error checking offer ownership:', err)
    });
  }
  
  truncateMessageIfNeeded(): void {
    if (this.request && this.request.message) {
      this.limitedMessage = this.request.message.length > 100 ?
        this.request.message.substring(0, 100) + '...' :
        this.request.message;
    }
  }
  
  onContact(): void {
    // Check if the user can contact
    if (!this.canContact()) {
      alert('لا يمكنك التواصل مع هذا المستخدم');
      return;
    }
    
    console.log('Contact button clicked for request:', this.request.id, 'for offer:', this.request.offerId);
    
    // Show a message to the user
    alert('سيتم تفعيل خاصية التواصل قريباً');
  }
  
  acceptRequest(): void {
    // Check if user is authenticated and is a sender
    if (!this.authService.isAuthenticated()) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }
    
    if (!this.authService.isSender() || !this.isOfferOwner) {
      alert('فقط صاحب العرض يمكنه قبول الطلبات');
      return;
    }
    
    if (this.isActionInProgress) return;
    this.isActionInProgress = true;
    
    this.requestService.acceptRequest(this.request.id).subscribe({
      next: () => {
        alert('تم قبول الطلب بنجاح');
        // Update the request status locally
        this.request.status = RequestStatus.Accepted;
        this.isActionInProgress = false;
      },
      error: (err) => {
        console.error('Error accepting request:', err);
        alert('حدث خطأ أثناء قبول الطلب');
        this.isActionInProgress = false;
      }
    });
  }
  
  rejectRequest(): void {
    // Check if user is authenticated and is a sender
    if (!this.authService.isAuthenticated()) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }
    
    if (!this.authService.isSender() || !this.isOfferOwner) {
      alert('فقط صاحب العرض يمكنه رفض الطلبات');
      return;
    }
    
    if (this.isActionInProgress) return;
    this.isActionInProgress = true;
    
    this.requestService.rejectRequest(this.request.id).subscribe({
      next: () => {
        alert('تم رفض الطلب بنجاح');
        // Update the request status locally
        this.request.status = RequestStatus.Rejected;
        this.isActionInProgress = false;
      },
      error: (err) => {
        console.error('Error rejecting request:', err);
        alert('حدث خطأ أثناء رفض الطلب');
        this.isActionInProgress = false;
      }
    });
  }
  
  canAcceptOrReject(): boolean {
    // Only senders who own the offer can accept/reject and only if the request is pending
    return this.authService.isSender() && 
           this.isOfferOwner && 
           this.request.status === RequestStatus.Pending;
  }
  
  canContact(): boolean {
    // Only the offer owner can contact the courier if the request is accepted
    return this.authService.isAuthenticated() &&
           this.isOfferOwner && 
           this.request.status === RequestStatus.Accepted;
  }
  
  getStatusClass(): string {
    if (!this.request) return '';
    
    switch (this.request.status) {
      case RequestStatus.Pending:
        return 'status-pending';
      case RequestStatus.Accepted:
        return 'status-accepted';
      case RequestStatus.Rejected:
        return 'status-rejected';
      case RequestStatus.Completed:
        return 'status-completed';
      default:
        return '';
    }
  }
  
  getStatusText(): string {
    if (!this.request) return '';
    
    switch (this.request.status) {
      case RequestStatus.Pending:
        return 'قيد الانتظار';
      case RequestStatus.Accepted:
        return 'مقبول';
      case RequestStatus.Rejected:
        return 'مرفوض';
      case RequestStatus.Completed:
        return 'مكتمل';
      default:
        return 'غير معروف';
    }
  }

  formatDate(date: Date): string {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleDateString();
  }

  formatArabicDate(dateString: string | Date): string {
    if (!dateString) return '';
    
    // Convert to Date object if it's a string
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    // Arabic month names with proper index signature
    const arabicMonths: { [key: number]: string } = {
      0: "يناير", 1: "فبراير", 2: "مارس", 3: "أبريل", 4: "مايو", 5: "يونيو",
      6: "يوليو", 7: "أغسطس", 8: "سبتمبر", 9: "أكتوبر", 10: "نوفمبر", 11: "ديسمبر"
    };
    
    // Convert numbers to Arabic numerals
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const arabicDay = date.getDate().toString().split('').map(d => arabicNumerals[parseInt(d)]).join('');
    const arabicYear = date.getFullYear().toString().split('').map(d => arabicNumerals[parseInt(d)]).join('');
    
    // Use type assertion to ensure TypeScript recognizes the month index is valid
    const month = date.getMonth();
    return `${arabicDay} ${arabicMonths[month]} ${arabicYear}`;
  }
} 