import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestService, RequestCreateModel } from '../../../../core/services/request.service';
import { OfferService, Offer } from '../../../../core/services/offer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
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
  selectedFromStation: string = '';
  selectedFromStationId: number | null = null;
  age: number = 18;
  maxLength: number = 250;
  
  currentOffer: Offer | null = null;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  isOfferOwner: boolean = false;
  successMessage: string | null = null;
  
  // Current user information
  currentUserName: string = '';
  currentUserImage: string = '/assets/images/default-user.svg';
  
  private subscription: Subscription = new Subscription();
  
  // Data for dropdown options - Updated to match stations from add-offer component
  stations: Array<{id: number, name: string}> = [
    { id: 1, name: 'محطة أسوان' },
    { id: 3, name: 'محطة الأقصر' },
    { id: 4, name: 'محطة قنا' },
    { id: 5, name: 'محطة سوهاج' },
    { id: 6, name: 'محطة القاهرة' }
  ];
  
  // Filtered stations based on search
  filteredFromStations: Array<{id: number, name: string}> = [];
  
  // Search terms
  fromStationSearch: string = '';
  
  constructor(
    private requestService: RequestService,
    private offerService: OfferService,
    public authService: AuthService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.filteredFromStations = [...this.stations];
    
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'يجب تسجيل الدخول أولاً قبل إرسال الطلب';
      return;
    }
    
    // Load current user information
    this.loadCurrentUserInfo();
    
    // Allow all authenticated users to send requests, not just couriers
    // The backend will handle role verification
    
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

              this.currentOffer = offer;
              this.offerId = offer.id;
              this.checkIfOfferOwner();
            }
          })
      );
    }
  }
  
  private loadCurrentUserInfo(): void {
    // Get user name from token
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserName = currentUser.Name || 'المستخدم';
    }
    
    // Load user profile image
    this.subscription.add(
      this.userService.getProfileImage().subscribe({
        next: (response) => {
          if (response.imageUrl) {
            this.currentUserImage = response.imageUrl;
          }
        },
        error: (error) => {

          // Keep default image
        }
      })
    );
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
    const offerAny = this.currentOffer as any;
    
    // Check multiple possible property names for sender ID
    const possibleSenderIds = [
      this.currentOffer.senderId,
      offerAny.userId,
      offerAny.SenderId,
      offerAny.UserId,
      offerAny.SenderID,
      offerAny.UserID
    ].filter(id => id != null);
    
    this.isOfferOwner = possibleSenderIds.some(id => currentUserId === String(id));
    
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
  
  filterFromStations(): void {
    const searchTerm = this.fromStationSearch.toLowerCase();
    this.filteredFromStations = this.stations.filter(station => 
      station.name.toLowerCase().includes(searchTerm)
    );
  }
  
  selectFromStation(station: {id: number, name: string}): void {
    this.selectedFromStation = station.name;
    this.selectedFromStationId = station.id;
    this.fromStationSearch = '';
    this.filteredFromStations = [...this.stations];
  }
  
  navigateToLogin(): void {
    if (confirm('يجب تسجيل الدخول أولاً. هل تريد الانتقال إلى صفحة تسجيل الدخول؟')) {
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
    }
  }
  
  submitRequest(): void {
    if (!this.requestText.trim()) {
      this.showError('يجب إدخال نص الطلب');
      return;
    }
    
    if (!this.selectedFromStationId) {
      this.showError('يجب اختيار محطة التحرك');
      return;
    }
    
    if (!this.offerId) {
      this.showError('معرف العرض غير موجود');
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = null;
    
    const requestData: RequestCreateModel = {
      offerId: this.offerId,
      message: this.requestText.trim(),
      fromStationId: this.selectedFromStationId,
      courierAge: this.age
    };
    
    this.requestService.createRequest(requestData).subscribe({
      next: (createdRequest) => {
        this.isSubmitting = false;
        this.requestCreated.emit(createdRequest);
        this.resetForm();
        this.showSuccess('تم إرسال الطلب بنجاح');
      },
      error: (error) => {
        console.error('Error creating request:', error);
        this.isSubmitting = false;
        let errorMessage = 'حدث خطأ أثناء إرسال الطلب';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.showError(errorMessage);
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
    this.selectedFromStation = '';
    this.selectedFromStationId = null;
    this.age = 18;
    this.charCount = 0;
    this.errorMessage = null;
  }
} 