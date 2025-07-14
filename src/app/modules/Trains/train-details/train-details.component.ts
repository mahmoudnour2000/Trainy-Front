import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { TrainService } from '../../../core/services/train.service';
import { TrainListViewModel, TrainStation, StationServicesResponse, GuideRoleResponse } from '../../../core/models/train';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';

@Component({
  standalone: true,
  selector: 'app-train-details',
  imports: [CommonModule, FormsModule],  
  providers: [CookieService],
  templateUrl: './train-details.component.html',
  styleUrls: ['./train-details.component.css']
})
export class TrainDetailsComponent implements OnInit {
  trainId!: number;
  train!: TrainListViewModel;
  isLoading: boolean = true;
  isGuide: boolean | null = null;
  stations: TrainStation[] = [];
  filteredStations: TrainStation[] = [];
  searchQuery: string = '';
  isModalOpen: boolean = false;
  isNotificationEnabledValue: boolean | null = null;
  
  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 4;
  totalItems: number = 0;
  totalPages: number = 0;
  isLoadingStations: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private trainService: TrainService,
    public notificationService: NotificationService,
    public authService: AuthService,
    private cookieService: CookieService,
    private router: Router
  ) {
    const idParam = this.route.snapshot.paramMap.get('trainId');
    if (idParam) {
      this.trainId = parseInt(idParam, 10);
      if (isNaN(this.trainId)) {
        console.error('trainId is not a valid number');
        this.router.navigate(['/error']);
      }
    } else {
      console.error('trainId not found in route');
      this.router.navigate(['/error']);
    }
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.loadTrainDetails();
    this.loadNotificationStatus();
    this.loadGuideStatus();
    this.loadTrainStations();
  }

  loadGuideStatus(): void {
    try {
      this.isGuide = this.authService.hasRole('Guide');
      console.log('Guide status loaded:', this.isGuide);
    } catch (error) {
      console.error('Error loading guide status:', error);
      this.isGuide = null;
    }
  }

  loadNotificationStatus(): void {
    this.notificationService.isNotificationEnabled(this.trainId).subscribe({
      next: (enabled) => {
        this.isNotificationEnabledValue = enabled;
        console.log('Notification status loaded:', enabled);
      },
      error: (error) => {
        console.error('Error loading notification status:', error);
        this.isNotificationEnabledValue = null;
      }
    });
  }

  loadTrainDetails(): void {
    this.trainService.getTrainById(this.trainId).subscribe({
      next: (data) => {
        this.train = data;
        this.isLoading = false;
        console.log('Train details loaded:', this.train);
      },
      error: (error) => {
        console.error('Error loading train details:', error);
        this.isLoading = false;
      }
    });
  }

  loadTrainStations(page: number = 1, searchTerm: string = ''): void {
    this.isLoadingStations = true;
    this.currentPage = page;
    
    // Update the service call to include pagination
    this.trainService.getTrainStations(this.trainId, searchTerm, page, this.pageSize).subscribe({
      next: (response) => {
        this.stations = response.Data;
        this.totalItems = response.TotalCount;
        this.totalPages = response.TotalPages;
        this.isLoadingStations = false;
        console.log('Stations loaded:', this.stations);
        console.log('Pagination info:', {
          currentPage: this.currentPage,
          totalItems: this.totalItems,
          totalPages: this.totalPages
        });
      },
      error: (error) => {
        console.error('Error loading train stations:', error);
        this.stations = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.isLoadingStations = false;
      }
    });
  }

  searchStations(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.loadTrainStations(1, this.searchQuery.trim());
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.loadTrainStations(page, this.searchQuery.trim());
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than or equal to max
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  goToStationServices(stationId: number): void {
    this.trainService.getServicesByStationId(stationId).subscribe({
      next: (response) => {
        console.log(`Services for station ${stationId} (${response.StationName}):`, response.Services);
        this.router.navigate([`stations/services/${stationId}`]);
      },
      error: (error) => {
        console.error(`Error fetching services for station ${stationId}:`, error);
      }
    });
  }

  // toggleNotification(): void {
  //   if (this.isNotificationEnabledValue === null) return;

  //   if (this.isNotificationEnabledValue) {
  //     this.notificationService.leaveTrainGroup(this.trainId);
  //     this.notificationService.disableNotification(this.trainId).subscribe(() => {
  //       console.log(`Notification disabled for train ${this.trainId}`);
  //       this.isNotificationEnabledValue = false;
  //     });
  //   } else {
  //     this.notificationService.joinTrainGroup(this.trainId);
  //     this.notificationService.enableNotification(this.trainId).subscribe(() => {
  //       console.log(`Notification enabled for train ${this.trainId}`);
  //       this.isNotificationEnabledValue = true;
  //     });
  //   }
  // }

  toggleNotification(): void {
  if (this.isNotificationEnabledValue === null) return;

  if (this.isNotificationEnabledValue) {
    this.notificationService.disableNotification(this.trainId).subscribe({
      next: () => {
        console.log(`Notification disabled for train ${this.trainId}`);
        this.isNotificationEnabledValue = false;
        this.notificationService.leaveTrainGroup(this.trainId); // حاول مغادرة المجموعة
      },
      error: (error) => {
        console.error('Error disabling notification:', error);
        alert('حدث خطأ أثناء تعطيل الإشعارات');
      }
    });
  } else {
    this.notificationService.enableNotification(this.trainId).subscribe({
      next: () => {
        console.log(`Notification enabled for train ${this.trainId}`);
        this.isNotificationEnabledValue = true;
        this.notificationService.joinTrainGroup(this.trainId); // حاول الانضمام للمجموعة
      },
      error: (error) => {
        console.error('Error enabling notification:', error);
        alert('حدث خطأ أثناء تفعيل الإشعارات');
      }
    });
  }
}

   openChat(): void {
    console.log('Opening chat for train', this.trainId);
    if (this.authService.isAuthenticated()) {
      this.router.navigate([`/train-chat/${this.trainId}`]);
    } else {
      alert('يجب تسجيل الدخول أولاً');
      this.router.navigate(['/auth/login']);
    }
  }
  goToLostAndFound(): void {
    this.router.navigate([`/traindetails/${this.trainId}/lost-and-found`]);
  }

  openGuideModal(): void {
    if (!this.authService.isAuthenticated()) {
      alert('يرجى تسجيل الدخول أولاً لتصبح قائد الرحلة');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.isModalOpen = true;
  }

  closeGuideModal(): void {
    this.isModalOpen = false;
  }

  requestGuideRole(): void {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // console.log('Location access granted:', position.coords);
        this.trainService.requestGuideRole().subscribe({
          next: (response) => {
            // console.log(response.message);
            this.cookieService.set('auth_token', response.refreshToken, {
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              path: '/',
              secure: true,
              sameSite: 'Strict' as 'Strict'
            });
            localStorage.setItem('token', response.refreshToken);
            this.isGuide = true;
            this.closeGuideModal();
            this.router.navigate(['/train-tracking', this.trainId]);
          },
          error: (error) => {
            console.error('Error requesting guide role:', error);
            alert(error.error?.message || 'حدث خطأ أثناء طلب دور قائد الرحلة');
          }
        });
      },
      (error) => {
        console.error('Location access denied:', error);
        alert('يرجى السماح بالوصول إلى الموقع لتصبح قائد الرحلة');
      }
    );
  }

  updateTrainLocation(): void {
    this.router.navigate(['/train-tracking', this.trainId]);
  }
}