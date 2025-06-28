import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/stationService.service';
import { Service, ServiceResponse } from '../../core/models/stationService';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { routes } from '../../app.routes';
import { LeafletModule } from '@asymmetrik/ngx-leaflet'; // إذا كنت تستخدم Leaflet
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-station-service',
  templateUrl: './stationService.component.html',
  imports: [CommonModule, LeafletModule , RouterModule , FormsModule] ,
  styleUrls: ['./stationService.component.css']
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  private map: L.Map | undefined;
  private stationId: number;
  errorMessage: string | null = null;
  currentPage: number = 1;
  pageSize: number = 6;
  searchString: string = '';
  totalItems: number = 0;

  constructor(private apiService: ApiService, private route: ActivatedRoute) {
    this.stationId = +this.route.snapshot.paramMap.get('stationId')! || 0;
  }

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    if (!this.stationId) {
      this.errorMessage = 'معرف المحطة غير موجود';
      return;
    }

    this.apiService.getServices(this.stationId, this.currentPage, this.pageSize, this.searchString).subscribe({
      next: (response: ServiceResponse) => {
        console.log('Response:', response);
        this.services = response.Data || response.Services || response.items || response.results || response.Data || [];
        this.totalItems = response.TotalItems || 0; // استنادًا إلى الاستجابة
        console.log('Services:', this.services);
        if (this.services.length > 0) {
          setTimeout(() => this.initMap(), 0); // تأخير لضمان جاهزية الـ DOM
        } else {
          this.errorMessage = 'لا توجد خدمات لهذه المحطة';
        }
      },
      error: (err) => {
        this.errorMessage = `فشل في تحميل الخدمات: ${err.message}`;
        console.error('Error:', err);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadServices();
  }

  onSearchChange(searchText: string): void {
    this.currentPage = 1; // إعادة تعيين الصفحة إلى الأولى عند البحث
    this.searchString = searchText;
    this.loadServices();
  }

  initMap(): void {
    if (!this.services || this.services.length === 0) {
      console.error('لا توجد بيانات خدمات لتهيئة الخريطة');
      return;
    }
    if (this.map) this.map.remove();
    this.map = L.map('map').setView([this.services[0].Latitude || 0, this.services[0].Longitude || 0], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);
    L.marker([this.services[0].Latitude || 0, this.services[0].Longitude || 0]).addTo(this.map)
      .bindPopup(this.services[0].Name || 'موقع غير معروف')
      .openPopup();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  getPages(): number[] {
  const totalPages = Math.ceil(this.totalItems / this.pageSize);
  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

getTotalPages(): number {
  return Math.ceil(this.totalItems / this.pageSize);
}

}