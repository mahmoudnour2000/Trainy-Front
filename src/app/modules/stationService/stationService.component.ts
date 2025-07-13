import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { Service, ServiceResponse } from '../../core/models/stationService';
import { ApiService as StationApiService } from '../../core/services/stationService.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ServiceCategory {
  name: string;
  type: number;
  services: Service[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  isLoading: boolean;
}

@Component({
  selector: 'app-station-service',
  templateUrl: './stationService.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  styleUrls: ['./stationService.component.css']
})
export class ServicesComponent implements OnInit, AfterViewInit, OnDestroy {
  services: Service[] = [];
  public map: L.Map | undefined;
  public stationId: number;
  errorMessage: string | null = null;
  isLoading: boolean = true;
  selectedService: Service | null = null;
  debugInfo: any = {
    showDebug: false,
    lastError: null
  };
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;

  // Service categories with pagination
  serviceCategories: ServiceCategory[] = [
    { name: 'المطاعم', type: 0, services: [], currentPage: 1, pageSize: 6, totalItems: 0, isLoading: false },
    { name: 'الفنادق', type: 1, services: [], currentPage: 1, pageSize: 6, totalItems: 0, isLoading: false },
    { name: 'الصيدليات', type: 3, services: [], currentPage: 1, pageSize: 6, totalItems: 0, isLoading: false },
    { name: 'الكافيهات', type: 5, services: [], currentPage: 1, pageSize: 6, totalItems: 0, isLoading: false }
  ];

  constructor(private apiService: StationApiService, private route: ActivatedRoute) {
    this.stationId = +this.route.snapshot.paramMap.get('stationId')! || 0;
    console.log('🚀 ServicesComponent initialized with stationId:', this.stationId);
    
    // Debug info
    this.debugInfo = {
      stationId: this.stationId,
      routeParams: this.route.snapshot.paramMap,
      apiService: !!this.apiService
    };
  }

  ngOnInit(): void {
    console.log('📋 ngOnInit called');
    this.loadAllServices();
  }

  ngAfterViewInit(): void {
    console.log('🎯 ngAfterViewInit called');
    
    // Initialize map immediately
    setTimeout(() => {
      this.initMap();
      
      // If services are already loaded, update the map
      if (this.services.length > 0) {
        console.log('🗺️ Services already loaded, updating map');
        this.updateMapWithAllServices();
      }
    }, 100);
  }

  loadAllServices(): void {
    console.log('🔄 Loading all services...');
    this.isLoading = true;
    this.errorMessage = null;

    // Use the getServices method with a default stationId if none provided
    const stationIdToUse = this.stationId || 1; // Default to station 1 if none provided
    
    this.apiService.getServices(stationIdToUse).subscribe({
      next: (response: ServiceResponse) => {
        console.log('📡 Raw API Response:', response);
        console.log('📡 Response type:', typeof response);
        
        // Process the response based on ServiceResponse interface
        if (response && typeof response === 'object') {
          // Check for Services property first (most likely)
          if (response.Services && Array.isArray(response.Services)) {
            this.services = response.Services;
            console.log('📋 Using response.Services array:', this.services);
          }
          // Check for items property
          else if (response.items && Array.isArray(response.items)) {
            this.services = response.items;
            console.log('📋 Using response.items array:', this.services);
          }
          // Check for Data property (PascalCase)
          else if (response.Data && Array.isArray(response.Data)) {
            this.services = response.Data;
            console.log('📋 Using response.Data array:', this.services);
          }
          // Check for results property
          else if (response.results && Array.isArray(response.results)) {
            this.services = response.results;
            console.log('📋 Using response.results array:', this.services);
          }
          // If response itself is an array
          else if (Array.isArray(response)) {
            this.services = response;
            console.log('📋 Response is an array:', this.services);
          } else {
            console.log('❌ No valid array found in response');
            this.services = [];
          }
        }
        
        console.log('📋 Final processed services:', this.services);
        console.log('🔢 Number of services:', this.services.length);
        
        // Log first service details for debugging
        if (this.services.length > 0) {
          const firstService = this.services[0];
          console.log('🔍 First service details:', {
            Id: firstService.Id,
            Name: firstService.Name,
            StationName: firstService.StationName,
            Type: firstService.Type,
            PhoneNumber: firstService.PhoneNumber,
            IsAvailable: firstService.IsAvailable,
            Latitude: firstService.Latitude,
            Longitude: firstService.Longitude,
            Location: firstService.Location
          });
          
          // Check for coordinate issues
          console.log('🔍 Coordinate analysis:', {
            hasLatitude: !!firstService.Latitude,
            hasLongitude: !!firstService.Longitude,
            latitudeType: typeof firstService.Latitude,
            longitudeType: typeof firstService.Longitude,
            latitudeValue: firstService.Latitude,
            longitudeValue: firstService.Longitude,
            isLatitudeValid: !isNaN(firstService.Latitude) && firstService.Latitude !== 0,
            isLongitudeValid: !isNaN(firstService.Longitude) && firstService.Longitude !== 0
          });
        }
        
        // Log all services coordinates for debugging
        console.log('🗺️ All services coordinates:');
        this.services.forEach((service, index) => {
          console.log(`Service ${index + 1} (${service.Name}):`, {
            Latitude: service.Latitude,
            Longitude: service.Longitude,
            isValid: !isNaN(service.Latitude) && !isNaN(service.Longitude) && 
                     service.Latitude !== 0 && service.Longitude !== 0
          });
        });
        
        this.isLoading = false;
        this.categorizeServices();
        
        // Update map if it's already initialized
        if (this.map) {
          console.log('🗺️ Map is initialized, updating with services');
          this.updateMapWithAllServices();
        } else {
          console.log('🗺️ Map not yet initialized, will update when ready');
        }
      },
      error: (err: any) => {
        console.error('❌ API Error:', err);
        this.errorMessage = `فشل في تحميل الخدمات: ${err.message}`;
        this.isLoading = false;
        
        // Debug error details
        this.debugInfo.lastError = {
          message: err.message,
          status: err.status,
          statusText: err.statusText,
          url: err.url
        };
      }
    });
  }

  categorizeServices(): void {
    console.log('📂 Categorizing services...');
    
    // Clear existing categories
    this.serviceCategories.forEach(category => {
      category.services = [];
      category.totalItems = 0;
    });

    // Categorize services
    this.services.forEach(service => {
      const category = this.serviceCategories.find(cat => cat.type === service.Type);
      if (category) {
        category.services.push(service);
        category.totalItems++;
      }
    });

    // Log categorization results
    this.serviceCategories.forEach(category => {
      console.log(`📂 ${category.name}: ${category.services.length} services`);
    });
  }

  getPaginatedServices(category: ServiceCategory): Service[] {
    const startIndex = (category.currentPage - 1) * category.pageSize;
    const endIndex = startIndex + category.pageSize;
    return category.services.slice(startIndex, endIndex);
  }

  onPageChange(category: ServiceCategory, page: number): void {
    console.log(`📄 Changing page for ${category.name} to ${page}`);
    category.currentPage = page;
  }

  getTotalPages(category: ServiceCategory): number {
    return Math.ceil(category.totalItems / category.pageSize);
  }

  getPageNumbers(category: ServiceCategory): number[] {
    const totalPages = this.getTotalPages(category);
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, category.currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  initMap(latitude?: number, longitude?: number): void {
    try {
      console.log('🗺️ Initializing map with coordinates:', { latitude, longitude });
      
      if (this.map) {
        console.log('🗺️ Removing existing map');
        this.map.remove();
      }
      
    const mapContainer = this.mapElement?.nativeElement;
    if (mapContainer) {
        console.log('🗺️ Map container found:', mapContainer);
        
        // Use default coordinates if none provided
        const defaultLat = latitude || 30.033333;
        const defaultLng = longitude || 31.233334;
        
        console.log('🗺️ Creating new map instance');
        this.map = L.map(mapContainer).setView([defaultLat, defaultLng], 10);
        
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);
        
        console.log('✅ Map initialized successfully');
        
        // If services are already loaded, update the map
        if (this.services.length > 0) {
          console.log('🗺️ Services available, updating map');
          this.updateMapWithAllServices();
        }
      } else {
        console.error('❌ Map container not found, retrying in 500ms');
        // Retry after a short delay
        setTimeout(() => {
          this.initMap(latitude, longitude);
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  }

  // Create custom icons for different service types
  private createServiceIcon(serviceType: number): L.DivIcon {
    let iconClass = '';
    let iconColor = '';

    switch (serviceType) {
      case 0: // مطاعم
        iconClass = 'fa-utensils';
        iconColor = '#e74c3c'; // أحمر
        break;
      case 1: // فنادق
        iconClass = 'fa-hotel';
        iconColor = '#27ae60'; // أخضر
        break;
      case 3: // صيدليات
        iconClass = 'fa-pills';
        iconColor = '#f39c12'; // برتقالي
        break;
      case 5: // كافيهات
        iconClass = 'fa-coffee';
        iconColor = '#8e44ad'; // بنفسجي
        break;
      default:
        iconClass = 'fa-map-marker-alt';
        iconColor = '#3498db'; // أزرق
    }

    return L.divIcon({
      html: `
        <div style="
          background-color: ${iconColor};
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <i class="fas ${iconClass}" style="color: white; font-size: 16px;"></i>
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid ${iconColor};
          "></div>
        </div>
      `,
      className: 'custom-service-marker',
      iconSize: [35, 43],
      iconAnchor: [17, 43],
      popupAnchor: [0, -43]
    });
  }

  updateMapWithAllServices(): void {
    if (!this.map) {
      console.log('🗺️ Map not initialized, skipping update');
      return;
    }

    // Clear existing markers
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map!.removeLayer(layer);
      }
    });

    // Add markers for all services with coordinates
    let hasValidCoordinates = false;
    const markers: L.Marker[] = [];
    const bounds = L.latLngBounds([]);

    console.log('🗺️ Processing services for map markers...');
    
    this.services.forEach((service, index) => {
      console.log(`📍 Processing service ${index + 1}: ${service.Name}`);
      console.log(`   Raw coordinates: Latitude=${service.Latitude}, Longitude=${service.Longitude}`);
      
      // Use the helper method to validate coordinates
      const isValid = this.isValidCoordinates(service.Latitude, service.Longitude);
      
      console.log(`   Validation result: ${isValid}`);
      
      if (isValid) {
        const lat = Number(service.Latitude);
        const lng = Number(service.Longitude);
        const latLng = L.latLng(lat, lng);
        
        console.log(`   ✅ Creating marker at: ${lat}, ${lng}`);
        
        // Create custom icon based on service type
        const customIcon = this.createServiceIcon(service.Type);

        const marker = L.marker(latLng, { icon: customIcon })
          .addTo(this.map!)
          .bindPopup(`
            <div style="text-align: center; min-width: 200px;">
              <h6 style="margin: 0 0 8px 0; color: #06236b; font-size: 14px; font-weight: bold;">${service.Name || 'خدمة غير معروفة'}</h6>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                <i class="fas fa-tag me-1"></i>${this.getServiceTypeName(service.Type)}
              </p>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #888;">
                <i class="fas fa-phone me-1"></i>${service.PhoneNumber || 'غير متاح'}
              </p>
              <div style="display: flex; gap: 5px; justify-content: center;">
                <button onclick="showServiceDetails(${service.Id})"
                        style="padding: 4px 8px; font-size: 10px; background: #06236b; color: white; border: none; border-radius: 3px; cursor: pointer;">
                  <i class="fas fa-info-circle me-1"></i>التفاصيل
                </button>
                <button onclick="showServiceLocation(${lat}, ${lng})"
                        style="padding: 4px 8px; font-size: 10px; background: #0846a0; color: white; border: none; border-radius: 3px; cursor: pointer;">
                  <i class="fas fa-map-marker-alt me-1"></i>الموقع
                </button>
              </div>
            </div>
          `);
        
        markers.push(marker);
        bounds.extend(latLng);
        hasValidCoordinates = true;
        
        console.log(`   ✅ Marker added successfully for ${service.Name}`);
      } else {
        console.log(`   ❌ Invalid coordinates for ${service.Name}: Latitude=${service.Latitude}, Longitude=${service.Longitude}`);
      }
    });

    if (hasValidCoordinates && markers.length > 0) {
      // Fit map to show all markers with padding
      this.map.fitBounds(bounds, { padding: [20, 20] });
      console.log(`✅ Map updated with ${markers.length} markers`);
    } else {
      console.log('⚠️ No valid coordinates found for any services');
      // Set default view to Egypt if no coordinates
      this.map.setView([30.033333, 31.233334], 6);
      
      // Add a simple info message overlay
      const mapContainer = this.mapElement?.nativeElement;
      if (mapContainer) {
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          font-size: 12px;
          color: #666;
          z-index: 1000;
        `;
        infoDiv.innerHTML = '<i class="fas fa-info-circle"></i> لا توجد إحداثيات متاحة للخدمات';
        mapContainer.appendChild(infoDiv);
      }
      
      console.log('✅ Map set to default Egypt view with info message');
    }
  }

  showLocation(service: Service): void {
    console.log('📍 Showing location for service:', service.Name);
    
    if (service.Latitude && service.Longitude && 
        !isNaN(service.Latitude) && !isNaN(service.Longitude) &&
        service.Latitude !== 0 && service.Longitude !== 0 && this.map) {
      
      const latLng = L.latLng(service.Latitude, service.Longitude);
      
      // Clear existing markers
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          this.map!.removeLayer(layer);
        }
      });
      
      // Add new marker with custom icon and center map
      const customIcon = this.createServiceIcon(service.Type);
      const marker = L.marker(latLng, { icon: customIcon }).addTo(this.map);
      marker.bindPopup(`
        <div style="text-align: center; min-width: 200px;">
          <h6 style="margin: 0 0 8px 0; color: #06236b; font-size: 14px; font-weight: bold;">${service.Name || 'خدمة غير معروفة'}</h6>
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
            <i class="fas fa-tag me-1"></i>${this.getServiceTypeName(service.Type)}
          </p>
          <p style="margin: 0 0 5px 0; font-size: 11px; color: #888;">
            <i class="fas fa-phone me-1"></i>${service.PhoneNumber || 'غير متاح'}
          </p>
          <p style="margin: 0; font-size: 11px; color: #888;">
            <i class="fas fa-map-marker-alt me-1"></i>${service.Latitude.toFixed(6)}, ${service.Longitude.toFixed(6)}
          </p>
        </div>
      `).openPopup();
      
      this.map.setView(latLng, 15);
      console.log('✅ Location marker added and map centered');
    } else {
      console.warn('⚠️ Service has invalid coordinates:', service);
      alert('الموقع غير متاح لهذه الخدمة أو إحداثيات غير صحيحة');
    }
  }

  openModal(service: Service): void {
    console.log('📋 Opening modal for service:', service);
    this.selectedService = service;
    
    // Check if Bootstrap is available
    if (typeof window !== 'undefined' && (window as any).bootstrap) {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('serviceModal')!);
    modal.show();
      console.log('✅ Modal opened successfully');
    } else {
      console.error('❌ Bootstrap is not available');
      // Fallback: show service details in console
      console.log('📋 Service Details:', service);
    }
  }

  ngOnDestroy(): void {
    console.log('🧹 Component destroying, cleaning up map');
    if (this.map) {
      this.map.remove();
    }
  }

  // Track by function for ngFor optimization
  trackByServiceId(index: number, service: Service): number {
    return service.Id;
  }

  // Handle image loading errors
  onImageError(event: any): void {
    console.log('❌ Image failed to load:', event.target.src);
    event.target.style.display = 'none';
  }

  // Debug method to show component state
  getDebugInfo(): any {
    return {
      ...this.debugInfo,
      servicesCount: this.services.length,
      isLoading: this.isLoading,
      hasError: !!this.errorMessage,
      hasMap: !!this.map,
      hasMapElement: !!this.mapElement,
      categories: this.serviceCategories.map(cat => ({
        name: cat.name,
        count: cat.services.length,
        currentPage: cat.currentPage,
        totalPages: this.getTotalPages(cat)
      }))
    };
  }

  // Convert service type number to readable name
  getServiceTypeName(type: number): string {
    switch (type) {
      case 0: return 'مطعم';
      case 1: return 'فندق';
      case 3: return 'صيدلية';
      case 5: return 'كافيه';
      default: return 'خدمة أخرى';
    }
  }

  isValidCoordinates(latitude: any, longitude: any): boolean {
    if (latitude === null || latitude === undefined || 
        longitude === null || longitude === undefined) {
      return false;
    }
    
    const lat = Number(latitude);
    const lng = Number(longitude);
    
    return !isNaN(lat) && !isNaN(lng) && 
           lat !== 0 && lng !== 0 &&
           lat >= -90 && lat <= 90 &&
           lng >= -180 && lng <= 180;
  }

  // Manual method to initialize and update map
  initializeMap(): void {
    console.log('🗺️ Manually initializing map');
    
    // Check if map element exists and is visible
    const mapContainer = this.mapElement?.nativeElement;
    if (mapContainer) {
      console.log('🗺️ Map container found:', {
        element: mapContainer,
        offsetWidth: mapContainer.offsetWidth,
        offsetHeight: mapContainer.offsetHeight,
        style: mapContainer.style,
        computedStyle: window.getComputedStyle(mapContainer)
      });
      
      // Ensure the container has proper dimensions
      if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
        console.warn('⚠️ Map container has zero dimensions, setting default size');
        mapContainer.style.width = '100%';
        mapContainer.style.height = '400px';
      }
    } else {
      console.error('❌ Map element not found');
    }
    
    this.initMap();
  }
}