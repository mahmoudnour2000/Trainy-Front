import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderCardsContainerComponent } from '../order-cards-container/order-cards-container.component';
import { AuthService } from '../../../../core/services/auth.service';
import { VerificationService } from '../../../../core/services/verification.service';
import { OfferService, Offer, PaginatedResponse } from '../../../../core/services/offer.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-filter-and-container',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderCardsContainerComponent],
  templateUrl: './filter-and-container.component.html',
  styleUrls: ['./filter-and-container.component.css']
})
export class FilterAndContainerComponent implements OnInit {
  @Input() hasOrders: boolean = true;

  orders: any[] = [];
  filteredOrders: any[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  
  filters: {
    category: string | null,
    date: string | null,
    fromLocation: string | null,
    search: string
  } = {
    category: null,
    date: null,
    fromLocation: null,
    search: ''
  };

  currentUserRole: string = 'Sender'; // Setting default role to Sender
  isAuthenticated: boolean = false; 
  isSenderVerified: boolean = false;

  categories: { id: string, name: string }[] = [
    { id: 'electronics', name: 'إلكترونيات' },
    { id: 'clothing', name: 'ملابس' },
    { id: 'food', name: 'طعام' },
    { id: 'furniture', name: 'أثاث' }
  ];

  dateFilters: { id: string, name: string }[] = [
    { id: 'newest', name: 'الأحدث أولاً' },
    { id: 'oldest', name: 'الأقدم أولاً' },
    { id: 'today', name: 'اليوم' },
    { id: 'this-week', name: 'هذا الأسبوع' },
    { id: 'this-month', name: 'هذا الشهر' }
  ];

  locations: { id: string, name: string }[] = [
    { id: 'cairo', name: 'القاهرة' },
    { id: 'alexandria', name: 'الإسكندرية' },
    { id: 'giza', name: 'الجيزة' },
    { id: 'sharm', name: 'شرم الشيخ' },
    { id: 'luxor', name: 'الأقصر' },
    { id: 'aswan', name: 'أسوان' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private verificationService: VerificationService,
    private offerService: OfferService
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadOrders();
    this.debugAPIs(); // Add debugging method
  }

  private loadUserInfo(): void {
    // Check authentication status
    this.authService.authStateChanged$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.checkVerificationStatus();
      }
    });
  }

  private checkVerificationStatus(): void {
    this.verificationService.verificationStatus$.subscribe(status => {
      console.log('🔍 Verification status in offers page:', status);
      this.isSenderVerified = status.senderStatus === 'Accepted';
      console.log('🔐 Is sender verified:', this.isSenderVerified);
    });
  }

  // New method to handle verification check button click
  checkVerification(): void {
    this.verificationService.verificationStatus$.subscribe(status => {
      console.log('🔍 Checking verification status for navigation:', status);
      
      // If user is already accepted, no action needed (button should be hidden)
      if (status.senderStatus === 'Accepted') {
        console.log('✅ User is already verified as sender');
        return;
      }
      
      // If status is NotSubmitted or Rejected, navigate to verification images
      if (status.senderStatus === 'NotSubmitted' || status.senderStatus === 'Rejected') {
        console.log('📝 Navigating to verification images for status:', status.senderStatus);
        this.router.navigate(['/verification'], {
          queryParams: { 
            returnUrl: '/offers',
            roleType: 'Sender'
          }
        });
      }
      
      // If status is Pending, navigate to verification status
      if (status.senderStatus === 'Pending') {
        console.log('⏳ Navigating to verification status (pending)');
        this.router.navigate(['/verification/status'], {
          queryParams: { 
            message: 'طلب التحقق الخاص بك قيد المراجعة من قبل فريقنا'
          }
        });
      }
    });
  }

  loadOrders(): void {
    console.log('🔄 Loading orders...');
    console.log('🔑 Is authenticated:', this.isAuthenticated);
    
    this.isLoading = true;
    this.error = null;

    this.offerService.getOffers(1, 50) // Get first 50 offers
      .pipe(
        catchError(error => {
          console.error('❌ Error loading offers:', error);
          console.error('API URL:', `${environment.apiUrl}Offer`);
          this.error = 'حدث خطأ أثناء تحميل العروض';
          return of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 50, totalPages: 0 });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response: any) => {
        console.log('✅ Offers API response:', response);
        // Support both direct and wrapped (Data) responses
        const offersArray = response.items || response.Data || [];
        this.orders = Array.isArray(offersArray) ? offersArray.map(offer => this.transformOfferToOrder(offer)) : [];
        console.log('🔄 Transformed orders:', this.orders);
        this.hasOrders = this.orders.length > 0;
        this.applyFilters();
      });
  }

  private transformOfferToOrder(offer: any): any {
    return {
      id: offer.ID,
      description: offer.Description,
      from: offer.PickupStationId,
      fromDisplay: offer.PickupStationName || 'غير محدد',
      to: offer.DropoffStationId,
      toDisplay: offer.DropoffStationName || 'غير محدد',
      category: offer.Category,
      categoryDisplay: offer.Category,
      weight: offer.Weight,
      price: offer.Price,
      image: offer.Picture || 'assets/0001699_bags-handbags.jpeg',
      date: offer.CreatedAt || offer.OfferTime,
      userId: offer.SenderId,
      senderId: offer.SenderId,
      senderName: offer.SenderName,
      senderImage: null,
      status: offer.OfferStatus,
      requestsCount: offer.RequestsCount || 0,
      isBreakable: offer.IsBreakable
    };
  }

  private getLocationIdFromStationName(stationName: string): string {
    // Map station names to location IDs
    const stationMap: { [key: string]: string } = {
      'القاهرة': 'cairo',
      'الإسكندرية': 'alexandria',
      'الجيزة': 'giza',
      'شرم الشيخ': 'sharm',
      'الأقصر': 'luxor',
      'أسوان': 'aswan'
    };
    return stationMap[stationName] || 'cairo';
  }

  private mapCategoryToId(category: string): string {
    // Map API categories to frontend category IDs
    const categoryMap: { [key: string]: string } = {
      'Electronics': 'electronics',
      'Clothing': 'clothing',
      'Food': 'food',
      'Furniture': 'furniture'
    };
    return categoryMap[category] || 'electronics';
  }

  private getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'Electronics': 'إلكترونيات',
      'Clothing': 'ملابس',
      'Food': 'طعام',
      'Furniture': 'أثاث'
    };
    return categoryMap[category] || 'إلكترونيات';
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(order => {
      // Search text filter
      if (this.filters.search && 
          !order.description.toLowerCase().includes(this.filters.search.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (this.filters.category && order.category !== this.filters.category) {
        return false;
      }
      
      // Date filter
      if (this.filters.date) {
        const orderDate = new Date(order.date);
        const today = new Date();
        
        if (this.filters.date === 'today') {
          if (orderDate.getDate() !== today.getDate() || 
              orderDate.getMonth() !== today.getMonth() || 
              orderDate.getFullYear() !== today.getFullYear()) {
            return false;
          }
        } else if (this.filters.date === 'this-week') {
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          if (orderDate < weekAgo) {
            return false;
          }
        } else if (this.filters.date === 'this-month') {
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          if (orderDate < monthAgo) {
            return false;
          }
        }
      }
      
      // From location filter - Note: This would need to be implemented based on station data
      // For now, we'll skip this filter as it requires station mapping
      if (this.filters.fromLocation) {
        // TODO: Implement station-based filtering when station data is available
        // return false;
      }
      
      return true;
    });
    
    // Apply sorting if needed
    if (this.filters.date === 'newest') {
      this.filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (this.filters.date === 'oldest') {
      this.filteredOrders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filters.search = target.value;
    this.applyFilters();
  }

  setCategoryFilter(categoryId: string): void {
    this.filters.category = categoryId;
    this.applyFilters();
  }

  setDateFilter(dateId: string): void {
    this.filters.date = dateId;
    this.applyFilters();
  }

  setFromLocationFilter(locationId: string): void {
    this.filters.fromLocation = locationId;
    this.applyFilters();
  }

  resetFilters(): void {
    this.filters = {
      category: null,
      date: null,
      fromLocation: null,
      search: ''
    };
    
    // Reset filter dropdowns text
    const categoryDropdown = document.getElementById('categoryDropdown');
    const dateDropdown = document.getElementById('dateDropdown');
    const fromFilterDropdown = document.getElementById('fromFilterDropdown');
    
    if (categoryDropdown) categoryDropdown.textContent = 'الفئة';
    if (dateDropdown) dateDropdown.textContent = 'التاريخ';
    if (fromFilterDropdown) fromFilterDropdown.textContent = 'من';
    
    // Reset search input
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
    
    this.applyFilters();
  }

  onDeleteOrder(orderId: number): void {
    // The delete functionality is now handled directly in the order card component
    // This method is kept for backward compatibility but the actual deletion
    // happens in the order card component with proper API calls
    console.log('Order deletion requested for ID:', orderId);
    
    // Remove the order from the local array
    this.orders = this.orders.filter(order => order.id !== orderId);
    
    // Update hasOrders flag if all orders are deleted
    this.hasOrders = this.orders.length > 0;
    
    // Re-apply filters to update the displayed orders
    this.applyFilters();
  }

  addOrder(): void {
    if (!this.isAuthenticated) {
      // If not authenticated, redirect to login
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: '/offers/add-offer' } 
      });
      return;
    }
    
    // Check comprehensive verification status
    this.verificationService.verificationStatus$.subscribe(status => {
      if (status.senderStatus === 'Pending') {
        alert('طلب التحقق الخاص بك قيد المراجعة. يرجى انتظار الموافقة قبل إضافة عروض جديدة.');
        this.router.navigate(['/verification/status']);
        return;
      }
      
      if (status.senderStatus === 'Rejected') {
        if (confirm('تم رفض طلب التحقق الخاص بك. هل تريد إعادة المحاولة؟')) {
          this.router.navigate(['/verification'], { 
            queryParams: { roleType: 'Sender', returnUrl: '/offers/add-offer' } 
          });
        }
        return;
      }
      
      if (status.senderStatus === 'Accepted') {
        // Navigate to add offer page
        this.router.navigate(['/offers/add-offer']);
      } else {
        // Not verified, redirect to verification
        alert('يجب التحقق من حسابك كمرسل قبل إضافة عروض جديدة.');
        this.router.navigate(['/verification'], { 
          queryParams: { roleType: 'Sender', returnUrl: '/offers/add-offer' } 
        });
      }
    });
  }

  getFilterById(filterId: string, filterType: 'category' | 'date' | 'location'): string {
    let filterArray: { id: string, name: string }[] = [];
    
    switch (filterType) {
      case 'category':
        filterArray = this.categories;
        break;
      case 'date':
        filterArray = this.dateFilters;
        break;
      case 'location':
        filterArray = this.locations;
        break;
    }
    
    const filter = filterArray.find(f => f.id === filterId);
    return filter ? filter.name : filterId;
  }

  canAddOrder(): boolean {
    return this.isAuthenticated && this.isSenderVerified;
  }

  private debugAPIs(): void {
    console.log('🔍 DEBUG: Testing API endpoints...');
    
    // Test authentication
    console.log('🔑 Token:', this.authService.getToken());
    console.log('🔐 Is authenticated:', this.authService.isAuthenticated());
    console.log('👤 Current user:', this.authService.getCurrentUser());
    
    // Test verification API manually
    this.verificationService.getMyVerificationStatus().subscribe({
      next: (data) => {
        console.log('✅ Verification API Response:', data);
      },
      error: (error) => {
        console.error('❌ Verification API Error:', error);
        console.error('❌ Error Status:', error.status);
        console.error('❌ Error Message:', error.message);
        console.error('❌ Error URL:', error.url);
      }
    });
  }
}
