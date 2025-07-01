import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TrainTrackingService } from '../../core/services/train-tracking.service';
import { TrainTracking } from '../../core/models/train-tracking.model';

@Component({
  selector: 'app-train-tracking-history',
  templateUrl: './train-tracking-history.component.html',
  styleUrls: ['./train-tracking-history.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TrainTrackingHistoryComponent implements OnInit {
  trainId: number = 0;
  history: TrainTracking[] = [];
  startDate: string = '';
  endDate: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  currentDate: string = new Date().toISOString().split('T')[0];

  constructor(
    private trainTrackingService: TrainTrackingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get trainId from route parameters
    this.trainId = +this.route.snapshot.paramMap.get('trainId')!;
    // Set default date range to last 7 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    this.startDate = start.toISOString().split('T')[0];
    this.endDate = end.toISOString().split('T')[0];
    
    this.loadHistory();
  }

  loadHistory() {
    if (!this.validateDates()) {
      return;
    }

    this.isLoading = true;
    this.trainTrackingService.getTrackingHistory(this.trainId, this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.history = data;
        this.errorMessage = '';
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'خطأ في استرجاع سجل التتبع';
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  validateDates(): boolean {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'يرجى إدخال تاريخ البداية والنهاية';
      return false;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (start > end) {
      this.errorMessage = 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية';
      return false;
    }

    if (end > new Date()) {
      this.errorMessage = 'تاريخ النهاية لا يمكن أن يكون في المستقبل';
      return false;
    }

    return true;
  }

  filterHistory() {
    this.loadHistory();
  }
}