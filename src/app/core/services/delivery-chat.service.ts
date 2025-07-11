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
  senderName?: string;
  courierName?: string;
  chatId: number;
}

export interface DeliveryChat {
  id: number;
  offerId: number;
  senderId: string;
  courierId: string;
  createdAt: Date;
  offer?: any;
  sender?: any;
  courier?: any;
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
      throw new Error('No authentication token available');
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}chatHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    await this.hubConnection.start();
    this.isConnected = true;
    this.connectionStatusSubject.next(true);
    this.setupEventHandlers();
    console.log('✅ Connected to DeliveryChat Hub');
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
      console.log('❌ Disconnected from DeliveryChat Hub');
    }
  }

  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // Connection events
    this.hubConnection.on('Connected', (data) => {
      console.log('🔗 Connected:', data);
    });

    this.hubConnection.on('Error', (error) => {
      console.error('❌ Hub Error:', error);
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
      console.log('📨 New message notification:', notification);
      // Update unread count
      this.getUnreadMessageCount();
    });

    this.hubConnection.on('MessagesRead', (data) => {
      console.log('👁️ Messages read:', data);
      // Update messages as read in UI
      const currentMessages = this.messagesSubject.value;
      const updatedMessages = currentMessages.map(msg => 
        msg.chatId === data.ChatId ? { ...msg, isRead: true } : msg
      );
      this.messagesSubject.next(updatedMessages);
    });

    // Request events
    this.hubConnection.on('RequestAccepted', (data) => {
      console.log('✅ Request accepted:', data);
      // Handle request acceptance
    });

    this.hubConnection.on('RequestRejected', (data) => {
      console.log('❌ Request rejected:', data);
      // Handle request rejection
    });

    this.hubConnection.on('OfferStatusChanged', (data) => {
      console.log('🔄 Offer status changed:', data);
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
      console.log('👋 User joined chat:', data);
    });

    this.hubConnection.on('UserLeftChat', (data) => {
      console.log('👋 User left chat:', data);
    });

    // Utility events
    this.hubConnection.on('UnreadMessageCount', (data) => {
      this.unreadCountSubject.next(data.count);
    });

    this.hubConnection.on('UserChats', (chats: DeliveryChat[]) => {
      this.userChatsSubject.next(chats);
    });

    this.hubConnection.on('JoinedChat', (data) => {
      console.log('✅ Successfully joined chat:', data);
    });

    this.hubConnection.on('LeftChat', (data) => {
      console.log('👋 Successfully left chat:', data);
    });
  }

  // REST API Methods
  async createChat(offerId: number, courierId: string): Promise<DeliveryChat> {
    const response = await this.http.post<ApiResponse<DeliveryChat>>(
      `${this.apiUrl}DeliveryChat/create/${offerId}/${courierId}`, 
      {}
    ).toPromise();
    
    if (response?.success) {
      return response.data!;
    }
    throw new Error(response?.message || 'Failed to create chat');
  }

  async getUserChats(): Promise<DeliveryChat[]> {
    const response = await this.http.get<ApiResponse<DeliveryChat[]>>(
      `${this.apiUrl}/DeliveryChat/user-chats`
    ).toPromise();
    
    if (response?.success) {
      this.userChatsSubject.next(response.data!);
      return response.data!;
    }
    throw new Error(response?.message || 'Failed to get user chats');
  }

  async getChatMessages(chatId: number): Promise<ChatMessage[]> {
    const response = await this.http.get<ApiResponse<ChatMessage[]>>(
      `${this.apiUrl}/DeliveryChat/${chatId}/messages`
    ).toPromise();
    
    if (response?.success) {
      this.messagesSubject.next(response.data!);
      return response.data!;
    }
    throw new Error(response?.message || 'Failed to get chat messages');
  }

  async getChat(chatId: number): Promise<DeliveryChat> {
    const response = await this.http.get<ApiResponse<DeliveryChat>>(
      `${this.apiUrl}/DeliveryChat/${chatId}`
    ).toPromise();
    
    if (response?.success) {
      return response.data!;
    }
    throw new Error(response?.message || 'Failed to get chat');
  }

  async markMessagesAsReadAPI(chatId: number): Promise<void> {
    const response = await this.http.post<ApiResponse>(
      `${this.apiUrl}/DeliveryChat/${chatId}/mark-read`,
      {}
    ).toPromise();
    
    if (!response?.success) {
      throw new Error(response?.message || 'Failed to mark messages as read');
    }
  }

  async getUnreadMessageCount(): Promise<number> {
    const response = await this.http.get<ApiResponse<{ count: number }>>(
      `${this.apiUrl}/DeliveryChat/unread-count`
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
    await this.hubConnection?.invoke('JoinChatAsync', chatId);
  }

  async leaveChat(chatId: number): Promise<void> {
    await this.hubConnection?.invoke('LeaveChatAsync', chatId);
  }

  async sendMessage(chatId: number, message: string): Promise<void> {
    await this.hubConnection?.invoke('SendMessageAsync', chatId, message);
  }

  async markMessagesAsRead(chatId: number): Promise<void> {
    await this.hubConnection?.invoke('MarkMessagesAsReadAsync', chatId);
  }

  async acceptRequest(chatId: number): Promise<void> {
    await this.hubConnection?.invoke('AcceptRequestAsync', chatId);
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