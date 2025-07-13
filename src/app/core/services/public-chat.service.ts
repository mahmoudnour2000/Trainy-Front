import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublicChatService {
  private hubConnection!: signalR.HubConnection;
  private messagesSubject = new Subject<any>();
  public messages$ = this.messagesSubject.asObservable();

  constructor(private authService: AuthService) {}

  // Connect to the PublicChatHub
  connect() {
    const token = this.authService.getToken();

    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log('✅ م already متصل بـ PublicChatHub');

      return; // Already connected
    }
    
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
    
    console.log('🔌 محاولة الاتصال بـ PublicChatHub...');
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}PublicChatHub`, {
        accessTokenFactory: () => token || ''
      })
      .build();
      
      
    this.addListeners();
    
    this.hubConnection.start()
      .then(() => {
        console.log('✅ تم الاتصال بـ PublicChatHub بنجاح');
        // Load messages after successful connection
        setTimeout(() => {
          this.loadRecentMessages();
        }, 1000); // Wait a bit before loading messages
      })
      .catch(err => {
        console.error('❌ خطأ في الاتصال:', err);
        setTimeout(() => {
          this.connect();
        }, 5000);
      });
  }

  private addListeners() {
    this.hubConnection.on('ReceiveMessage', (data: any) => {
      console.log('📨 رسالة جديدة في الشات العام:', data);
      this.messagesSubject.next(data);
    });
    
    this.hubConnection.on('LoadMessages', (messages: any[]) => {
      console.log(`📋 تم تحميل ${messages.length} رسالة من الشات العام:`, messages);
      this.messagesSubject.next({ messages });
    });
    
    this.hubConnection.onclose(async () => {
      console.log('✅ الاتصال انقطع، محاولة إعادة الاتصال...');
      await this.connect();
    });
  }

  // Send a message to public chat (matches backend: SendMessage(string userName, string message))
  public sendMessage(name: string, message: string) {
    console.log('📤 إرسال رسالة للشات العام:', { name, message });
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendMessage', name, message).then(() => {
        console.log('✅ الرسالة ارسلت بنجاح للشات العام');
      })
        .catch(err => {
          console.error('❌ خطأ في الإرسال:', err);
          // Try to reconnect if there's an error
          this.connect();
        });
    } else {
      console.error('❌ الاتصال غير متصل، محاولة إعادة الاتصال...');
      this.connect();
    }
  }

  // Load recent messages from public chat (matches backend: LoadRecentMessages())
  public loadRecentMessages() {
    console.log('📥 تحميل الرسائل من الشات العام...');
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('LoadRecentMessages')
        .then(() => {
          console.log('✅ تم طلب تحميل الرسائل بنجاح');
        })
        .catch(err => {
          console.error('❌ خطأ في تحميل الرسايل:', err);
          // Try to reconnect if there's an error
          this.connect();
        });
    } else {
      console.error('❌ الاتصال غير متصل، محاولة إعادة الاتصال...');
      this.connect();
    }
  }

  // Disconnect from public chat
  public disconnect() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      console.log('🔌 تم قطع الاتصال من PublicChatHub');
    }
  }
}