import { TrainTrackingService } from '../../core/services/train-tracking.service';
import { TrainTrackingViewModel } from '../../core/models/train-tracking-view-model';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-train-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // عشان routerLink
    MatCardModule, // عشان mat-card-actions
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  templateUrl: './train-tracking-history.component.html',
  styleUrls: ['./train-tracking-history.component.css']
})
export class TrainHistoryComponent implements OnInit {
  trainId?: number;
  history: TrainTrackingViewModel[] = [];
  filterForm: FormGroup;
  displayedColumns: string[] = [
    'trainNo', 'currentStation', 'nextStation', 'guide', 'latitude', 'longitude',
    'expectedArrival', 'status', 'distance', 'speed', 'lastUpdated'
  ];

  constructor(
    private route: ActivatedRoute,
    private trainTrackingService: TrainTrackingService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.trainId = +this.route.snapshot.paramMap.get('trainId')!;
    this.loadHistory();
  }

  loadHistory(): void {
    const startDate = this.filterForm.get('startDate')?.value ? new Date(this.filterForm.get('startDate')?.value) : undefined;
    const endDate = this.filterForm.get('endDate')?.value ? new Date(this.filterForm.get('endDate')?.value) : undefined;

    if (this.trainId) {
      this.trainTrackingService.getTrackingHistory(this.trainId, startDate, endDate).subscribe({
        next: (data) => this.history = data,
        error: (err) => console.error('Error fetching history:', err)
      });
    }
  }
}