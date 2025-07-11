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

  messages: ChatMessage[] = [];
  newMessage: string = '';
  chatStatus: ChatStatus | null = null;
  isProcessing = false;
  isConnected = false;
  actionType: 'accept' | 'reject' | 'send' | null = null;
  currentUserId: string | null = null;
  
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
      if (!this.chatId) {
        console.error('Chat ID is required');
        return;
      }

      // Start connection and join chat
      await this.deliveryChatService.startConnection();
      await this.deliveryChatService.joinChat(this.chatId);

      // Subscribe to real-time updates
      this.setupSubscriptions();

      // Load initial chat messages
      await this.loadChatMessages();

      this.isConnected = true;
      console.log('✅ Chat initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize chat:', error);
      this.isConnected = false;
    }
  }

  /**
   * Setup subscriptions for real-time updates
   */
  private setupSubscriptions(): void {
    // Subscribe to messages
    this.subscriptions.push(
      this.deliveryChatService.messages$.subscribe(messages => {
        this.messages = messages;
        this.shouldScrollToBottom = true;
      })
    );

    // Subscribe to chat status
    this.subscriptions.push(
      this.deliveryChatService.chatStatus$.subscribe(status => {
        this.chatStatus = status;
        console.log('Chat status updated:', status);
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
      await this.deliveryChatService.getChatMessages(this.chatId);
      this.shouldScrollToBottom = true;
    } catch (error) {
      console.error('Failed to load chat messages:', error);
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
   * Check if user is authenticated (for template access)
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Get status display text
   */
  getStatusText(): string {
    if (!this.chatStatus) return '';
    
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
    const date = new Date(timestamp);
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
  }

  /**
   * Check if message is from current user
   */
  isMessageFromCurrentUser(message: ChatMessage): boolean {
    if (this.chatStatus?.isSender) {
      return message.isSender;
    } else if (this.chatStatus?.isCourier) {
      return !message.isSender;
    }
    return false;
  }

  /**
   * Add system message to chat
   */
  private addSystemMessage(text: string): void {
    const systemMessage: ChatMessage = {
      id: Date.now(),
      message: text,
      messageTime: new Date(),
      isSender: false,
      isRead: true,
      messageType: 'System',
      chatId: this.chatId
    };
    
    const currentMessages = this.deliveryChatService.getCurrentMessages();
    this.deliveryChatService['messagesSubject'].next([...currentMessages, systemMessage]);
    this.shouldScrollToBottom = true;
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
    return message.id;
  }
}