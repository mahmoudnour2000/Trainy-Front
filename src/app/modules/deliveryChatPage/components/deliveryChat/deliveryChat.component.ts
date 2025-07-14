import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DeliveryChatService, ChatMessage, ChatStatus } from '../../../../core/services/delivery-chat.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-delivery-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deliveryChat.component.html',
  styleUrls: ['./deliveryChat.component.css']
})
export class DeliveryChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @Input() chatId: number = 0;
  @Input() requestId: number = 0;
  @Input() offerId: number = 0;
  @Input() courierId: string = '';

  messages: ChatMessage[] = [];
  newMessage: string = '';
  chatStatus: ChatStatus | null = null;
  isProcessing = false;
  isConnected = false;
  actionType: 'accept' | 'reject' | 'send' | 'complete' | null = null;
  currentUserId: string | null = null;
  isLoadingActions = false;
  isInitialized = false;
  
  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  constructor(
    private deliveryChatService: DeliveryChatService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.initializeChat();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.chatId) {
      this.deliveryChatService.leaveChat(this.chatId);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Initialize chat connection and load data
   */
  private async initializeChat(): Promise<void> {
    try {
      if (!this.chatId || this.chatId <= 0) {
        console.error('Chat ID is required, got:', this.chatId);
        return;
      }

      console.log('🔄 Initializing chat with ID:', this.chatId);

      // Clear previous state
      this.messages = [];
      this.chatStatus = null;
      this.isInitialized = false;

      // Load chat status first - this is critical for message display
      await this.loadChatStatus();

      // Subscribe to real-time updates after loading initial status
      this.setupSubscriptions();

      // Load initial chat messages
      await this.loadChatMessages();

      // Try to connect to SignalR
      try {
        console.log('🔄 Attempting to start SignalR connection...');
        await this.deliveryChatService.startConnection();
        console.log('✅ SignalR connection started successfully');
        
        console.log('🔄 Attempting to join chat with ID:', this.chatId);
        await this.deliveryChatService.joinChat(this.chatId);
        console.log('✅ Connected to chat hub and joined chat');

      this.isConnected = true;
      } catch (connectionError) {
        console.error('❌ Failed to connect to chat hub:', connectionError);
        this.isConnected = false;
        
        // Add a system message about connection failure
        this.addSystemMessage('⚠️ لا يمكن الاتصال بالخادم. ستعمل المحادثة في وضع محدود.');
      }

      // If no messages loaded, add a welcome message
      if (this.messages.length === 0) {
        this.addSystemMessage('مرحباً! يمكنك الآن بدء المحادثة.');
      }

      this.isInitialized = true;
      console.log('✅ Chat initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize chat:', error);
      this.isConnected = false;
      // Set some fallback state
      this.messages = [];
      this.isInitialized = true;
    }
  }

  /**
   * Setup subscriptions for real-time updates
   */
  private setupSubscriptions(): void {
    // Subscribe to messages
    this.subscriptions.push(
      this.deliveryChatService.messages$.subscribe(messages => {
        if (messages && messages.length > 0) {
        this.messages = messages;
        this.shouldScrollToBottom = true;
        }
      })
    );

    // Subscribe to chat status
    this.subscriptions.push(
      this.deliveryChatService.chatStatus$.subscribe(status => {
        if (status) {
        this.chatStatus = status;
        console.log('Chat status updated:', status);
        }
      })
    );

    // Subscribe to connection status
    this.subscriptions.push(
      this.deliveryChatService.connectionStatus$.subscribe(status => {
        this.isConnected = status;
      })
    );
  }

  /**
   * Load chat messages from API
   */
  private async loadChatMessages(): Promise<void> {
    try {
      console.log('🔄 Loading chat messages for chat ID:', this.chatId);
      const messages = await this.deliveryChatService.getChatMessages(this.chatId);
      this.messages = messages || [];
      this.shouldScrollToBottom = true;
      console.log('✅ Chat messages loaded successfully, count:', this.messages.length);
    } catch (error) {
      console.error('❌ Failed to load chat messages:', error);
      // Initialize with empty messages on error
      this.messages = [];
      // Don't throw error, just log it
    }
  }

  /**
   * Send a message
   */
  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() || this.isProcessing) {
      return;
    }

    // For debugging, allow sending even when not connected
    if (!this.isConnected) {
      console.warn('⚠️ Attempting to send message while not connected');
    }

    this.isProcessing = true;
    this.actionType = 'send';

    try {
      await this.deliveryChatService.sendMessage(this.chatId, this.newMessage.trim());
      this.newMessage = '';
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      this.addSystemMessage('فشل في إرسال الرسالة. حاول مرة أخرى.');
    } finally {
      this.isProcessing = false;
      this.actionType = null;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(): Promise<void> {
    try {
      await this.deliveryChatService.markMessagesAsRead(this.chatId);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }

  /**
   * Handle Enter key press for sending messages
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Check if current user can send messages
   */
  canSendMessages(): boolean {
    // For debugging, allow sending messages even when not connected
    // In production, this should be: return this.isConnected && this.authService.isAuthenticated();
    return this.authService.isAuthenticated();
  }

  /**
   * Load chat status - Public method that can be called from parent
   */
  async refreshChatStatus(): Promise<void> {
    await this.loadChatStatus();
  }

  /**
   * Load chat status
   */
  private async loadChatStatus(): Promise<void> {
    try {
      if (this.chatId) {
        const status = await this.deliveryChatService.getChatStatus(this.chatId);
        this.chatStatus = status;
        console.log('✅ Chat status loaded:', status);
      }
    } catch (error) {
      console.error('❌ Failed to load chat status:', error);
      // Set a fallback status to ensure messages display correctly
      this.chatStatus = {
        chatId: this.chatId,
        offerId: 0,
        offerStatus: 'Pending',
        isSender: this.isCurrentUserSender(),
        isCourier: !this.isCurrentUserSender(),
        senderName: 'صاحب العرض',
        courierName: 'الموصل'
      };
    }
  }

  /**
   * Determine if current user is sender based on context
   */
  private isCurrentUserSender(): boolean {
    const userId = this.authService.getUserId();
    if (!userId) {
      return false;
    }
    
    // If we have offerId and courierId, we can determine the role
    // Current user is sender if they are NOT the courier
    if (this.courierId && userId !== this.courierId) {
      return true;
    }
    
    // Default to courier view if we can't determine
    return false;
  }

  /**
   * Check if current user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Get status display text
   */
  getStatusText(): string {
    if (!this.chatStatus) return 'غير محدد';
    
    switch (this.chatStatus.offerStatus) {
      case 'Pending':
        return 'قيد الانتظار';
      case 'InProgress':
        return 'قيد التنفيذ';
      case 'Completed':
        return 'مكتمل';
      case 'Cancelled':
        return 'ملغي';
      default:
        return this.chatStatus.offerStatus;
    }
  }

  /**
   * Get status CSS class
   */
  getStatusClass(): string {
    if (!this.chatStatus) return '';
    
    switch (this.chatStatus.offerStatus) {
      case 'Pending':
        return 'status-pending';
      case 'InProgress':
        return 'status-in-progress';
      case 'Completed':
        return 'status-completed';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  /**
   * Format message timestamp
   */
  formatTime(timestamp: Date | string): string {
    try {
    const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'وقت غير صحيح';
      }
      
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'وقت غير صحيح';
    }
  }

  /**
   * Check if message is from current user - FIXED VERSION
   */
  isMessageFromCurrentUser(message: ChatMessage): boolean {
    try {
      // Ensure we have valid data
      if (!message || typeof message.isSender !== 'boolean') {
        console.warn('Invalid message data:', message);
        return false;
      }

      // If chat status is not loaded yet, use fallback logic
      if (!this.chatStatus) {
        console.warn('Chat status not loaded, using fallback logic');
        // Fallback: assume current user is courier (most common case)
        return !message.isSender;
      }

      // Use chat status to determine message ownership
      if (this.chatStatus.isSender) {
      return message.isSender;
      } else if (this.chatStatus.isCourier) {
      return !message.isSender;
    }

      return false;
    } catch (error) {
      console.error('Error determining message ownership:', error);
    return false;
    }
  }

  /**
   * Add system message to chat
   */
  private addSystemMessage(text: string): void {
    try {
    const systemMessage: ChatMessage = {
      id: Date.now(),
      message: text,
      messageTime: new Date(),
      isSender: false,
      isRead: true,
      messageType: 'System',
      isDeleted: false,
      chatId: this.chatId
    };
    
      // Add to current messages array directly
      this.messages = [...this.messages, systemMessage];
      this.shouldScrollToBottom = true;
      
      // Also update the service if available
      try {
    const currentMessages = this.deliveryChatService.getCurrentMessages();
    this.deliveryChatService['messagesSubject'].next([...currentMessages, systemMessage]);
      } catch (serviceError) {
        console.warn('Could not update service messages:', serviceError);
      }
    } catch (error) {
      console.error('Error adding system message:', error);
    }
  }

  /**
   * Scroll to bottom of messages container
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  /**
   * Get connection status display
   */
  getConnectionStatus(): string {
    return this.isConnected ? 'متصل' : 'غير متصل';
  }

  /**
   * Get connection status class
   */
  getConnectionStatusClass(): string {
    return this.isConnected ? 'text-success' : 'text-danger';
  }

  /**
   * Track function for message list
   */
  trackByMessageId(index: number, message: ChatMessage): number {
    return message.id || index;
  }
}