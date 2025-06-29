import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrainService } from '../../../core/services/train.service';
import { PaginatedResponse } from '../../../core/models/train';

@Component({
  selector: 'app-search-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-section.component.html',
  styleUrls: ['./search-section.component.css']
})
export class SearchSectionComponent implements OnInit {
  @Output() search = new EventEmitter<{ trainType: string; destination: string; trainNo: string }>();

  trainTypes: string[] = ['Any'];
  stations: string[] = ['Any'];
  trainNumbers: string[] = ['Any'];
  selectedTrainType: string = 'Any';
  selectedDestination: string = 'Any'; // متغير لتتناسب مع HTML
  selectedTrainNo: string = 'Any';
  isLoadingStations: boolean = false;
  isLoadingTrainTypes: boolean = false;
  isLoadingTrainNumbers: boolean = false;

  constructor(private trainService: TrainService) {}

  ngOnInit(): void {
    this.loadTrainTypes();
    this.loadStations();
    this.loadTrainNumbers();
  }

  loadTrainTypes(): void {
    this.isLoadingTrainTypes = true;
    this.trainService.getTrainTypes().subscribe({
      next: (response: string[]) => {
        this.trainTypes = ['Any', ...response];
        this.isLoadingTrainTypes = false;
      },
      error: (error) => {
        console.error('Error loading train types:', error);
        this.trainTypes = ['Any', 'Russian', 'Talgo', 'VIP', 'AirConditioned', 'RussianAirConditioned', 'RussianDynamicVentilation', 'Tourist', 'TahyaMasir'];
        this.isLoadingTrainTypes = false;
      }
    });
  }

  loadStations(): void {
    this.isLoadingStations = true;
    this.trainService.getStations().subscribe({
      next: (response: PaginatedResponse<{ Name: string; Location: string }>) => {
        this.stations = ['Any', ...response.Data.map(station => station.Name)];
        this.isLoadingStations = false;
      },
      error: (error) => {
        console.error('Error loading stations:', error);
        this.stations = ['Any', 'Cairo', 'Alexandria', 'Aswan', 'Luxor'];
        this.isLoadingStations = false;
      }
    });
  }

  loadTrainNumbers(): void {
    this.isLoadingTrainNumbers = true;
    this.trainService.getTrainNumbers().subscribe({
      next: (response: string[]) => {
        this.trainNumbers = ['Any', ...response];
        this.isLoadingTrainNumbers = false;
      },
      error: (error) => {
        console.error('Error loading train numbers:', error);
        this.trainNumbers = ['Any', '2030', '1050', '3045', '3030'];
        this.isLoadingTrainNumbers = false;
      }
    });
  }

  selectTrainType(type: string): void {
    this.selectedTrainType = type;
  }

  selectDestination(station: string): void {
    this.selectedDestination = station;
  }

  selectTrainNo(trainNo: string): void {
    this.selectedTrainNo = trainNo;
  }

  onSearch(): void {
    this.search.emit({
      trainType: this.selectedTrainType === 'Any' ? '' : this.selectedTrainType,
      destination: this.selectedDestination === 'Any' ? '' : this.selectedDestination,
      trainNo: this.selectedTrainNo === 'Any' ? '' : this.selectedTrainNo
    });
  }
}