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
  private authSubscription?: Subscription;

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

    this.chatService.messages$.subscribe((data: any) => {
      if (data && data.messages) {
        this.messages = [...data.messages].reverse().slice(0, 10);
      } else if (data) {
        this.messages = [data, ...this.messages];
        if (this.messages.length > 10) this.messages = this.messages.slice(0, 10);
      }
      this.scrollToLatest();
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      alert('يجب تسجيل الدخول أولاً لإرسال الرسائل');
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
    // Get current user from AuthService
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUser = currentUser.Name || 'مستخدم';
      this.currentUserId = currentUser.Id || '';
      console.log('👤 Current user info:', { name: this.currentUser, id: this.currentUserId });
    } else {
      console.warn('⚠️ No authenticated user found');
      this.currentUser = 'ضيف';
      this.currentUserId = '';
    }
  }

  private loadTrainNo() {
    // This method should load the train number based on trainId
    // For now, we'll set a default value or you can implement the actual logic
    // this.trainNo = `Train-${this.trainId}`;
    this.trainNo = this.trainNo;
  }
}
