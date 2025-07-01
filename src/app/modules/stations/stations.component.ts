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
  viewMode: 'grid' | 'list' = 'grid';
  isLoading: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    // Add global function for popup buttons
    (window as any).showStationServices = (stationId: number) => {
      this.goToServices(stationId);
    };
    
    this.loadStations();
  }

  loadStations(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.apiService.getStations(this.currentPage, this.pageSize, this.searchString).subscribe({
      next: (response: StationResponse) => {
        console.log('Response:', response);
        this.stations = response.Data || [];
        this.totalItems = response.TotalItems || 0;
        this.isLoading = false;
        console.log('Stations:', this.stations);
        if (this.stations.length > 0) {
          setTimeout(() => this.initMap(), 0);
        } else {
          this.errorMessage = 'لا توجد محطات';
        }
      },
      error: (err) => {
        this.errorMessage = `فشل في تحميل المحطات: ${err.message}`;
        this.isLoading = false;
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
    
    try {
      if (this.map) {
        console.log('🗺️ Removing existing map');
        this.map.remove();
      }
      
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('❌ Map element not found');
        return;
      }
      
      console.log('🗺️ Initializing map with stations:', this.stations.length);
      
      // Use the first station as center, or default to Egypt
      const centerLat = this.stations[0]?.Latitude || 30.033333;
      const centerLng = this.stations[0]?.Longitude || 31.233334;
      
      this.map = L.map('map').setView([centerLat, centerLng], 8);
      
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

      // Add markers for all stations
      const bounds = L.latLngBounds([]);
      let hasValidMarkers = false;
      
      this.stations.forEach((station, index) => {
        if (station.Latitude && station.Longitude && 
            !isNaN(station.Latitude) && !isNaN(station.Longitude) &&
            station.Latitude !== 0 && station.Longitude !== 0) {
          
          const latLng = L.latLng(station.Latitude, station.Longitude);
          const marker = L.marker(latLng)
            .addTo(this.map!)
            .bindPopup(`
              <div style="text-align: center; min-width: 200px;">
                <h6 style="margin: 0 0 8px 0; color: #667eea; font-size: 14px;">
                  <i class="fas fa-train"></i> ${station.Name || 'محطة غير معروفة'}
                </h6>
                <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                  <i class="fas fa-map-marker-alt"></i> ${station.Location || 'موقع غير محدد'}
                </p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #888;">
                  <i class="fas fa-id-card"></i> المعرف: ${station.ID}
                </p>
                <div style="display: flex; gap: 5px; justify-content: center;">
                  <button onclick="showStationServices(${station.ID})" 
                          style="padding: 4px 8px; font-size: 10px; background: #667eea; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    <i class="fas fa-list"></i> الخدمات
                  </button>
                </div>
              </div>
            `);
          
          bounds.extend(latLng);
          hasValidMarkers = true;
          
          console.log(`📍 Added marker for station ${index + 1}: ${station.Name}`);
        } else {
          console.warn(`⚠️ Station ${station.Name} has invalid coordinates: ${station.Latitude}, ${station.Longitude}`);
        }
      });

      if (hasValidMarkers) {
        // Fit map to show all markers with padding
        this.map.fitBounds(bounds, { padding: [20, 20] });
        console.log('✅ Map initialized with all station markers');
      } else {
        console.warn('⚠️ No valid coordinates found, setting default view');
        this.map.setView([30.033333, 31.233334], 6);
      }
      
    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  }

  openPopup(station: Station): void {
    console.log('📍 Opening popup for station:', station.Name);
    
    if (!this.map || !this.map.getContainer() || !document.body.contains(this.map.getContainer())) {
      console.error('❌ Map not initialized or not attached to DOM');
      alert('الخريطة غير جاهزة بعد. يرجى الانتظار أو إعادة تحميل الصفحة.');
      return;
    }
    
    if (station.Latitude && station.Longitude && 
        !isNaN(station.Latitude) && !isNaN(station.Longitude) &&
        station.Latitude !== 0 && station.Longitude !== 0) {
      
      const latLng = L.latLng(station.Latitude, station.Longitude);
      
      // Center map on the station
      this.map.setView(latLng, 12);
      
      // Create and open popup
      const popup = L.popup()
        .setLatLng(latLng)
        .setContent(`
          <div style="text-align: center; min-width: 250px;">
            <h6 style="margin: 0 0 10px 0; color: #667eea; font-size: 16px;">
              <i class="fas fa-train"></i> ${station.Name || 'محطة غير معروفة'}
            </h6>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
              <i class="fas fa-map-marker-alt"></i> ${station.Location || 'موقع غير محدد'}
            </p>
            <p style="margin: 0 0 15px 0; font-size: 12px; color: #888;">
              <i class="fas fa-id-card"></i> المعرف: ${station.ID}
            </p>
            <div style="display: flex; gap: 8px; justify-content: center;">
              <button onclick="showStationServices(${station.ID})" 
                      style="padding: 6px 12px; font-size: 11px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-list"></i> عرض الخدمات
              </button>
            </div>
          </div>
        `);

      popup.openOn(this.map);
      console.log('✅ Popup opened for station:', station.Name);
    } else {
      console.warn('⚠️ Station has invalid coordinates:', station);
      alert('الموقع غير متاح لهذه المحطة أو إحداثيات غير صحيحة');
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

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  trackByStationId(index: number, station: Station): number {
    return station.ID;
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage;
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}