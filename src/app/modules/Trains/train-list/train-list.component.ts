import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TrainService } from '../../../core/services/train.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PaginatedResponse, TrainListViewModel, TrainSearchRequest, TrainStation } from '../../../core/models/train';
import { CommonModule } from '@angular/common';
import { TrainCardComponent } from '../../../modules/HomePage/train-card/train-card.component';
import { HeroSectionComponent } from '../../HomePage/hero-section/hero-section.component';
import { SearchSectionComponent } from '../../../modules/HomePage/search-section/search-section.component';

@Component({
  standalone: true,
  selector: 'app-train-list',
  templateUrl: './train-list.component.html',
  imports: [CommonModule, TrainCardComponent, HeroSectionComponent, SearchSectionComponent],
  styleUrls: ['./train-list.component.css']
})
export class TrainListComponent implements OnInit {
  trains: TrainListViewModel[] = [];
  pageNumber: number = 1;
  pageSize: number = 2;
  totalItems: number = 0;
  totalPages: number = 0;
  isLoading: boolean = false;
  currentSearchFilters: { trainType: string; destination: string; trainNo: string } | null = null;
Math = Math;
  constructor(
    private trainService: TrainService,
    private router: Router,
    public authService: AuthService,
    public loaderService: LoaderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTrains();
  }

  loadTrains(): void {
    this.isLoading = true;
    this.trains = [];
    this.trainService.getAllTrains(this.pageNumber, this.pageSize).subscribe({
      next: (response: PaginatedResponse<TrainListViewModel>) => {
        console.log('Trains loaded successfully:', response);
        this.trains = response.Data;
        this.totalItems = response.TotalCount || 0;
        this.totalPages = response.TotalPages || 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading trains:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goToTrainDetails(trainId: number): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([`/traindetails/${trainId}`]);
    } else {
      alert('يجب تسجيل الدخول أولاً');
      this.router.navigate(['/auth/login']);
    }
  }

  filterTrains(filters: { trainType: string; destination: string; trainNo: string }): void {
    this.currentSearchFilters = filters;
    this.pageNumber = 1; // Reset to first page when filtering
    this.performSearch();
  }

  private performSearch(): void {
    if (!this.currentSearchFilters) {
      this.loadTrains();
      return;
    }

    this.isLoading = true;
    this.trains = [];
    const searchRequest: TrainSearchRequest = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      type: this.currentSearchFilters.trainType === 'Any' ? '' : this.currentSearchFilters.trainType,
      stationName: this.currentSearchFilters.destination === 'Any' ? '' : this.currentSearchFilters.destination,
      no: this.currentSearchFilters.trainNo || ''
    };

    this.trainService.searchTrains(searchRequest).subscribe({
      next: (response: PaginatedResponse<TrainListViewModel>) => {
        this.trains = response.Data;
        this.totalItems = response.TotalCount || 0;
        this.totalPages = response.TotalPages || 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error filtering trains:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStations(trainId: number): void {
    this.isLoading = true;
    this.trainService.getTrainStations(trainId).subscribe({
      next: (response: PaginatedResponse<TrainStation>) => {
        const train = this.trains.find(t => t.ID === trainId);
        if (train) {
          const card = document.querySelector(`app-train-card[train.ID="${trainId}"]`);
          if (card) {
            (card as any).setStations(response.Data);
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading stations:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.pageNumber) {
      this.pageNumber = page;
      if (this.currentSearchFilters) {
        this.performSearch();
      } else {
        this.loadTrains();
      }
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  goToPreviousPage(): void {
    if (this.pageNumber > 1) {
      this.goToPage(this.pageNumber - 1);
    }
  }

  goToNextPage(): void {
    if (this.pageNumber < this.totalPages) {
      this.goToPage(this.pageNumber + 1);
    }
  }

  // Helper methods for pagination display
  getPageNumbers(): number[] {
    const pageNumbers: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to max visible pages
      for (let i = 1; i <= this.totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show pages around current page
      const startPage = Math.max(1, this.pageNumber - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  }

  showFirstPageEllipsis(): boolean {
    return this.getPageNumbers()[0] > 1;
  }

  showLastPageEllipsis(): boolean {
    const pageNumbers = this.getPageNumbers();
    return pageNumbers[pageNumbers.length - 1] < this.totalPages;
  }
}