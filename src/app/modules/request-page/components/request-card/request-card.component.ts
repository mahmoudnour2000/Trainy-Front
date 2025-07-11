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
  @Input() showActions: boolean = true; // Control whether to show action buttons
  @Input() isViewOnly: boolean = false; // Control if this is view-only mode
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
    console.log('RequestCardComponent received request:', this.request);
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
          
          // Handle different possible sender ID properties from API
          const offerAny = offer as any;
          const possibleSenderIds = [
            offer.senderId,
            offerAny?.senderId,
            offerAny?.SenderId,
            offerAny?.UserId,
            offerAny?.UserID,
            offerAny?.ID && offerAny?.SenderId ? offerAny.SenderId : null
          ].filter(id => id != null && id !== undefined && id !== '');
          
          // Try both string and number comparisons
          this.isOfferOwner = possibleSenderIds.some(id => {
            const idStr = String(id);
            const userIdStr = String(currentUserId);
            return idStr === userIdStr || id === currentUserId;
          });
          
          console.log('RequestCard checkIfOfferOwner debug:', {
            currentUserId: currentUserId,
            possibleSenderIds: possibleSenderIds,
            isOfferOwner: this.isOfferOwner,
            offer: offer
          });
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
    // تحقق من الصلاحية قبل التنفيذ
    if (!this.canContact()) {
      alert('لا يمكنك التواصل مع هذا المستخدم');
      return;
    }
    
    this.contact.emit(this.request.id);
    
    // Navigate to delivery chat page
    this.router.navigate(['/delivery-chat', this.request.id], {
      queryParams: {
        offerId: this.request.offerId,
        courierId: this.request.courierId
      }
    });
  }
  

  

  
  canContact(): boolean {
    // يجب أن يكون المستخدم مسجل دخول وأن يكون صاحب العرض
    return this.authService.isAuthenticated() && this.isOfferOwner;
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