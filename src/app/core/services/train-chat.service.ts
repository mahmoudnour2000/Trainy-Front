import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrainChatService {
  private hubConnection!: signalR.HubConnection;
  private messagesSubject = new Subject<any>();
  public messages$ = this.messagesSubject.asObservable();
  private chatClosedSubject = new Subject<any>();
  public chatClosed$ = this.chatClosedSubject.asObservable();
  private statusUpdateSubject = new Subject<string>();
  public statusUpdate$ = this.statusUpdateSubject.asObservable();
  private currentTrainId?: number;
  private isChatClosed: boolean = false;

  constructor(private authService: AuthService) {}

  connect(trainId: number) {
    const token = this.authService.getToken();
    
    console.log('🔑 Token check:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
    });

    if (!token) {
      console.error('❌ No authentication token found. User must be logged in.');
      return;
    }

    if (this.currentTrainId === trainId && this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log(`✅ Already connected to TrainChatHub for train ${trainId}`);
      return;
    }
    this.currentTrainId = trainId;
    
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
    
    console.log(`🔌 Attempting to connect to TrainChatHub for train ${trainId}...`);
    console.log(`🌐 Hub URL: ${environment.hubUrl}TrainChatHub?trainId=${trainId}`);
    
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}TrainChatHub?trainId=${trainId}`, {
        accessTokenFactory: () => token
      })
      .build();
     
    this.addListeners();
    
    this.hubConnection.start()
      .then(() => {
        console.log(`✅ Successfully connected to TrainChatHub for train ${trainId}`);
        this.isChatClosed = false; // Reset chat closed status on new connection
        this.joinTrainGroup(trainId);
        setTimeout(() => {
          this.loadRecentMessages(trainId);
        }, 1000);
      })
      .catch(err => {
        console.error('❌ Connection error:', err);
        console.error('❌ Error details:', {
          error: err.message,
          statusCode: err.statusCode,
          statusText: err.statusText
        });
        setTimeout(() => {
          if (this.currentTrainId) {
            this.connect(this.currentTrainId);
          }
        }, 5000);
      });
  }

  private addListeners() {
    this.hubConnection.on('ReceiveMessage', (data: any) => {
      console.log('📨 New message in train chat:', data);
      if (!this.isChatClosed) {
        this.messagesSubject.next(data);
      }
    });
    
    this.hubConnection.on('LoadMessages', (messages: any[]) => {
      console.log(`📋 Loaded ${messages.length} messages for train ${this.currentTrainId}:`, messages);
      if (!this.isChatClosed) {
        this.messagesSubject.next({ messages });
      }
    });

    this.hubConnection.on('CloseTrainChat', (data: any) => {
      console.log('🚫 Chat closed for train:', data);
      this.isChatClosed = true;
      this.chatClosedSubject.next(data);
      this.statusUpdateSubject.next('لم يعد الشات متاحا، لقد وصل القطار إلى آخر محطة');
    });
    
    this.hubConnection.on('ReceiveStatusUpdate', (message: string) => {
      console.log('📢 Chat status update:', message);
      this.statusUpdateSubject.next(message);
      if (message.includes('غير متاح')) {
        this.isChatClosed = true;
        this.chatClosedSubject.next(null);
      }
    });
    
    this.hubConnection.onclose(async () => {
      console.log('✅ Connection closed, attempting to reconnect...');
      if (this.currentTrainId) {
        await this.connect(this.currentTrainId);
      }
    });
  }

  private joinTrainGroup(trainId: number) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('JoinTrainGroup', trainId)
        .then(() => console.log(`✅ Joined train group ${trainId}`))
        .catch(err => {
          console.error('❌ Error joining group:', err);
          this.connect(trainId);
        });
    }
  }

  public sendMessage(name: string, message: string, trainId: number) {
    console.log(`📤 Sending message for train ${trainId}:`, { name, message });
    
    if (this.isChatClosed) {
      console.warn('🚫 Chat is closed, cannot send message');
      this.statusUpdateSubject.next('لم يعد الشات متاحا، لقد وصل القطار إلى آخر محطة');
      return;
    }
    
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && name === 'ضيف') {
      name = currentUser.Name || 'مستخدم';
      console.log('👤 Using authenticated user name:', name);
    }
    
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendMessage', trainId, name, message)
        .then(() => console.log('✅ Message sent successfully'))
        .catch(err => {
          console.error('❌ Send error:', err);
          this.connect(trainId);
        });
    } else {
      console.error('❌ Connection not established, attempting to reconnect...');
      this.connect(trainId);
    }
  }

  public loadRecentMessages(trainId: number) {
    console.log(`📥 Loading messages for train ${trainId}...`);
    if (this.isChatClosed) {
      console.warn('🚫 Chat is closed, cannot load messages');
      this.statusUpdateSubject.next('لم يعد الشات متاحا، لقد وصل القطار إلى آخر محطة');
      return;
    }
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('LoadRecentMessages', trainId)
        .then(() => console.log('✅ Requested messages successfully'))
        .catch(err => {
          console.error('❌ Load messages error:', err);
          this.connect(trainId);
        });
    } else {
      console.error('❌ Connection not established, attempting to reconnect...');
      this.connect(trainId);
    }
  }
}