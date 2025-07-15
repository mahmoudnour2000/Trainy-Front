import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DeliveryChatComponent } from './components/deliveryChat/deliveryChat.component';
import { RequestCardComponent } from '../request-page/components/request-card/request-card.component';
import { Request, RequestService, RequestStatus } from '../../core/services/request.service';
import { DeliveryChatService } from '../../core/services/delivery-chat.service';
import { AuthService } from '../../core/services/auth.service';
import { OfferService, Offer } from '../../core/services/offer.service';

@Component({
  selector: 'app-delivery-chat-page',
  standalone: true,
  imports: [CommonModule, DeliveryChatComponent, RequestCardComponent],
  templateUrl: './deliveryChatPage.html',
  styleUrls: ['./deliveryChatPage.css']
})
export class DeliveryChatPageComponent implements OnInit, OnDestroy {
  @ViewChild(DeliveryChatComponent) deliveryChatComponent!: DeliveryChatComponent;
  
  request: Request | null = null;
  offer: Offer | null = null;
  chatId: number = 0;
  requestId: number = 0;
  offerId: number = 0;
  courierId: string = '';
  isLoading = true;
  error: string | null = null;
  isProcessing = false;
  actionType: 'accept' | 'reject' | 'complete' | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService,
    private deliveryChatService: DeliveryChatService,
    private authService: AuthService,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    console.log('🚀 DeliveryChatPageComponent ngOnInit() called');
    
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      console.error('❌ User not authenticated');
      this.error = 'يجب تسجيل الدخول أولاً';
      this.isLoading = false;
      return;
    }
    
    this.initializePage();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Initialize the page with route parameters
   */
  private initializePage(): void {
    console.log('🚀 initializePage() called');
    
    // Get route parameters
    this.route.params.subscribe(params => {
      console.log('📥 Route params:', params);
      this.requestId = +params['requestId'];
      if (this.requestId) {
        console.log('✅ Valid requestId found:', this.requestId);
        this.loadRequest();
      } else {
        console.error('❌ No valid requestId found');
        this.error = 'معرف الطلب مطلوب';
        this.isLoading = false;
      }
    });
    
    // Get query parameters including chatId if provided
    this.route.queryParams.subscribe(queryParams => {
      console.log('📥 Query params:', queryParams);
      this.offerId = +queryParams['offerId'] || 0;
      this.courierId = queryParams['courierId'] || '';
      this.chatId = +queryParams['chatId'] || 0; // Use chatId from query params if available
      console.log('✅ Query params processed - offerId:', this.offerId, 'courierId:', this.courierId, 'chatId:', this.chatId);
    });
  }

  /**
   * Load request details and then create/get chat
   */
  private async loadRequest(): Promise<void> {
    console.log('🚀 loadRequest() called for requestId:', this.requestId);
    
    try {
      this.isLoading = true;
      this.error = null;
      this.requestService.getRequestById(this.requestId).subscribe({
        next: async (request) => {
          console.log('📥 Request loaded:', request);
          
          if (request) {
            this.request = request;
            // Get offerId from request or query params
            const offerIdParam = this.route.snapshot.queryParamMap.get('offerId');
            this.offerId = request.offerId || (offerIdParam ? +offerIdParam : 0);
            
            // Set courierId from request
            this.courierId = request.CourierId || '';
            
            // Debug logs
            console.log('✅ Request processed:');
            console.log('  - Request ID:', request.id);
            console.log('  - Offer ID:', this.offerId);
            console.log('  - Courier ID:', this.courierId);
            console.log('  - Request Status:', request.status);
            console.log('  - Request senderId:', request.senderId);
            console.log('  - Current User ID:', this.authService.getUserId());
            
            // Load offer details for validation
            if (this.offerId) {
              await this.loadOffer();
            }
            
            // Validate required data
            if (!this.offerId || this.offerId <= 0) {
              console.error('❌ Missing or invalid offerId');
              this.error = 'معرف العرض مطلوب';
              this.isLoading = false;
              return;
            }
            
            if (!this.courierId) {
              console.error('❌ Missing CourierId');
              this.error = 'معرف الموصل مطلوب';
              this.isLoading = false;
              return;
            }
            
            // After loading request, create/get chat only if chatId is not provided
            if (this.chatId && this.chatId > 0) {
              console.log('✅ ChatId already provided from query params:', this.chatId);
            } else {
              console.log('🔄 About to call initializeChat()');
            await this.initializeChat();
              console.log('✅ initializeChat() completed, chatId:', this.chatId);
            }
          } else {
            console.error('❌ No request found');
            this.error = 'لم يتم العثور على الطلب';
          }
          this.isLoading = false;
          console.log('✅ loadRequest() completed, isLoading:', this.isLoading, 'chatId:', this.chatId);
        },
        error: (error) => {
          console.error('❌ Error loading request:', error);
          this.error = 'حدث خطأ أثناء تحميل الطلب';
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('❌ Error in loadRequest:', error);
      this.error = 'حدث خطأ أثناء تحميل الطلب';
      this.isLoading = false;
    }
  }

  /**
   * Load offer details
   */
  private async loadOffer(): Promise<void> {
    try {
      console.log('🔄 Loading offer details for offerId:', this.offerId);
      this.offerService.getOfferById(this.offerId).subscribe({
        next: (offer) => {
          if (offer) {
            this.offer = offer;
            console.log('✅ Offer loaded:', offer);
            console.log('  - Offer senderId:', offer.senderId);
            console.log('  - Offer status:', offer.status);
          }
        },
        error: (error) => {
          console.error('❌ Error loading offer:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error in loadOffer:', error);
    }
  }

  /**
   * Create or get chat for this offer and courier
   */
  private async initializeChat(): Promise<void> {
    console.log('🚀 initializeChat() called');
    
    try {
      console.log('📊 Current values - offerId:', this.offerId, 'courierId:', this.courierId);
      
      if (!this.offerId || isNaN(this.offerId) || this.offerId <= 0) {
        console.error('❌ Invalid offerId:', this.offerId);
        this.error = 'معرف العرض غير صحيح';
        return;
      }
      if (!this.courierId) {
        console.error('❌ Invalid courierId:', this.courierId);
        this.error = 'معرف الموصل غير صحيح';
        return;
      }
      
      // Debug log before calling createChat
      console.log('🔄 Calling createChat with offerId:', this.offerId, 'courierId:', this.courierId);
      
      const chat = await this.deliveryChatService.createChat(this.offerId, this.courierId);
      console.log('📥 CreateChat API response:', chat);
      
      if (chat && chat.id) {
        this.chatId = chat.id;
        console.log('✅ Chat created/retrieved successfully with ID:', this.chatId);
      } else {
        console.error('❌ Failed to create chat - no valid response or missing ID');
        console.error('❌ Response details:', chat);
        this.error = 'فشل في إنشاء المحادثة';
        return;
      }
      
      console.log('✅ initializeChat() completed - Final chatId:', this.chatId);
      
    } catch (error) {
      console.error('❌ Error in initializeChat():', error);
      this.error = 'حدث خطأ أثناء إنشاء المحادثة';
    }
  }

  /**
   * Accept the request
   */
  async acceptRequest(): Promise<void> {
    if (this.isProcessing || !this.canAcceptOrReject()) return;
    if (!this.request || !this.chatId) return;

    const confirmed = confirm('هل أنت متأكد من قبول هذا الطلب؟ سيتم تحويل حالة الطلب إلى "قيد التنفيذ".');
    if (!confirmed) return;

    this.isProcessing = true;
    this.actionType = 'accept';

    try {
      // Use delivery chat service to accept the request
        await this.deliveryChatService.acceptRequest(this.chatId);
      
      // Refresh the chat status in the chat component
      if (this.deliveryChatComponent) {
        await this.deliveryChatComponent.refreshChatStatus();
      }
      
      // Reload the request to get updated status
      await this.reloadRequest();
      
      alert('✅ تم قبول الطلب بنجاح! يمكنك الآن تأكيد التوصيل من المحادثة.');
    } catch (error) {
      console.error('Failed to accept request:', error);
      alert('❌ فشل في قبول الطلب. حاول مرة أخرى.');
    } finally {
      this.isProcessing = false;
      this.actionType = null;
    }
  }

  /**
   * Reject the request
   */
  async rejectRequest(): Promise<void> {
    if (this.isProcessing || !this.canAcceptOrReject()) return;
    if (!this.request || !this.chatId) return;

    const confirmed = confirm('هل أنت متأكد من رفض هذا الطلب؟ سيتم إلغاء الطلب نهائياً.');
    if (!confirmed) return;

    this.isProcessing = true;
    this.actionType = 'reject';

    try {
      // Use delivery chat service to reject the request
      await this.deliveryChatService.rejectRequest(this.chatId);
      
      // Refresh the chat status in the chat component
      if (this.deliveryChatComponent) {
        await this.deliveryChatComponent.refreshChatStatus();
      }
      
      // Reload the request to get updated status
      await this.reloadRequest();
      
      alert('❌ تم رفض الطلب.');
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('❌ فشل في رفض الطلب. حاول مرة أخرى.');
    } finally {
      this.isProcessing = false;
      this.actionType = null;
    }
  }

  /**
   * Check if current user can accept or reject requests
   */
  canAcceptOrReject(): boolean {
    return this.isOfferOwner() && this.request?.status === RequestStatus.Pending;
  }

  /**
   * Check if current user can complete delivery
   */
  canCompleteDelivery(): boolean {
    const hasValidOfferId = !!(this.offerId && this.offerId > 0);
    const canComplete = this.isOfferOwner() && this.request?.status === RequestStatus.Accepted && hasValidOfferId;
    
    console.log('🔍 canCompleteDelivery check:');
    console.log('  - isOfferOwner:', this.isOfferOwner());
    console.log('  - request status:', this.request?.status);
    console.log('  - RequestStatus.Accepted:', RequestStatus.Accepted);
    console.log('  - hasValidOfferId:', hasValidOfferId);
    console.log('  - offerId:', this.offerId);
    console.log('  - Can complete:', canComplete);
    
    return canComplete;
  }

  /**
   * Check if delivery is completed
   */
  isDeliveryCompleted(): boolean {
    return this.request?.status === RequestStatus.Completed;
  }

  /**
   * Show completion confirmation modal
   */
  showCompletionConfirmation(): void {
    console.log('🔄 showCompletionConfirmation() called');
    console.log('📊 Current offerId:', this.offerId);
    console.log('📊 Current user:', this.authService.getUserId());
    console.log('📊 Can complete delivery:', this.canCompleteDelivery());
    
    try {
      const modalElement = document.getElementById('completionModal');
      console.log('📊 Modal element found:', !!modalElement);
      
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        console.log('✅ Bootstrap modal created, showing...');
        modal.show();
      } else {
        console.warn('⚠️ Modal element not found, using browser confirm');
        // If modal element not found, use browser confirm
        this.showBrowserConfirmation();
      }
    } catch (error) {
      console.error('❌ Error showing completion modal:', error);
      // Fallback to confirm dialog
      this.showBrowserConfirmation();
    }
  }

  /**
   * Show browser confirmation dialog
   */
  private showBrowserConfirmation(): void {
    console.log('🔄 showBrowserConfirmation() called');
    
    const confirmed = confirm('بهذا التأكيد على عملية التوصيل فإنه ليس من حقك الشكوى على أي شيء يخص عملية التوصيل ويجب التأكد بشكل كامل من صحة الشيء الذي تم توصيله. هل تريد المتابعة؟');
    
    console.log('📊 User confirmed:', confirmed);
    
    if (confirmed) {
      console.log('✅ User confirmed, calling completeDelivery()');
      this.completeDelivery();
    } else {
      console.log('❌ User cancelled confirmation');
    }
  }

  /**
   * Complete delivery (called from modal confirmation)
   */
  async completeDelivery(): Promise<void> {
    console.log('🚀 completeDelivery() method called!');
    console.log('📊 isProcessing:', this.isProcessing);
    console.log('📊 offerId:', this.offerId);
    console.log('📊 Current User ID:', this.authService.getUserId());
    console.log('📊 Auth token exists:', !!this.authService.getToken());
    
    if (this.isProcessing || !this.offerId) {
      console.warn('⚠️ Cannot complete delivery: already processing or no offerId');
      console.warn('⚠️ isProcessing:', this.isProcessing, 'offerId:', this.offerId);
      return;
    }
    
    this.isProcessing = true;
    this.actionType = 'complete';
    
    try {
      console.log('🔄 Attempting to complete delivery with offerId:', this.offerId);
      console.log('📊 Current user ID:', this.authService.getUserId());
      console.log('📊 Request status:', this.request?.status);
      console.log('📊 Request details:', this.request);
      
      // Use offer service to confirm delivery completion
      console.log('🔄 Calling OfferService.confirmDelivery with offerId:', this.offerId);
      const response = await this.offerService.confirmDelivery(this.offerId).toPromise();
      console.log('📥 OfferController confirm-delivery response:', response);
      
      console.log('✅ Delivery completed successfully via OfferController API');
      
      // Hide modal if it exists
      this.hideCompletionModal();
      
      // Refresh the chat status in the chat component
      if (this.deliveryChatComponent) {
        await this.deliveryChatComponent.refreshChatStatus();
      }
      
      // Reload the request to get updated status
      await this.reloadRequest();
      
      console.log('✅ All post-completion actions completed');
      alert('🎉 تم اكتمال التوصيل بنجاح! تم تحويل الأموال للموصل.');
      
    } catch (error: any) {
      console.error('❌ Failed to complete delivery:', error);
      
      // Extract more detailed error information
      let errorMessage = '❌ فشل في تأكيد التوصيل. حاول مرة أخرى.';
      
      if (error?.error?.message) {
        errorMessage = `❌ فشل في تأكيد التوصيل: ${error.error.message}`;
        console.error('Backend error message:', error.error.message);
      } else if (error?.message) {
        errorMessage = `❌ فشل في تأكيد التوصيل: ${error.message}`;
        console.error('Error message:', error.message);
      }
      
      if (error?.status) {
        console.error('HTTP Status:', error.status);
        console.error('Full error response:', error.status);
      }
      
      // Hide modal on error
      this.hideCompletionModal();
      
      alert(errorMessage);
    } finally {
      this.isProcessing = false;
      this.actionType = null;
    }
  }

  /**
   * Hide completion modal
   */
  private hideCompletionModal(): void {
    try {
      const modalElement = document.getElementById('completionModal');
      if (modalElement) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    } catch (modalError) {
      console.warn('Could not hide modal:', modalError);
    }
  }

  /**
   * Load offer details to check ownership
   */
  private async loadOfferDetails(): Promise<void> {
    // This method can be implemented to verify offer ownership
    // For now, we'll assume the user navigated here from a valid request card
  }

  /**
   * Go back to previous page
   */
  goBack(): void {
    // Try to go back in browser history first
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback: navigate to offers page
      this.router.navigate(['/offers']);
    }
  }

  /**
   * Check if current user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.authService.getUserId();
  }

  /**
   * Check if current user is the offer owner
   */
  isOfferOwner(): boolean {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.log('❌ isOfferOwner: Missing userId');
      return false;
    }
    
    // First try to use offer data (more reliable)
    if (this.offer && this.offer.senderId) {
      const isOwner = this.offer.senderId === userId;
      console.log('🔍 isOfferOwner check (using offer):');
      console.log('  - Current userId:', userId);
      console.log('  - Offer senderId:', this.offer.senderId);
      console.log('  - Is owner:', isOwner);
      return isOwner;
    }
    
    // Fallback to request data
    if (this.request) {
      const senderId = this.request.senderId || (this.request as any).SenderId;
      const isOwner = senderId === userId;
      console.log('🔍 isOfferOwner check (using request fallback):');
      console.log('  - Current userId:', userId);
      console.log('  - Request senderId:', senderId);
      console.log('  - Is owner:', isOwner);
      return isOwner;
    }
    
    console.log('❌ isOfferOwner: No offer or request data available');
    return false;
  }

  /**
   * Reload the current request
   */
  private async reloadRequest(): Promise<void> {
    if (!this.requestId) return;
    
    try {
      this.requestService.getRequestById(this.requestId).subscribe({
        next: (request) => {
          if (request) {
            this.request = request;
            console.log('Request reloaded:', request);
          }
        },
        error: (error) => {
          console.error('Failed to reload request:', error);
        }
      });
    } catch (error) {
      console.error('Error reloading request:', error);
    }
  }
}
