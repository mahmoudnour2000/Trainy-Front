import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Offer } from '../../../core/models/user';

@Component({
  selector: 'app-offer-card',
  standalone: false,

  templateUrl: './offer-card.component.html',
  styleUrls: ['./offer-card.component.css']
})
export class OfferCardComponent implements OnInit {
  // @Input() offer: any[] = [];
   constructor(private router: Router) {} 
@Input() offers: Offer[] = [];
  @Input() cardsPerPage: number = 3;
  currentPage: number = 0;
  totalPages: number = 0;
  paginatedOffers: any[][] = [];

  ngOnInit() {
    this.setupPagination();
  }

  ngOnChanges() {
    this.setupPagination();
  }

  setupPagination() {
    if (this.offers && this.offers.length > 0) {
      this.totalPages = Math.ceil(this.offers.length / this.cardsPerPage);
      this.paginatedOffers = [];
      
      for (let i = 0; i < this.totalPages; i++) {
        const startIndex = i * this.cardsPerPage;
        const endIndex = startIndex + this.cardsPerPage;
        this.paginatedOffers.push(this.offers.slice(startIndex, endIndex));
      }
    } else {
      this.totalPages = 0;
      this.paginatedOffers = [];
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

  goToOfferRequest(offerId: number | string): void {
  this.router.navigate(['/requests/offer', offerId]);
}
}