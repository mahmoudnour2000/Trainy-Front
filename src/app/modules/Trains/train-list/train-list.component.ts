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
  pageSize: number = 10;
  isLoading: boolean = false; // متغير محلي لتتبع حالة التحميل

  constructor(
    private trainService: TrainService,
    private router: Router,
    public authService: AuthService,
    public loaderService: LoaderService,
    private cdr: ChangeDetectorRef // لتحديث الـ UI
  ) {}

  ngOnInit(): void {
    this.loadTrains();
  }

  loadTrains(): void {
    this.isLoading = true; // إظهار الـ spinner
    this.trains = []; // إفراغ الليستة
    this.trainService.getAllTrains(this.pageNumber, this.pageSize).subscribe({
      next: (response: PaginatedResponse<TrainListViewModel>) => {
        console.log('Trains loaded successfully:', response);
        this.trains = response.Data;
        this.isLoading = false; // إخفاء الـ spinner
        this.cdr.detectChanges(); // تحديث الـ UI
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
    this.isLoading = true; // إظهار الـ spinner
    this.trains = []; // إفراغ الليستة
    const searchRequest: TrainSearchRequest = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      type: filters.trainType === 'Any' ? '' : filters.trainType,
      stationName: filters.destination === 'Any' ? '' : filters.destination,
      no: filters.trainNo || ''
    };

    this.trainService.searchTrains(searchRequest).subscribe({
      next: (response: PaginatedResponse<TrainListViewModel>) => {
        this.trains = response.Data;
        this.isLoading = false; // إخفاء الـ spinner
        this.cdr.detectChanges(); // تحديث الـ UI
      },
      error: (error) => {
        console.error('Error filtering trains:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStations(trainId: number): void {
    this.isLoading = true; // إظهار الـ spinner
    this.trainService.getTrainStations(trainId).subscribe({
      next: (response: PaginatedResponse<TrainStation>) => {
        const train = this.trains.find(t => t.ID === trainId);
        if (train) {
          const card = document.querySelector(`app-train-card[train.ID="${trainId}"]`);
          if (card) {
            (card as any).setStations(response.Data);
          }
        }
        this.isLoading = false; // إخفاء الـ spinner
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading stations:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}