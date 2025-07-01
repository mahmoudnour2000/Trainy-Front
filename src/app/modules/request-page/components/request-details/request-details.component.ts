import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestService, RequestCreateModel } from '../../../../core/services/request.service';
import { OfferService, Offer } from '../../../../core/services/offer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription, take, finalize } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-details.component.html',
  styleUrls: ['./request-details.component.css']
})
export class RequestDetailsComponent implements OnInit, OnDestroy {
  @Input() offerId!: number;
  @Output() requestCreated = new EventEmitter<any>();
  
  requestText: string = '';
  charCount: number = 0;
  selectedFromCity: string = '';
  selectedFromCityId: number | null = null;
  age: number = 18;
  maxLength: number = 250;
  
  currentOffer: Offer | null = null;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  isOfferOwner: boolean = false;
  successMessage: string | null = null;
  
  private subscription: Subscription = new Subscription();
  
  // Data for dropdown options
  cities: Array<{id: number, name: string}> = [
    {id: 1, name: 'القاهرة'},
    {id: 2, name: 'الإسكندرية'},
    {id: 3, name: 'الجيزه'},
    {id: 4, name: 'أسيوط'},
    {id: 5, name: 'سوهاج'},
    {id: 6, name: 'قنا'},
    {id: 7, name: 'الأقصر'},
    {id: 8, name: 'إسنا'},
    {id: 9, name: 'كوم امبو'},
    {id: 10, name: 'أسوان'}
  ];
  
  // Filtered cities based on search
  filteredFromCities: Array<{id: number, name: string}> = [];
  
  // Search terms
  fromCitySearch: string = '';
  
  constructor(
    private requestService: RequestService,
    private offerService: OfferService,
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.filteredFromCities = [...this.cities];
    
    console.log('RequestDetailsComponent initialized with offerId:', this.offerId);
    
    // Check if user is authenticated and is a courier
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'يجب تسجيل الدخول أولاً قبل إرسال الطلب';
      return;
    }
    
    if (!this.authService.isCourier()) {
      this.errorMessage = 'يجب أن تكون مسجل كـ موصل لإرسال طلب';
      return;
    }
    
    // If offerId is provided, load the offer details
    if (this.offerId) {
      this.loadOfferDetails(this.offerId);
    } else {
      // Subscribe to offer details from the service
      this.subscription.add(
        this.requestService.getOfferDetails()
          .pipe(take(1))
          .subscribe(offer => {
            if (offer) {
              console.log('Request details received offer:', offer);
              this.currentOffer = offer;
              this.offerId = offer.id;
              this.checkIfOfferOwner();
            }
          })
      );
    }
  }
  
  loadOfferDetails(offerId: number): void {
    this.subscription.add(
      this.offerService.getOfferById(offerId)
        .pipe(take(1))
        .subscribe({
          next: (offer) => {
            this.currentOffer = offer;
            this.checkIfOfferOwner();
          },
          error: (err) => {
            console.error('Error loading offer details:', err);
            this.errorMessage = 'حدث خطأ أثناء تحميل تفاصيل العرض';
          }
        })
    );
  }
  
  private checkIfOfferOwner(): void {
    if (!this.currentOffer) return;
    
    const currentUserId = this.authService.getUserId();
    this.isOfferOwner = currentUserId === this.currentOffer.senderId;
    
    // If user is the owner of the offer, they can't send a request to themselves
    if (this.isOfferOwner) {
      this.errorMessage = 'لا يمكنك إرسال طلب لعرض خاص بك';
    }
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onTextChange(): void {
    this.charCount = this.requestText.length;
  }
  
  getCounterClass(): string {
    if (this.charCount > 200) {
      return 'char-counter danger';
    } else if (this.charCount > 150) {
      return 'char-counter warning';
    } else {
      return 'char-counter';
    }
  }
  
  filterFromCities(): void {
    const searchTerm = this.fromCitySearch.toLowerCase();
    this.filteredFromCities = this.cities.filter(city => 
      city.name.toLowerCase().includes(searchTerm)
    );
  }
  
  selectFromCity(city: {id: number, name: string}): void {
    this.selectedFromCity = city.name;
    this.selectedFromCityId = city.id;
    this.fromCitySearch = '';
    this.filteredFromCities = [...this.cities];
  }
  
  navigateToLogin(): void {
    if (confirm('يجب تسجيل الدخول أولاً. هل تريد الانتقال إلى صفحة تسجيل الدخول؟')) {
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
    }
  }
  
  submitRequest(): void {
    if (!this.requestText) {
      this.showError('يجب إدخال نص الطلب');
      return;
    }
    
    this.isSubmitting = true;
    
    const requestData: RequestCreateModel = {
      offerId: this.offerId,
      message: this.requestText
    };
    
    this.requestService.createRequest(requestData).subscribe({
      next: (createdRequest) => {
        this.isSubmitting = false;
        this.requestCreated.emit(createdRequest);
        this.resetForm();
        this.showSuccess('تم إرسال الطلب بنجاح');
      },
      error: (error) => {
        this.isSubmitting = false;
        this.showError(error.message || 'حدث خطأ أثناء إرسال الطلب');
      }
    });
  }
  
  // Helper methods for displaying messages
  showError(message: string): void {
    this.errorMessage = message;
    // Auto-clear after some time
    setTimeout(() => {
      this.errorMessage = null;
    }, 5000);
  }
  
  showSuccess(message: string): void {
    this.successMessage = message;
    // Auto-clear after some time
    setTimeout(() => {
      this.successMessage = null;
    }, 5000);
  }
  
  resetForm(): void {
    this.requestText = '';
    this.selectedFromCity = '';
    this.selectedFromCityId = null;
    this.age = 18;
    this.charCount = 0;
    this.errorMessage = null;
  }
} 