import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id: number;
  message: string;
  messageTime: Date;
  isSender: boolean;
  isRead: boolean;
  messageType: string;
  chatId: number;
  isDeleted: boolean;
  senderName?: string;
  courierName?: string;
}

export interface DeliveryChat {
  id: number;
  offerId: number;
  senderId: string;
  courierId: string;
  createdAt: Date;
  isDeleted: boolean;
  
  // Basic offer info
  offerDescription: string;
  offerStatus: string;
  offerPrice: number;
  
  // Basic user info
  senderName: string;
  senderImage: string;
  courierName: string;
  courierImage: string;
  
  // Message info
  messageCount: number;
  unreadMessageCount: number;
  lastMessageTime?: Date;
  lastMessageText: string;
}

// Alternative interface for backend response that might use different casing
export interface DeliveryChatResponse {
  Id: number;
  OfferId: number;
  SenderId: string;
  CourierId: string;
  CreatedAt: Date;
  IsDeleted: boolean;
  
  // Convert to DeliveryChat format
  id?: number;
  offerId?: number;
  senderId?: string;
  courierId?: string;
  createdAt?: Date;
  isDeleted?: boolean;
}

export interface ChatStatus {
  chatId: number;
  offerId: number;
  offerStatus: string;
  isSender: boolean;
  isCourier: boolean;
  senderName?: string;
  courierName?: string;
}

export interface ChatDetail {
  chatId: number;
  offerId: number;
  senderId: string;
  courierId: string;
  createdAt: Date;
  
  // Offer info
  offerDescription: string;
  offerStatus: string;
  offerPrice: number;
  
  // User info
  senderName: string;
  senderImage: string;
  courierName: string;
  courierImage: string;
  
  // Messages
  messages: ChatMessage[];
  
  // Chat status
  isSender: boolean;
  isCourier: boolean;
  canSendMessages: boolean;
  canAcceptRequest: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryChatService {
  private hubConnection: HubConnection | null = null;
  private isConnected = false;
  private readonly apiUrl = environment.apiUrl;

  // Observables for real-time updates
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private chatStatusSubject = new BehaviorSubject<ChatStatus | null>(null);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private userChatsSubject = new BehaviorSubject<DeliveryChat[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  public messages$ = this.messagesSubject.asObservable();
  public chatStatus$ = this.chatStatusSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public userChats$ = this.userChatsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Connection Management
  async startConnection(): Promise<void> {
    if (this.isConnected) return;

    const token = this.authService.getToken();
    if (!token) {
      console.error('❌ No authentication token available');
      throw new Error('No authentication token available');
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}chatHub`, {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: 1 // WebSockets
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    try {
    await this.hubConnection.start();
    this.isConnected = true;
    this.connectionStatusSubject.next(true);
    this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Failed to connect to DeliveryChat Hub:', error);
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
      throw error;
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
    }
  }

  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // Connection events
    this.hubConnection.on('Connected', (data) => {
      this.isConnected = true;
      this.connectionStatusSubject.next(true);
    });

    this.hubConnection.on('Error', (error) => {
      console.error('❌ Hub Error:', error);
    });

    // Connection state change handlers
    this.hubConnection.onreconnecting(() => {
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
    });

    this.hubConnection.onreconnected(() => {
      this.isConnected = true;
      this.connectionStatusSubject.next(true);
    });

    this.hubConnection.onclose(() => {
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
    });

    // Chat events
    this.hubConnection.on('ChatHistory', (messages: ChatMessage[]) => {
      this.messagesSubject.next(messages);
    });

    this.hubConnection.on('ChatStatus', (status: ChatStatus) => {
      this.chatStatusSubject.next(status);
    });

    this.hubConnection.on('MessageReceived', (message: ChatMessage) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
    });

    this.hubConnection.on('NewMessageNotification', (notification) => {
      // Update unread count
      this.getUnreadMessageCount();
    });

    this.hubConnection.on('MessagesRead', (data) => {
      // Update messages as read in UI
      const currentMessages = this.messagesSubject.value;
      const updatedMessages = currentMessages.map(msg => 
        msg.chatId === data.ChatId ? { ...msg, isRead: true } : msg
      );
      this.messagesSubject.next(updatedMessages);
    });

    // Request events
    this.hubConnection.on('RequestAccepted', (data) => {
      // Handle request acceptance
    });

    this.hubConnection.on('RequestRejected', (data) => {
      // Handle request rejection
    });

    this.hubConnection.on('OfferStatusChanged', (data) => {
      // Update offer status in UI
      const currentStatus = this.chatStatusSubject.value;
      if (currentStatus && currentStatus.offerId === data.OfferId) {
        this.chatStatusSubject.next({
          ...currentStatus,
          offerStatus: data.Status
        });
      }
    });

    // User events
    this.hubConnection.on('UserJoinedChat', (data) => {
    });

    this.hubConnection.on('UserLeftChat', (data) => {
    });

    // Utility events
    this.hubConnection.on('UnreadMessageCount', (data) => {
      this.unreadCountSubject.next(data.count);
    });

    this.hubConnection.on('UserChats', (chats: DeliveryChat[]) => {
      this.userChatsSubject.next(chats);
    });

    this.hubConnection.on('JoinedChat', (data) => {
    });

    this.hubConnection.on('LeftChat', (data) => {
    });
  }

  // REST API Methods
  async createChat(offerId: number, courierId: string): Promise<DeliveryChat> {
    try {
      const response = await this.http.post<ApiResponse<any>>(
      `${this.apiUrl}DeliveryChat/create/${offerId}/${courierId}`, 
      {}
    ).toPromise();
    
      if (response?.success && response.data) {
        // Handle both camelCase and PascalCase responses
        const chatData = this.normalizeChatResponse(response.data);
        
        // Validate that the response has the required id property
        if (!chatData.id || chatData.id <= 0) {
          console.error('❌ Invalid chat ID in response:', chatData.id);
          console.error('❌ Original response data:', response.data);
          throw new Error('Invalid chat ID received from server');
    }
        
        return chatData;
      }
      
      console.error('❌ API response indicates failure:', response);
    throw new Error(response?.message || 'Failed to create chat');
    } catch (error) {
      console.error('❌ Error creating chat:', error);
      console.error('❌ Error details:', error);
      throw error;
    }
  }
  
  /**
   * Normalize chat response to handle both camelCase and PascalCase
   */
  private normalizeChatResponse(data: any): DeliveryChat {
    return {
      id: data.id || data.Id || 0,
      offerId: data.offerId || data.OfferId || 0,
      senderId: data.senderId || data.SenderId || '',
      courierId: data.courierId || data.CourierId || '',
      createdAt: data.createdAt || data.CreatedAt || new Date(),
      isDeleted: data.isDeleted || data.IsDeleted || false,
      
      // Basic offer info
      offerDescription: data.offerDescription || data.OfferDescription || '',
      offerStatus: data.offerStatus || data.OfferStatus || '',
      offerPrice: data.offerPrice || data.OfferPrice || 0,
      
      // Basic user info
      senderName: data.senderName || data.SenderName || '',
      senderImage: data.senderImage || data.SenderImage || '',
      courierName: data.courierName || data.CourierName || '',
      courierImage: data.courierImage || data.CourierImage || '',
      
      // Message info
      messageCount: data.messageCount || data.MessageCount || 0,
      unreadMessageCount: data.unreadMessageCount || data.UnreadMessageCount || 0,
      lastMessageTime: data.lastMessageTime || data.LastMessageTime,
      lastMessageText: data.lastMessageText || data.LastMessageText || ''
    };
  }

  async getUserChats(): Promise<DeliveryChat[]> {
    const response = await this.http.get<ApiResponse<DeliveryChat[]>>(
      `${this.apiUrl}DeliveryChat/user-chats`
    ).toPromise();
    
    if (response?.success) {
      this.userChatsSubject.next(response.data!);
      return response.data!;
    }
    throw new Error(response?.message || 'Failed to get user chats');
  }

  /**
   * Check if a chat exists for a specific offer and courier
   */
  async checkChatExists(offerId: number, courierId: string): Promise<boolean> {
    try {
      const response = await this.http.get<ApiResponse<boolean>>(
        `${this.apiUrl}DeliveryChat/exists/${offerId}/${courierId}`
      ).toPromise();
      
      if (response?.success) {
        return response.data || false;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking chat existence:', error);
      return false;
    }
  }

  /**
   * Get existing chat ID by offerId and userId (for user to join existing chat)
   * This method will NOT create a new chat, only return existing one
   * userId can be either sender or courier - the method will find chat where user is participant
   */
  async getExistingChatId(offerId: number, userId: string): Promise<number | null> {
    try {
      const response = await this.http.get<ApiResponse<DeliveryChat>>(
        `${this.apiUrl}DeliveryChat/get-existing/${offerId}/${userId}`
      ).toPromise();
      
      if (response?.success && response.data) {
        const chat = this.normalizeChatResponse(response.data);
        return chat.id;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting existing chat ID:', error);
      return null;
    }
  }

  /**
   * Get existing chat ID by offerId and courierId
   * This method will create chat if it doesn't exist, but will return existing chat if it does
   */
  async getOrCreateChatId(offerId: number, courierId: string): Promise<number> {
    try {
      // Use createChat method which returns existing chat if it exists
      const chat = await this.createChat(offerId, courierId);
      
      if (chat && chat.id) {
        return chat.id;
      }
      
      throw new Error('Failed to get or create chat ID');
    } catch (error) {
      console.error('❌ Error getting or creating chat ID:', error);
      throw error;
    }
  }

  async getChatMessages(chatId: number): Promise<ChatMessage[]> {
    try {
    const response = await this.http.get<ApiResponse<ChatMessage[]>>(
        `${this.apiUrl}DeliveryChat/${chatId}/messages`
    ).toPromise();
    
    if (response?.success) {
        this.messagesSubject.next(response.data || []);
        return response.data || [];
    }
      
      // If no success but no error, return empty array
      this.messagesSubject.next([]);
      return [];
    } catch (error) {
      console.error('❌ Error getting chat messages:', error);
      // Return empty array on error instead of throwing
      this.messagesSubject.next([]);
      return [];
    }
  }

  async getChat(chatId: number): Promise<ChatDetail> {
    const response = await this.http.get<ApiResponse<ChatDetail>>(
      `${this.apiUrl}DeliveryChat/${chatId}`
    ).toPromise();
    
    if (response?.success) {
      return response.data!;
    }
    throw new Error(response?.message || 'Failed to get chat');
  }

  async getChatStatus(chatId: number): Promise<ChatStatus> {
    try {
    const response = await this.http.get<ApiResponse<ChatStatus>>(
        `${this.apiUrl}DeliveryChat/${chatId}/status`
    ).toPromise();
    
      if (response?.success && response.data) {
        // Update the subject with the new status
        this.chatStatusSubject.next(response.data);
        return response.data;
    }
      
    throw new Error(response?.message || 'Failed to get chat status');
    } catch (error) {
      console.error('Error getting chat status:', error);
      throw error;
    }
  }

  async markMessagesAsReadAPI(chatId: number): Promise<void> {
    const response = await this.http.post<ApiResponse>(
      `${this.apiUrl}DeliveryChat/${chatId}/mark-read`,
      {}
    ).toPromise();
    
    if (!response?.success) {
      throw new Error(response?.message || 'Failed to mark messages as read');
    }
  }

  async getUnreadMessageCount(): Promise<number> {
    const response = await this.http.get<ApiResponse<{ count: number }>>(
      `${this.apiUrl}DeliveryChat/unread-count`
    ).toPromise();
    
    if (response?.success) {
      this.unreadCountSubject.next(response.data!.count);
      return response.data!.count;
    }
    return 0;
  }

  // SignalR Hub Methods
  async joinChat(chatId: number): Promise<void> {
    if (!this.isConnected) await this.startConnection();
    
    if (!this.hubConnection || !this.isConnected) {
      console.error('❌ SignalR connection not available for joining chat');
      throw new Error('لا يوجد اتصال بالخادم');
    }
    
    try {
      await this.hubConnection.invoke('JoinChatAsync', chatId);
    } catch (error) {
      console.error('❌ Failed to join chat via SignalR:', error);
      throw error;
    }
  }

  async leaveChat(chatId: number): Promise<void> {
    await this.hubConnection?.invoke('LeaveChatAsync', chatId);
  }

  async sendMessage(chatId: number, message: string): Promise<void> {
    if (!this.hubConnection || !this.isConnected) {
      console.error('❌ SignalR connection not available');
      throw new Error('لا يوجد اتصال بالخادم');
    }
    
    try {
      await this.hubConnection.invoke('SendMessageAsync', chatId, message);
    } catch (error) {
      console.error('❌ Failed to send message via SignalR:', error);
      throw error;
    }
  }

  async markMessagesAsRead(chatId: number): Promise<void> {
    await this.hubConnection?.invoke('MarkMessagesAsReadAsync', chatId);
  }

  async acceptRequest(chatId: number): Promise<void> {
    try {
      const response = await this.http.post<ApiResponse>(`${this.apiUrl}DeliveryChat/${chatId}/accept-request`, {}).toPromise();
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  }

  async rejectRequest(chatId: number): Promise<void> {
    try {
      const response = await this.http.post<ApiResponse>(`${this.apiUrl}DeliveryChat/${chatId}/reject-request`, {}).toPromise();
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }

  async completeDelivery(chatId: number): Promise<void> {
    try {
      const response = await this.http.post<ApiResponse>(
        `${this.apiUrl}DeliveryChat/${chatId}/complete-delivery`, 
        {}
      ).toPromise();
      
      if (!response) {
        console.error('❌ No response received from server');
        throw new Error('لم يتم تلقي رد من الخادم');
      }
      
      if (!response.success) {
        const errorMsg = response.message || 'Failed to complete delivery';
        console.error('❌ Backend returned unsuccessful response:', errorMsg);
        throw new Error(errorMsg);
      }
      
    } catch (error: any) {
      console.error('❌ Error completing delivery:', error);
      
      // Log detailed error information for debugging
      if (error?.error) {
        console.error('❌ Error details:', error.error);
        console.error('❌ Error type:', typeof error.error);
        
        // Check if error.error has message or other useful properties
        if (error.error.message) {
          console.error('❌ Backend message:', error.error.message);
        }
        if (error.error.errors) {
          console.error('❌ Validation errors:', error.error.errors);
        }
      }
      
      if (error?.status) {
        console.error('❌ HTTP Status:', error.status);
        console.error('❌ Status Text:', error.statusText);
      }
      
      if (error?.url) {
        console.error('❌ Failed URL:', error.url);
      }
      
      // Check if it's a network error
      if (error?.name === 'HttpErrorResponse' && error?.status === 0) {
        console.error('❌ Network error: Cannot reach the server');
        throw new Error('خطأ في الشبكة: لا يمكن الوصول للخادم');
      }
      
      // Check for specific HTTP status codes
      if (error?.status === 400) {
        const errorMsg = error?.error?.message || error?.error || 'بيانات غير صحيحة';
        console.error('❌ Bad Request (400):', errorMsg);
        throw new Error(`خطأ في البيانات: ${errorMsg}`);
      }
      
      if (error?.status === 401) {
        console.error('❌ Unauthorized (401)');
        throw new Error('غير مصرح لك بتنفيذ هذا الإجراء');
      }
      
      if (error?.status === 403) {
        console.error('❌ Forbidden (403)');
        throw new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      }
      
      if (error?.status === 404) {
        console.error('❌ Not Found (404)');
        throw new Error('المحادثة غير موجودة');
      }
      
      if (error?.status === 500) {
        console.error('❌ Internal Server Error (500)');
        throw new Error('خطأ في الخادم. حاول مرة أخرى لاحقاً');
      }
      
      // Re-throw the original error if no specific handling
      throw error;
    }
  }

  async getUnreadMessageCountHub(): Promise<void> {
    await this.hubConnection?.invoke('GetUnreadMessageCountAsync');
  }

  async getUserChatsHub(): Promise<void> {
    await this.hubConnection?.invoke('GetUserChatsAsync');
  }

  // Utility Methods
  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  getCurrentMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  getCurrentChatStatus(): ChatStatus | null {
    return this.chatStatusSubject.value;
  }

  // Cleanup
  ngOnDestroy(): void {
    this.stopConnection();
  }
} 