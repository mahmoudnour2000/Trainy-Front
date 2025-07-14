import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Request, RequestStatus, RequestService } from '../../../../core/services/request.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OfferService } from '../../../../core/services/offer.service';
import { DeliveryChatService } from '../../../../core/services/delivery-chat.service';

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
  isRequestOwner: boolean = false;
  
  // Chat functionality properties
  chatExistsMap: { [key: string]: boolean } = {};
  isLoadingChats: boolean = false;

  constructor(
    private router: Router,
    private requestService: RequestService,
    private authService: AuthService,
    private offerService: OfferService,
    private deliveryChatService: DeliveryChatService
  ) { }

  ngOnInit(): void {
    console.log('🚀 RequestCardComponent initialized with request:', this.request);
    this.truncateMessageIfNeeded();
    
    // Check if the current user is the offer owner
    this.checkIfOfferOwner();
    
    // Check if the current user is the request owner
    this.checkIfRequestOwner();
    
    // Check if chat exists for this request (only after user roles are determined)
    setTimeout(() => {
      this.checkChatExistsForRequest();
    }, 100);
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
          
          console.log('👤 RequestCard checkIfOfferOwner:', {
            currentUserId: currentUserId,
            possibleSenderIds: possibleSenderIds,
            isOfferOwner: this.isOfferOwner,
            offerId: this.request.offerId
          });
        }
      },
      error: (err) => console.error('❌ Error checking offer ownership:', err)
    });
  }
  
  private checkIfRequestOwner(): void {
    if (!this.request) return;
    
    const currentUserId = this.authService.getUserId();
    if (!currentUserId) return;
    
    // Check if current user is the request owner (courier)
    const requestCourierId = this.request.courierId || this.request.CourierId;
    this.isRequestOwner = requestCourierId === currentUserId;
    
    console.log('👤 RequestCard checkIfRequestOwner:', {
      currentUserId: currentUserId,
      requestCourierId: requestCourierId,
      isRequestOwner: this.isRequestOwner,
      requestId: this.request.id
    });
  }
  
  private async checkChatExistsForRequest(): Promise<void> {
    if (!this.request || !this.request.offerId) return;

    const currentUserId = this.authService.getUserId();
    if (!currentUserId) return;

    const offerId = this.request.offerId;
    const requestCourierId = this.request.courierId || this.request.CourierId;

    this.isLoadingChats = true;

    try {
      // التحقق من وجود شات بين المستخدم الحالي وهذا العرض
      const existingChatId = await this.deliveryChatService.getExistingChatId(offerId, currentUserId);
      const chatExists = existingChatId !== null;
      
      this.chatExistsMap[offerId] = chatExists;
      
      console.log('💬 Chat existence check:', {
        offerId,
        currentUserId,
        requestCourierId,
        chatExists,
        existingChatId,
        isOfferOwner: this.isOfferOwner,
        isRequestOwner: this.isRequestOwner
      });
      
    } catch (err) {
      console.error('❌ Error checking chat existence:', err);
      this.chatExistsMap[offerId] = false; // Assume not exists on error
    } finally {
      this.isLoadingChats = false;
    }
  }
  
  truncateMessageIfNeeded(): void {
    if (this.request && this.request.message) {
      this.limitedMessage = this.request.message.length > 100 ?
        this.request.message.substring(0, 100) + '...' :
        this.request.message;
    }
  }
  
  async onContact(): Promise<void> {
    // تحقق من الصلاحية قبل التنفيذ
    if (!this.canShowContactButton()) {
      console.log('❌ Contact button should not be visible');
      return;
    }
    
    this.isActionInProgress = true;
    
    try {
      const currentUserId = this.authService.getUserId();
      const requestCourierId = this.request.courierId || this.request.CourierId;
      
      console.log('🚀 onContact started:', {
        currentUserId,
        requestCourierId,
        isOfferOwner: this.isOfferOwner,
        isRequestOwner: this.isRequestOwner,
        offerId: this.request.offerId
      });
    
    this.contact.emit(this.request.id);
      
      if (!requestCourierId) {
        alert('معرف الموصل غير متوفر');
        return;
      }
      
      let chatId: number;
      
      // إذا كان صاحب العرض، يمكنه إنشاء محادثة جديدة أو الانضمام لموجودة
      if (this.isOfferOwner) {
        console.log('🔄 Offer owner creating/getting chat...');
        chatId = await this.deliveryChatService.getOrCreateChatId(this.request.offerId, requestCourierId);
        console.log('✅ Chat ID for offer owner:', chatId);
        
        // تحديث حالة وجود الشات بعد الإنشاء
        this.chatExistsMap[this.request.offerId] = true;
        
      } else {
        // إذا كان صاحب الطلب، يمكنه فقط الانضمام لمحادثة موجودة
        console.log('🔄 Request owner joining existing chat...');
        
        if (!currentUserId) {
          alert('يجب تسجيل الدخول أولاً');
          return;
        }
        
        const existingChatId = await this.deliveryChatService.getExistingChatId(this.request.offerId, currentUserId);
        
        if (!existingChatId) {
          alert('لا يوجد محادثة مع صاحب العرض بعد. يجب على صاحب العرض بدء المحادثة أولاً.');
          return;
        }
        
        chatId = existingChatId as number;
        console.log('✅ Existing chat ID for request owner:', chatId);
      }
      
      // Navigate to delivery chat page with chatId
      console.log('🔄 Navigating to delivery chat...');
    this.router.navigate(['/delivery-chat', this.request.id], {
      queryParams: {
        offerId: this.request.offerId,
          courierId: requestCourierId,
          chatId: chatId
        }
      });
      
    } catch (error) {
      console.error('❌ Error in onContact:', error);
      alert('حدث خطأ أثناء محاولة فتح المحادثة');
    } finally {
      this.isActionInProgress = false;
    }
  }
  

  

  
  canContact(): boolean {
    if (!this.authService.isAuthenticated() || !this.request) {
      return false;
    }
    
    const currentUserId = this.authService.getUserId();
    if (!currentUserId) {
      return false;
    }
    
    // يمكن للتواصل إذا كان:
    // 1. صاحب العرض (Sender) - يمكنه إنشاء محادثة جديدة دائماً
    // 2. صاحب الطلب (Courier) - فقط إذا أنشأ صاحب العرض شات مسبقاً
    const isRequestOwner = this.request.courierId === currentUserId || 
                          this.request.CourierId === currentUserId;
    
    // إذا كان صاحب العرض، يمكنه التواصل دائماً
    if (this.isOfferOwner) {
      return true;
    }
    
    // إذا كان صاحب الطلب، يمكنه التواصل فقط إذا أنشأ صاحب العرض شات مسبقاً
    if (isRequestOwner) {
      const chatExists = this.chatExistsMap[this.request.offerId] || false;
      return chatExists;
    }
    
    console.log('🔍 canContact debug:', {
      currentUserId,
      isOfferOwner: this.isOfferOwner,
      isRequestOwner,
      requestCourierId: this.request.courierId || this.request.CourierId,
      chatExists: this.chatExistsMap[this.request.offerId] || false,
      canContact: false,
      offerId: this.request.offerId
    });
    
    return false;
  }
  
  /**
   * التحقق من إمكانية عرض زر التواصل
   * يظهر الزر فقط عندما يكون هناك شات موجود (أنشأه صاحب العرض)
   */
  canShowContactButton(): boolean {
    if (!this.authService.isAuthenticated() || !this.request) {
      return false;
    }
    
    const currentUserId = this.authService.getUserId();
    if (!currentUserId) {
      return false;
    }
    
    // التحقق من أن المستخدم الحالي هو صاحب الطلب أو صاحب العرض
    const isRequestOwner = this.request.courierId === currentUserId || 
                          this.request.CourierId === currentUserId;
    
    if (!this.isOfferOwner && !isRequestOwner) {
      return false;
    }
    
    // إذا كان صاحب العرض، يمكنه دائماً رؤية الزر
    if (this.isOfferOwner) {
      return true;
    }
    
    // إذا كان صاحب الطلب، يظهر الزر فقط إذا كان هناك شات موجود
    if (isRequestOwner) {
      const chatExists = this.chatExistsMap[this.request.offerId] || false;
      return chatExists;
    }
    
    return false;
  }
  
  /**
   * التحقق من أن المستخدم الحالي هو صاحب الطلب
   */
  isCurrentUserRequestOwner(): boolean {
    const currentUserId = this.authService.getUserId();
    return currentUserId === (this.request.courierId || this.request.CourierId);
  }
  
  getStatusClass(): string {
    if (!this.request) return '';
    
    switch (this.request.status) {
      case RequestStatus.Pending:
        return 'bg-warning text-dark';
      case RequestStatus.Accepted:
        return 'bg-success';
      case RequestStatus.Rejected:
        return 'bg-danger';
      case RequestStatus.Completed:
        return 'bg-primary';
      default:
        return 'bg-secondary';
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