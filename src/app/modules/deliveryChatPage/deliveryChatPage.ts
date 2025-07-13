import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DeliveryChatComponent } from './components/deliveryChat/deliveryChat.component';
import { RequestCardComponent } from '../request-page/components/request-card/request-card.component';
import { Request, RequestService, RequestStatus } from '../../core/services/request.service';
import { DeliveryChatService } from '../../core/services/delivery-chat.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-delivery-chat-page',
  standalone: true,
  imports: [CommonModule, DeliveryChatComponent, RequestCardComponent],
  templateUrl: './deliveryChatPage.html',
  styleUrls: ['./deliveryChatPage.css']
})
export class DeliveryChatPageComponent implements OnInit, OnDestroy {
  request: Request | null = null;
  chatId: number = 0;
  requestId: number = 0;
  offerId: number = 0;
  courierId: string = '';
  isLoading = true;
  error: string | null = null;
  isProcessing = false;
  actionType: 'accept' | 'reject' | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService,
    private deliveryChatService: DeliveryChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializePage();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Initialize the page with route parameters
   */
  private initializePage(): void {
    // Get route parameters
    this.route.params.subscribe(params => {
      this.requestId = +params['requestId'];
      // Remove chatId from params, always get it after chat creation
      // this.chatId = +params['chatId'];
      if (this.requestId) {
        this.loadRequest();
      } else {
        this.error = 'معرف الطلب مطلوب';
        this.isLoading = false;
      }
    });
    // Query params are not needed for chatId
    this.route.queryParams.subscribe(queryParams => {
      this.offerId = +queryParams['offerId'] || 0;
      this.courierId = queryParams['courierId'] || '';
    });
  }

  /**
   * Load request details and then create/get chat
   */
  private async loadRequest(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      this.requestService.getRequestById(this.requestId).subscribe({
        next: async (request) => {
          if (request) {
            this.request = request;
            // Fallback: if offerId is missing, try to get it from query params
            const offerIdParam = this.route.snapshot.queryParamMap.get('offerId');

            this.offerId = request.offerId || (offerIdParam ? +offerIdParam : 0);
            // // Fallback: if courierId is missing, use current user ID, always as string
            // this.courierId = request.courierId || this.authService.getUserId() || '';
            // Debug logs
            console.log('Loaded request:', this.request.CourierId);
            console.log('Extracted offerId:', this.offerId, 'courierId:', this.request.CourierId);
            // After loading request, create/get chat
            await this.initializeChat();
          } else {
            this.error = 'لم يتم العثور على الطلب';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'حدث خطأ أثناء تحميل الطلب';
          this.isLoading = false;
        }
      });
    } catch (error) {
      this.error = 'حدث خطأ أثناء تحميل الطلب';
      this.isLoading = false;
    }
  }

  /**
   * Create or get chat for this offer and courier
   */
  private async initializeChat(): Promise<void> {
    try {
      if (!this.offerId || isNaN(this.offerId) || this.offerId <= 0) {
        this.error = 'معرف العرض غير صالح (offerId)';
        console.error('Invalid offerId:', this.offerId);
        return;
      }
      if (!this.request?.CourierId) {
        this.error = 'معرف الموصل غير صالح (request.CourierId)';
        console.error('Invalid courierId:', this.request?.CourierId);
        return;
      }
      // Debug log before calling createChat
      console.log('Calling createChat with offerId:', this.offerId, 'courierId:',this.request?.CourierId);
      const chat = await this.deliveryChatService.createChat(this.offerId, this.request?.CourierId);
      if (chat) {
        this.chatId = chat.id;
      } else {
        this.error = 'تعذر إنشاء أو جلب المحادثة';
      }
    } catch (error) {
      this.error = 'حدث خطأ أثناء إنشاء المحادثة';
    }
  }

  /**
   * Accept the request
   */
  async acceptRequest(): Promise<void> {
    if (this.isProcessing || !this.canAcceptOrReject()) {
      return;
    }

    const confirmed = confirm('هل أنت متأكد من قبول هذا الطلب؟ سيتم تحويل الأموال للموصل.');
    if (!confirmed) return;

    this.isProcessing = true;
    this.actionType = 'accept';

    try {
      if (this.chatId) {
        await this.deliveryChatService.acceptRequest(this.chatId);
        alert('✅ تم قبول الطلب بنجاح!');
        console.log('✅ Request accepted successfully');
      }
    } catch (error) {
      console.error('❌ Failed to accept request:', error);
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
    if (this.isProcessing || !this.canAcceptOrReject()) {
      return;
    }

    const confirmed = confirm('هل أنت متأكد من رفض هذا الطلب؟');
    if (!confirmed) return;

    this.isProcessing = true;
    this.actionType = 'reject';

    try {
      // Note: You might need to implement reject functionality in the backend
      // For now, we'll show a message
      alert('❌ تم رفض الطلب.');
      console.log('Request rejected');
    } catch (error) {
      console.error('❌ Failed to reject request:', error);
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
    if (!this.request || !this.authService.isAuthenticated()) {
      return false;
    }

    // Check if the request is pending and user is authenticated
    // We'll add offer ownership check by loading offer details
    return this.request.status === RequestStatus.Pending;
  }

  /**
   * Load offer details to check ownership
   */
  private async loadOfferDetails(): Promise<void> {
    // This method can be implemented to verify offer ownership
    // For now, we'll assume the user navigated here from a valid request card
  }

  /**
   * Navigate back to requests page
   */
  goBack(): void {
    this.router.navigate(['/requests']);
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
}
