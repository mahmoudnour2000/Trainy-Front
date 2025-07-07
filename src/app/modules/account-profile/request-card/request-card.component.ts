import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { Request } from '../../../core/models/user';

@Component({
  standalone: false,
  selector: 'app-request-card',
  templateUrl: './request-card.component.html',
  styleUrls: ['./request-card.component.css']
})
export class RequestCardComponent implements OnInit, OnChanges {
  @Input() requests: Request[] = [];
  @Input() cardsPerPage: number = 3;
  
  currentPage: number = 0;
  totalPages: number = 0;
  paginatedRequests: Request[][] = [];

  ngOnInit() {
    this.setupPagination();
  }

  ngOnChanges() {
    this.setupPagination();
  }

  setupPagination() {
    if (this.requests && this.requests.length > 0) {
      this.totalPages = Math.ceil(this.requests.length / this.cardsPerPage);
      this.paginatedRequests = [];
      
      for (let i = 0; i < this.totalPages; i++) {
        const startIndex = i * this.cardsPerPage;
        const endIndex = startIndex + this.cardsPerPage;
        this.paginatedRequests.push(this.requests.slice(startIndex, endIndex));
      }
    } else {
      this.totalPages = 0;
      this.paginatedRequests = [];
    }
    
    // Reset current page if it exceeds total pages
    if (this.currentPage >= this.totalPages) {
      this.currentPage = 0;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  goToPage(pageIndex: number) {
    if (pageIndex >= 0 && pageIndex < this.totalPages) {
      this.currentPage = pageIndex;
    }
  }

  // Helper method to get status text
  getStatusText(status: number): string {
    switch (status) {
      case 0: return 'قيد الانتظار';
      case 1: return 'تم القبول';
      case 2: return 'مرفوض';
      case 3: return 'مكتمل';
      default: return 'غير معروف';
    }
  }

  // Helper method to get status class
  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'status-Pending';
      case 1: return 'status-Accepted';
      case 2: return 'status-Rejected';
      case 3: return 'status-Completed';
      default: return '';
    }
  }
}