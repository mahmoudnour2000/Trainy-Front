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
  private currentTrainId?: number;

  constructor(private authService: AuthService) {}

  // Connect to the TrainChatHub for a specific train
  connect(trainId: number) {
    const token = this.authService.getToken();
    
    console.log('🔑 Token check:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
    });

    // Check if user is authenticated
    if (!token) {
      console.error('❌ No authentication token found. User must be logged in.');
      return;
    }

    if (this.currentTrainId === trainId && this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log(`✅ م already متصل بـ TrainChatHub للقطار ${trainId}`);
      return; // Already connected to this train
    }
    this.currentTrainId = trainId;
    
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
    
    console.log(`🔌 محاولة الاتصال بـ TrainChatHub للقطار ${trainId}...`);
    console.log(`🌐 Hub URL: ${environment.hubUrl}TrainChatHub?trainId=${trainId}`);
    
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}TrainChatHub?trainId=${trainId}`, {
        accessTokenFactory: () => token
      })
      .build();
     
    this.addListeners();
    
    // Start connection with better error handling
    this.hubConnection.start()
      .then(() => {
        console.log(`✅ تم الاتصال بـ TrainChatHub للقطار ${trainId} بنجاح`);
        // Join the train group
        this.joinTrainGroup(trainId);
        // Load messages after successful connection
        setTimeout(() => {
          this.loadRecentMessages(trainId);
        }, 1000); // Wait a bit before loading messages
      })
      .catch(err => {
        console.error('❌ خطأ في الاتصال:', err);
        console.error('❌ Error details:', {
          error: err.message,
          statusCode: err.statusCode,
          statusText: err.statusText
        });
        // Try to reconnect after 5 seconds
        setTimeout(() => {
          if (this.currentTrainId) {
            this.connect(this.currentTrainId);
          }
        }, 5000);
      });
  }

  private addListeners() {
    // Listen for messages specific to this train
    this.hubConnection.on('ReceiveMessage', (data: any) => {
      console.log('📨 رسالة جديدة في شات القطار:', data);
      this.messagesSubject.next(data);
    });
    
    // Listen for loading messages specific to this train
    this.hubConnection.on('LoadMessages', (messages: any[]) => {
      console.log(`📋 تم تحميل ${messages.length} رسالة للقطار ${this.currentTrainId}:`, messages);
      this.messagesSubject.next({ messages });
    });
    
    this.hubConnection.onclose(async () => {
      console.log('✅ الاتصال انقطع، محاولة إعادة الاتصال...');
      if (this.currentTrainId) {
        await this.connect(this.currentTrainId);
      }
    });
  }

  // Join train group
  private joinTrainGroup(trainId: number) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('JoinTrainGroup', trainId)
        .then(() => console.log(`✅ انضممت لمجموعة القطار ${trainId}`))
        .catch(err => {
          console.error('❌ خطأ في الانضمام للمجموعة:', err);
          // Try to reconnect if there's an error
          this.connect(trainId);
        });
    }
  }

  // Send a message to a specific train (matches backend method signature)
  public sendMessage(name: string, message: string, trainId: number) {
    console.log(`📤 إرسال رسالة للقطار ${trainId}:`, { name, message });
    
    // Get current user info from AuthService
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && name === 'ضيف') {
      name = currentUser.Name || 'مستخدم';
      console.log('👤 Using authenticated user name:', name);
    }
    
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      // Match the backend method signature: SendMessage(int trainId, string userName, string message)
      this.hubConnection.invoke('SendMessage', trainId, name, message).then(() => {
        console.log('✅ الرسالة ارسلت بنجاح للقطار');
      })
        .catch(err => {
          console.error('❌ خطأ في الإرسال:', err);
          // Try to reconnect if there's an error
          this.connect(trainId);
        });
    } else {
      console.error('❌ الاتصال غير متصل، محاولة إعادة الاتصال...');
      this.connect(trainId);
    }
  }

  // Load recent messages for a specific train (matches backend method signature)
  public loadRecentMessages(trainId: number) {
    console.log(`📥 تحميل الرسائل للقطار ${trainId}...`);
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      // Match the backend method signature: LoadRecentMessages(int trainId)
      this.hubConnection.invoke('LoadRecentMessages', trainId)
        .then(() => {
          console.log('✅ تم طلب تحميل الرسائل بنجاح');
        })
        .catch(err => {
          console.error('❌ خطأ في تحميل الرسايل:', err);
          // Try to reconnect if there's an error
          this.connect(trainId);
        });
    } else {
      console.error('❌ الاتصال غير متصل، محاولة إعادة الاتصال...');
      this.connect(trainId);
    }
  }
} 