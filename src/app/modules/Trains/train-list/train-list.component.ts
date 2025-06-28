import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TrainService } from '../../../core/services/train.service';
import { PaginatedResponse, TrainListViewModel } from '../../../core/models/train';
import { CommonModule } from '@angular/common';
@Component({
  standalone: true,
  selector: 'app-train-list',
  templateUrl: './train-list.component.html',
  imports: [CommonModule],
  styleUrls: ['./train-list.component.css']
})
export class TrainListComponent implements OnInit {
  trains: TrainListViewModel[] = [];
  pageNumber: number = 1;
  pageSize: number = 10;

  constructor(private trainService: TrainService, private router: Router, public authService: AuthService) {}

  ngOnInit(): void {
    this.loadTrains();
  }

  loadTrains(): void {
    this.trainService.getAllTrains(this.pageNumber, this.pageSize).subscribe({
      next: (response: PaginatedResponse<TrainListViewModel>) => {
        console.log('Trains loaded successfully:', response);
        
        this.trains = response.Data;
      },
      error: (error) => {
        console.error('Error loading trains:', error);
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
}