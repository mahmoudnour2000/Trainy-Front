import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
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

export class StationsComponent implements OnInit, AfterViewInit, OnDestroy {
  stations: Station[] = [];
  public map: L.Map | undefined;
  errorMessage: string | null = null;
  currentPage: number = 1;
  pageSize: number = 6;
  searchString: string = '';
  totalItems: number = 0;
  viewMode: 'grid' | 'list' = 'grid';
  isLoading: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    console.log('🔄 Component initialized');

    // Add global function for popup buttons
    (window as any).showStationServices = (stationId: number) => {
      this.goToServices(stationId);
    };

    this.loadStations();
  }

  ngAfterViewInit(): void {
    console.log('🔄 View initialized');
    // إعادة تهيئة الخريطة إذا كانت البيانات محملة بالفعل
    if (this.stations && this.stations.length > 0 && !this.map) {
      setTimeout(() => {
        console.log('🗺️ Re-initializing map after view init');
        this.initMap();
      }, 1000);
    }
  }

  loadStations(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.getStations(this.currentPage, this.pageSize, this.searchString).subscribe({
      next: (response: StationResponse) => {
        console.log('🔄 API Response:', response);
        this.stations = response.Data || [];
        this.totalItems = response.TotalItems || 0;
        this.isLoading = false;

        console.log('📊 Loaded stations:', this.stations.length);
        console.log('📍 Station coordinates check:');

        // إضافة إحداثيات تجريبية للمحطات التي لا تحتوي على إحداثيات
        this.stations = this.stations.map((station, index) => {
          console.log(`Station ${index + 1}: ${station.Name} - Lat: ${station.Latitude}, Lng: ${station.Longitude}`);

          // إذا لم تكن هناك إحداثيات صحيحة، أضف إحداثيات تجريبية
          if (!station.Latitude || !station.Longitude ||
              isNaN(station.Latitude) || isNaN(station.Longitude) ||
              station.Latitude === 0 || station.Longitude === 0) {

            // إحداثيات تجريبية لمحطات مختلفة في مصر
            const sampleCoordinates = [
              { lat: 30.0626, lng: 31.2497 }, // القاهرة
              { lat: 31.2001, lng: 29.9187 }, // الإسكندرية
              { lat: 25.6872, lng: 32.6396 }, // الأقصر
              { lat: 24.0889, lng: 32.8998 }, // أسوان
              { lat: 30.5965, lng: 32.2715 }, // الزقازيق
              { lat: 31.0409, lng: 31.3785 }, // طنطا
              { lat: 30.8481, lng: 30.8481 }, // دمنهور
              { lat: 29.3084, lng: 30.8428 }  // بني سويف
            ];

            const coords = sampleCoordinates[index % sampleCoordinates.length];
            station.Latitude = coords.lat + (Math.random() - 0.5) * 0.1; // إضافة تنويع صغير
            station.Longitude = coords.lng + (Math.random() - 0.5) * 0.1;

            console.log(`🔧 Added sample coordinates for ${station.Name}: ${station.Latitude}, ${station.Longitude}`);
          }

          return station;
        });

        if (this.stations.length > 0) {
          // تأخير أطول لضمان تحميل DOM
          setTimeout(() => {
            console.log('🗺️ Attempting to initialize map...');
            this.initMap();
          }, 500);
        } else {
          this.errorMessage = 'لا توجد محطات';
        }
      },
      error: (err) => {
        this.errorMessage = `فشل في تحميل المحطات: ${err.message}`;
        this.isLoading = false;
        console.error('❌ API Error:', err);
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
    console.log('🗺️ initMap called');

    if (!this.stations || this.stations.length === 0) {
      console.error('❌ No stations data for map initialization');
      return;
    }

    try {
      // إزالة الخريطة الموجودة إن وجدت
      if (this.map) {
        console.log('🗺️ Removing existing map');
        this.map.remove();
        this.map = undefined;
      }

      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('❌ Map element not found in DOM');
        setTimeout(() => this.initMap(), 1000); // إعادة المحاولة بعد ثانية
        return;
      }

      console.log('🗺️ Map element found, initializing...');
      console.log('📊 Stations to display:', this.stations.length);

      // تنظيف محتوى العنصر
      mapElement.innerHTML = '';

      // البحث عن أول محطة بإحداثيات صحيحة
      let centerLat = 30.033333; // القاهرة كافتراضي
      let centerLng = 31.233334;

      const validStation = this.stations.find(station =>
        station.Latitude && station.Longitude &&
        !isNaN(station.Latitude) && !isNaN(station.Longitude) &&
        station.Latitude !== 0 && station.Longitude !== 0
      );

      if (validStation) {
        centerLat = validStation.Latitude;
        centerLng = validStation.Longitude;
        console.log(`📍 Using station "${validStation.Name}" as center: ${centerLat}, ${centerLng}`);
      } else {
        console.warn('⚠️ No valid coordinates found, using default center');
      }

      // إنشاء الخريطة
      this.map = L.map('map', {
        center: [centerLat, centerLng],
        zoom: 8,
        zoomControl: true,
        attributionControl: true
      });

      // إضافة طبقة الخريطة
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);

      console.log('✅ Base map initialized successfully');

      // إضافة العلامات للمحطات
      const bounds = L.latLngBounds([]);
      let hasValidMarkers = false;
      let validStationsCount = 0;

      console.log('📍 Adding markers for stations...');

      this.stations.forEach((station, index) => {
        console.log(`Checking station ${index + 1}: ${station.Name}`);
        console.log(`Coordinates: Lat=${station.Latitude}, Lng=${station.Longitude}`);

        if (station.Latitude && station.Longitude &&
            !isNaN(station.Latitude) && !isNaN(station.Longitude) &&
            station.Latitude !== 0 && station.Longitude !== 0) {

          try {
            const latLng = L.latLng(station.Latitude, station.Longitude);

            // إنشاء أيقونة دبوس موحدة
            const customIcon = L.divIcon({
              html: '<i class="fas fa-map-marker-alt" style="color: #06236b; font-size: 24px;"></i>',
              iconSize: [35, 35],
              className: 'custom-station-pin'
            });

            const marker = L.marker(latLng, { icon: customIcon })
              .addTo(this.map!)
              .bindPopup(`
                <div style="text-align: center; min-width: 220px; font-family: Arial;">
                  <h6 style="margin: 0 0 10px 0; color: #06236b; font-size: 16px; font-weight: bold;">
                    <i class="fas fa-train"></i> ${station.Name || 'محطة غير معروفة'}
                  </h6>
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
                    <i class="fas fa-map-marker-alt"></i> ${station.Location || 'موقع غير محدد'}
                  </p>
                  <p style="margin: 0 0 12px 0; font-size: 12px; color: #888;">
                    <i class="fas fa-id-card"></i> المعرف: ${station.ID}
                  </p>
                  <div style="display: flex; gap: 8px; justify-content: center;">
                    <button onclick="showStationServices(${station.ID})"
                            style="padding: 6px 12px; font-size: 12px; background: #0846a0; color: white; border: none; border-radius: 5px; cursor: pointer; transition: background 0.3s;">
                      <i class="fas fa-list"></i> عرض الخدمات
                    </button>
                  </div>
                </div>
              `);

            bounds.extend(latLng);
            hasValidMarkers = true;
            validStationsCount++;

            console.log(`✅ Added marker ${validStationsCount} for: ${station.Name} at [${station.Latitude}, ${station.Longitude}]`);
          } catch (markerError) {
            console.error(`❌ Error creating marker for ${station.Name}:`, markerError);
          }
        } else {
          console.warn(`⚠️ Station "${station.Name}" has invalid coordinates: Lat=${station.Latitude}, Lng=${station.Longitude}`);
        }
      });

      console.log(`📊 Summary: ${validStationsCount} valid markers out of ${this.stations.length} stations`);

      if (hasValidMarkers && validStationsCount > 0) {
        // ضبط الخريطة لإظهار جميع العلامات
        try {
          this.map.fitBounds(bounds, {
            padding: [30, 30],
            maxZoom: 12
          });
          console.log('✅ Map fitted to show all markers');
        } catch (boundsError) {
          console.error('❌ Error fitting bounds:', boundsError);
          this.map.setView([centerLat, centerLng], 8);
        }
      } else {
        console.warn('⚠️ No valid markers found, using default view');
        this.map.setView([30.033333, 31.233334], 6);
      }

      console.log('✅ Map initialization completed successfully');
      
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
            <h6 style="margin: 0 0 10px 0; color: #06236b; font-size: 16px;">
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
                      style="padding: 6px 12px; font-size: 11px; background: #06236b; color: white; border: none; border-radius: 4px; cursor: pointer;">
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