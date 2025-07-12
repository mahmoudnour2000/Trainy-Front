import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// ✅ تم التصحيح هنا
import { TrainListViewModel, TrainStation } from '../../../core/models/train';
import { AuthService } from '../../../core/services/auth.service';
import { TrainService } from '../../../core/services/train.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-train-card',
  templateUrl: './train-card.component.html',
  styleUrls: ['./train-card.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule] // ✅ أضفنا FormsModule هنا
})
export class TrainCardComponent {
  @Input() train!: TrainListViewModel;
  @Output() loadStations = new EventEmitter<number>();
  stations: TrainStation[] = [];
  isLoadingStations: boolean = false;
  showStations: boolean = false; // ✅ متغير للتحكم في إظهار/إخفاء المحطات

  constructor(
    private trainService: TrainService, // ✅ استخدمنا TrainService الصحيح
    public authService: AuthService,
    private router: Router
  ) {}

  toggleStations(): void {
    if (!this.showStations && this.stations.length === 0) {
      // لو المحطات مش متجيبة، جيبها من الـ API
      this.isLoadingStations = true;
      this.trainService.getTrainStations(this.train.ID).subscribe({
        next: (response: any) => {
          console.log(response);
          this.stations = response.Data;
          this.isLoadingStations = false;
          this.showStations = true;
        },
        error: (error: any) => {
          console.error('Error loading stations:', error);
          this.isLoadingStations = false;
        }
      });
    } else {
      // تبديل حالة الإظهار/الإخفاء
      this.showStations = !this.showStations;
    }
  }

  getTrainTypeArabic(trainType: string): string {
    switch (trainType) {
      case 'Russian': return 'روسي';
      case 'Express': return 'سريع';
      case 'Local': return 'محلي';
      default: return trainType;
    }
  }

  getStationRows(): number[] {
    return Array(Math.ceil(this.stations.length / 3)).fill(0).map((_, i) => i);
  }

  setStations(stations: TrainStation[]) {
    this.stations = stations;
  }

  goToTrainDetails(trainId: number): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([`/traindetails/${trainId}`]);
    } else {
      alert('يجب تسجيل الدخول أولاً');
      this.router.navigate(['/auth/login']);
    }
  }

  goToTrainChat(trainId: number): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([`/train-chat/${trainId}`]);
    } else {
      alert('يجب تسجيل الدخول أولاً');
      this.router.navigate(['/auth/login']);
    }
  }
}
