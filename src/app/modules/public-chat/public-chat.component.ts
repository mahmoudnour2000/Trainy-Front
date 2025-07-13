import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { PublicChatService } from '../../core/services/public-chat.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-public-chat',
  templateUrl: './public-chat.component.html',
  styleUrls: ['./public-chat.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [PublicChatService]
})
export class PublicChatComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  currentUser: string = localStorage.getItem('username') || 'ضيف';
  currentUserId: string = '';
  newMessage: string = '';
  messages: any[] = [];

  constructor(private chatService: PublicChatService, private authService: AuthService) {}

  ngOnInit() {
    this.extractCurrentUserInfo();
    this.connectToPublicChat();
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


  
  // private extractCurrentUserId() {
  //   const userId = localStorage.getItem('userId');
  //   this.currentUserId = userId || '';
  // }

  private connectToPublicChat() {
    this.chatService.connect();
    
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

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.currentUser, this.newMessage);
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
}