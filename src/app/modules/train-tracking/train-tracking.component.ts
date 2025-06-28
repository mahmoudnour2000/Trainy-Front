import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TrainTrackingService } from '../../core/services/train-tracking.service';
import { TrainTrackingViewModel } from '../../core/models/train-tracking-view-model';
import { TrainTrackingUpdateDto } from '../../core/models/train-tracking-update-dto';
import { GpsUpdateDto } from '../../core/models/gps-update-dto';
import { ManualUpdateDto } from '../../core/models/manual-update-dto';
import * as L from 'leaflet';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card'; // أضفنا MatCardModule
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-train-tracking',
  standalone: true, // تأكد إنه standalone
  imports: [
    CommonModule,
    RouterModule, // عشان routerLink
    MatCardModule, // عشان mat-card-actions
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './train-tracking.component.html',
  styleUrls: ['./train-tracking.component.css']
})
export class TrainTrackingComponent implements OnInit, AfterViewInit {
  trainId?: number;
  tracking: TrainTrackingViewModel | null = null;
  map?: L.Map;
  updateForm: FormGroup;
  gpsForm: FormGroup;
  manualForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private trainTrackingService: TrainTrackingService,
    private fb: FormBuilder
  ) {
    this.updateForm = this.fb.group({
      latitude: ['', [Validators.required, Validators.pattern(/^-?\d*\.?\d+$/)]],
      longitude: ['', [Validators.required, Validators.pattern(/^-?\d*\.?\d+$/)]],
      expectedArrival: ['', Validators.required]
    });
    this.gpsForm = this.fb.group({
      latitude: ['', [Validators.required, Validators.pattern(/^-?\d*\.?\d+$/)]],
      longitude: ['', [Validators.required, Validators.pattern(/^-?\d*\.?\d+$/)]]
    });
    this.manualForm = this.fb.group({
      status: ['', Validators.required],
      expectedArrival: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.trainId = +this.route.snapshot.paramMap.get('trainId')!;
    this.loadTracking();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  initMap(): void {
    if (document.getElementById('map')) { // تحقق إن العنصر موجود
      this.map = L.map('map').setView([24.088938, 32.8998293], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
    } else {
      console.error('Map container (#map) not found in DOM');
    }
  }

  loadTracking(): void {
    if (this.trainId) {
      this.trainTrackingService.getActiveTracking(this.trainId).subscribe({
        next: (data) => {
          this.tracking = data;
          if (data.latitude && data.longitude && this.map) {
            L.marker([data.latitude, data.longitude])
              .addTo(this.map)
              .bindPopup(`
                <b>رقم القطار:</b> ${data.trainNo}<br>
                <b>المحطة الحالية:</b> ${data.currentStationName}<br>
                <b>المحطة التالية:</b> ${data.nextStationName}<br>
                <b>المرشد:</b> ${data.guideName}<br>
                <b>الحالة:</b> ${data.status}<br>
                <b>آخر تحديث:</b> ${new Date(data.lastUpdated).toLocaleString('ar-EG')}
              `)
              .openPopup();
            this.map.setView([data.latitude, data.longitude], 10);
          }
        },
        error: (err) => console.error('Error fetching tracking:', err)
      });
    }
  }

  updateTracking(): void {
    if (this.updateForm.valid && this.trainId) {
      const dto: TrainTrackingUpdateDto = {
        trainId: this.trainId,
        latitude: +this.updateForm.get('latitude')!.value,
        longitude: +this.updateForm.get('longitude')!.value,
        expectedArrival: this.updateForm.get('expectedArrival')!.value
      };
      this.trainTrackingService.updateTracking(dto).subscribe({
        next: () => {
          alert('تم تحديث التتبع بنجاح');
          this.loadTracking();
        },
        error: (err) => console.error('Error updating tracking:', err)
      });
    }
  }

  updateGps(): void {
    if (this.gpsForm.valid && this.trainId) {
      const dto: GpsUpdateDto = {
        trainId: this.trainId,
        latitude: +this.gpsForm.get('latitude')!.value,
        longitude: +this.gpsForm.get('longitude')!.value
      };
      this.trainTrackingService.updateGps(dto).subscribe({
        next: () => {
          alert('تم تحديث GPS بنجاح');
          this.loadTracking();
        },
        error: (err) => console.error('Error updating GPS:', err)
      });
    }
  }

  updateManual(): void {
    if (this.manualForm.valid && this.trainId) {
      const dto: ManualUpdateDto = {
        trainId: this.trainId,
        status: this.manualForm.get('status')!.value,
        expectedArrival: this.manualForm.get('expectedArrival')!.value
      };
      this.trainTrackingService.updateManual(dto).subscribe({
        next: () => {
          alert('تم التحديث اليدوي بنجاح');
          this.loadTracking();
        },
        error: (err) => console.error('Error manual update:', err)
      });
    }
  }
}