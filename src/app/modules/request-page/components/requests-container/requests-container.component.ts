import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestService, Request, RequestStatus } from '../../../../core/services/request.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RequestCardComponent } from '../request-card/request-card.component';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-requests-container',
  templateUrl: './requests-container.component.html',
  styleUrls: ['./requests-container.component.css'],
  standalone: true,
  imports: [CommonModule, RequestCardComponent]
})
export class RequestsContainerComponent implements OnInit {
  @Input() offerId!: number;
  
  requests: Request[] = [];
  loading: boolean = true;
  error: string | null = null;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalRequests: number = 0;
  
  // Make Math available for the template
  Math = Math;
  
  constructor(
    private requestService: RequestService,
    private authService: AuthService
  ) { }
  
  ngOnInit(): void {
    if (this.offerId) {
      this.loadRequests();
    } else {
      this.error = 'No offer ID provided';
      this.loading = false;
    }
  }
  
  loadRequests(): void {
    this.loading = true;
    this.error = null;
    
    this.requestService.getRequestsForOffer(this.offerId, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.requests = response.items;
        this.totalRequests = response.totalCount;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading requests:', error);
        this.error = error.message || 'Failed to load requests';
        this.loading = false;
      }
    });
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRequests();
  }
  
  acceptRequest(requestId: number): void {
    this.requestService.acceptRequest(requestId).subscribe({
      next: () => {
        // Update the request status in the list
        const request = this.requests.find(r => r.id === requestId);
        if (request) {
          request.status = RequestStatus.Accepted;
        }
      },
      error: (error) => {
        console.error('Error accepting request:', error);
      }
    });
  }
  
  rejectRequest(requestId: number): void {
    this.requestService.rejectRequest(requestId).subscribe({
      next: () => {
        // Update the request status in the list
        const request = this.requests.find(r => r.id === requestId);
        if (request) {
          request.status = RequestStatus.Rejected;
        }
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
      }
    });
  }
} 