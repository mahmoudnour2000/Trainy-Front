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

  stations: TrainStation[] = [];
  filteredStations: TrainStation[] = [];
  searchQuery: string = '';
  isModalOpen: boolean = false;
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

isNotificationEnabledValue: boolean | null = null; // إضافة variable جديدة

ngOnInit(): void {
  if (!this.authService.isAuthenticated()) {
    this.router.navigate(['/auth/login']);
    return;
  }
  this.loadTrainDetails();
  this.loadNotificationStatus(); // دالة جديدة
  this.loadTrainStations();
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
 loadTrainStations(searchTerm: string = ''): void {
    this.trainService.getTrainStations(this.trainId, searchTerm).subscribe({
      next: (response) => {
        this.stations = response.Data;
        console.log('Stations loaded:', this.stations);
      },
      error: (error) => {
        console.error('Error loading train stations:', error);
        this.stations = [];
      }
    });
  }

  searchStations(): void {
    this.loadTrainStations(this.searchQuery.trim());
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
  toggleNotification(): void {
  if (this.isNotificationEnabledValue === null) return;

  if (this.isNotificationEnabledValue) {
    this.notificationService.leaveTrainGroup(this.trainId);
    this.notificationService.disableNotification(this.trainId).subscribe(() => {
      console.log(`Notification disabled for train ${this.trainId}`);
      this.isNotificationEnabledValue = false; // ✅ تحديث القيمة مباشرة
    });
  } else {
    this.notificationService.joinTrainGroup(this.trainId);
    this.notificationService.enableNotification(this.trainId).subscribe(() => {
      console.log(`Notification enabled for train ${this.trainId}`);
      this.isNotificationEnabledValue = true; // ✅ تحديث القيمة مباشرة
    });
  }
}


  openChat(): void {
    console.log('Opening chat for train', this.trainId);
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
        console.log('Location access granted:', position.coords);
        this.trainService.requestGuideRole().subscribe({
          next: (response) => {
            console.log(response.message);
            // تحديث التوكين في الكوكيز و localStorage
            this.cookieService.set('auth_token', response.refreshToken, {
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              path: '/',
              secure: true,
              sameSite: 'Strict' as 'Strict' // صراحة تحديد النوع
            });
            localStorage.setItem('token', response.refreshToken);
            this.closeGuideModal();
            this.router.navigate(['/train-tracking/', this.trainId]);
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
}
