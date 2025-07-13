import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrainChatService } from '../../core/services/train-chat.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-train-chat',
  templateUrl: './train-chat.component.html',
  styleUrls: ['./train-chat.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [TrainChatService]

   
   
})
export class TrainChatComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  trainId!: number;
  trainNo: string = '';
  currentUser: string = localStorage.getItem('username') || 'ضيف';
  currentUserId: string = '';
  newMessage: string = '';
  messages: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private chatService: TrainChatService
  ) {}

  ngOnInit() {
    this.extractCurrentUserId();
    
    this.route.paramMap.subscribe(params => {
      this.trainId = Number(params.get('trainId'));
      this.loadTrainNo();
      this.chatService.connect(this.trainId);
      // Removed duplicate loadRecentMessages call - now handled in service
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


  sendMessage() {
    if (!this.newMessage.trim()) return;
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

  private extractCurrentUserId() {
    const userId = localStorage.getItem('userId');
    this.currentUserId = userId || '';
  }

  private loadTrainNo() {
    // This method should load the train number based on trainId
    // For now, we'll set a default value or you can implement the actual logic
    this.trainNo = `Train-${this.trainId}`;
  }
}
