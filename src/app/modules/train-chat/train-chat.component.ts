import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrainChatService } from '../../core/services/train-chat.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-train-chat',
  templateUrl: './train-chat.component.html',
  styleUrls: ['./train-chat.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [TrainChatService]
})
export class TrainChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  trainId!: number;
  trainNo: string = '';
  currentUser: string = 'ضيف';
  currentUserId: string = '';
  newMessage: string = '';
  messages: any[] = [];
  chatStatus: string = ''; // To display chat status message
  private authSubscription?: Subscription;
  private chatClosedSubscription?: Subscription;
  private statusUpdateSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private chatService: TrainChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.extractCurrentUserInfo();
    
    // Subscribe to auth state changes
    this.authSubscription = this.authService.authStateChanged$.subscribe(isAuthenticated => {
      console.log('🔄 Auth state changed:', isAuthenticated);
      if (isAuthenticated) {
        this.extractCurrentUserInfo();
      } else {
        this.currentUser = 'ضيف';
        this.currentUserId = '';
      }
    });
    
    this.route.paramMap.subscribe(params => {
      this.trainId = Number(params.get('trainId'));
      this.loadTrainNo();
      this.chatService.connect(this.trainId);
    });

    // Subscribe to messages
    this.chatService.messages$.subscribe((data: any) => {
      if (data && data.messages) {
        this.messages = [...data.messages].reverse().slice(0, 10);
      } else if (data) {
        this.messages = [data, ...this.messages];
        if (this.messages.length > 10) this.messages = this.messages.slice(0, 10);
      }
      this.scrollToLatest();
    });

    // Subscribe to chat closed status
    this.chatClosedSubscription = this.chatService.chatClosed$.subscribe(() => {
      this.chatStatus = 'الشات غير متاح حاليًا لوصوله لمحطة الوصول النهائية';
      this.messages = []; // Clear messages when chat is closed
      this.scrollToLatest();
    });

    // Subscribe to status updates
    this.statusUpdateSubscription = this.chatService.statusUpdate$.subscribe((message: string) => {
      this.chatStatus = message; // Update chat status
      if (message.includes('غير متاح')) {
        this.messages = []; // Clear messages when chat is closed
        this.scrollToLatest();
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) this.authSubscription.unsubscribe();
    if (this.chatClosedSubscription) this.chatClosedSubscription.unsubscribe();
    if (this.statusUpdateSubscription) this.statusUpdateSubscription.unsubscribe();
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      alert('يجب تسجيل الدخول أولاً لإرسال الرسائل');
      return;
    }
    
    // Check if chat is closed
    if (this.chatStatus.includes('غير متاح')) {
      alert(this.chatStatus);
      return;
    }
    
    // Check if we have valid user info
    if (this.currentUser === 'ضيف' || !this.currentUserId) {
      alert('خطأ في بيانات المستخدم، يرجى إعادة تسجيل الدخول');
      return;
    }
    
    this.chatService.sendMessage(this.currentUser, this.newMessage, this.trainId);
    this.newMessage = '';
  }

  openReportModal(name: string, userId: string) {
    if (confirm(`هل أنت متأكد أنك تريد عمل شكوى ضد المستخدم ${name}?`)) {
      console.log(`تم التبليغ ضد المستخدم بـ ID: ${userId}`);
    }
  }

  scrollToLatest() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  private extractCurrentUserInfo() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUser = currentUser.Name || 'مستخدم';
      this.currentUserId = currentUser.Id || '';
    } else {
      this.currentUser = 'ضيف';
      this.currentUserId = '';
    }
  }

  private loadTrainNo() {
    // Placeholder implementation for fetching train number
    this.trainNo = `Train-${this.trainId}`;
  }
}