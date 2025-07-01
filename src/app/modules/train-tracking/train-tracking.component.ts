import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TrainTrackingService } from '../../core/services/train-tracking.service';
import { TrainTracking } from '../../core/models/train-tracking.model';
import { GpsUpdateDto, ManualUpdateDto } from '../../core/models/train-tracking-dto.model';
import { latLng, tileLayer, marker, icon, popup, divIcon } from 'leaflet';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { interval, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-train-tracking',
  templateUrl: './train-tracking.component.html',
  styleUrls: ['./train-tracking.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, LeafletModule, DatePipe]
})
export class TrainTrackingComponent implements OnInit, OnDestroy {
  trainId = 0;
  trainData: TrainTracking | null = null;
  manualLat = 0;
  manualLng = 0;
  manualArrival = '';
  errorMessage = '';
  isLoading = false;
  isGuide = true; // TODO: Replace with real role check from auth service
  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      })
    ],
    zoom: 12,
    center: latLng([30.0444, 31.2357]) // Cairo coordinates
  };
  layers: any[] = [];
  private trackingSubscription: Subscription | null = null;

  constructor(
    private trainTrackingService: TrainTrackingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const trainIdParam = this.route.snapshot.paramMap.get('trainId');
    if (!trainIdParam) return;
    this.trainId = +trainIdParam;
    this.loadTrackingData();
    this.startTracking();
  }

  ngOnDestroy() {
    this.trackingSubscription?.unsubscribe();
  }

  private startTracking() {
    this.trackingSubscription = interval(30000).subscribe(() => this.loadTrackingData());
  }

  loadTrackingData() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.trainTrackingService.getActiveTracking(this.trainId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: data => {
          this.trainData = data;
          this.updateMap();
          this.errorMessage = '';
        },
        error: () => this.errorMessage = 'خطأ في استرجاع بيانات التتبع'
      });
  }

  updateMap() {
    if (!this.trainData) return;

    const trainLat = this.trainData.Latitude || 30.0444;
    const trainLng = this.trainData.Longitude || 31.2357;

    // Create custom train icon
    const trainIcon = divIcon({
      className: 'custom-train-icon',
      html: `
        <div style="
          background: #007bff;
          color: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          🚂
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Create train marker with popup
    const trainMarker = marker([trainLat, trainLng], { icon: trainIcon })
      .bindPopup(`
        <div style="text-align: center; min-width: 200px;">
          <h4 style="margin: 0 0 10px 0; color: #007bff;">🚂 القطار ${this.trainData.TrainNo}</h4>
          <p style="margin: 5px 0;"><strong>المحطة الحالية:</strong> ${this.trainData.CurrentStationName}</p>
          <p style="margin: 5px 0;"><strong>المحطة التالية:</strong> ${this.trainData.NextStationName}</p>
          <p style="margin: 5px 0;"><strong>السرعة:</strong> ${this.trainData.Speed} كم/س</p>
          <p style="margin: 5px 0;"><strong>المسافة المتبقية:</strong> ${this.trainData.DistanceToNextStation} كم</p>
          <p style="margin: 5px 0;"><strong>الحالة:</strong> ${this.trainData.Status}</p>
        </div>
      `);

    // Update map center and layers
    this.options = {
      ...this.options,
      center: latLng([trainLat, trainLng])
    };

    this.layers = [trainMarker];
  }

  updateGps() {
    if (!navigator.geolocation) {
      this.errorMessage = 'GPS غير مدعوم في هذا المتصفح';
      return;
    }
    if (this.isLoading) return;
    
    this.isLoading = true;
    navigator.geolocation.getCurrentPosition(
      position => {
        const dto: GpsUpdateDto = {
          TrainId: this.trainId,
          Latitude: position.coords.latitude,
          Longitude: position.coords.longitude,
          ExpectedArrival: new Date().toISOString(),
          Speed: position.coords.speed || 0
        };
        this.trainTrackingService.updateGps(dto)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: () => {
              this.loadTrackingData();
              this.errorMessage = 'تم تحديث GPS بنجاح';
            },
            error: () => this.errorMessage = 'خطأ في تحديث GPS'
          });
      },
      () => {
        this.isLoading = false;
        this.errorMessage = 'خطأ في الوصول إلى GPS';
      }
    );
  }

  updateManual() {
    if (!this.validateInput()) return;
    if (this.isLoading) return;
    
    this.isLoading = true;
    const dto: ManualUpdateDto = {
      TrainId: this.trainId,
      Latitude: this.manualLat,
      Longitude: this.manualLng,
      ExpectedArrival: new Date(this.manualArrival).toISOString()
    };
    
    this.trainTrackingService.updateManual(dto)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadTrackingData();
          this.errorMessage = 'تم التحديث اليدوي بنجاح';
          this.resetForm();
        },
        error: () => this.errorMessage = 'خطأ في التحديث اليدوي'
      });
  }

  private validateInput(): boolean {
    if (!this.manualLat || !this.manualLng || !this.manualArrival) {
      this.errorMessage = 'يرجى إدخال جميع الحقول';
      return false;
    }
    return true;
  }

  private resetForm() {
    this.manualLat = 0;
    this.manualLng = 0;
    this.manualArrival = '';
  }
} 