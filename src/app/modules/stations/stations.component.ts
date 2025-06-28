import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/stationService.service';
import { Station, StationResponse } from '../../core/models/station';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-stations',
  templateUrl: './stations.component.html',
  imports: [CommonModule,LeafletModule, RouterModule, FormsModule],
  styleUrls: ['./stations.component.css']
})

export class StationsComponent implements OnInit {
  stations: Station[] = [];
  private map: L.Map | undefined;
  errorMessage: string | null = null;
  currentPage: number = 1;
  pageSize: number = 6;
  searchString: string = '';
  totalItems: number = 0;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadStations();
  }

  loadStations(): void {
    this.apiService.getStations(this.currentPage, this.pageSize, this.searchString).subscribe({
      next: (response: StationResponse) => {
        console.log('Response:', response);
        this.stations = response.Data || [];
        this.totalItems = response.TotalItems || 0;
        console.log('Stations:', this.stations);
        if (this.stations.length > 0) {
          setTimeout(() => this.initMap(), 0);
        } else {
          this.errorMessage = 'لا توجد محطات';
        }
      },
      error: (err) => {
        this.errorMessage = `فشل في تحميل المحطات: ${err.message}`;
        console.error('Error:', err);
      }
    });
  }

  onPageChange(page: number): void {
    if (page > 0 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.loadStations();
    }
  }

  onSearchChange(searchText: string): void {
    this.currentPage = 1;
    this.searchString = searchText;
    this.loadStations();
  }

  initMap(): void {
    if (!this.stations || this.stations.length === 0) {
      console.error('لا توجد بيانات محطات لتهيئة الخريطة');
      return;
    }
    if (this.map) this.map.remove();
    this.map = L.map('map').setView([this.stations[0].Latitude, this.stations[0].Longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    // إضافة علامات لجميع المحطات مع التحقق من this.map
    if (this.map) {
      this.stations.forEach(station => {
        L.marker([station.Latitude, station.Longitude]).addTo(this.map!)
          .bindPopup(station.Name || 'موقع غير معروف')
          .on('click', () => this.openPopup(station));
      });
    }
  }

  openPopup(station: Station): void {
    if (this.map) {
      this.map.setView([station.Latitude, station.Longitude], 13);
      L.popup()
        .setLatLng([station.Latitude, station.Longitude])
        .setContent(station.Location || 'لا يوجد موقع')
        .openOn(this.map);
    }
  }

  goToServices(stationId: number): void {
    this.router.navigate([`/stations/services/${stationId}`]);
  }

  getPages(): number[] {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}