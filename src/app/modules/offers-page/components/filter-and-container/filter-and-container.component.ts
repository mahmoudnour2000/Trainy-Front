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
    { id: 'documents', name: 'مستندات' },
    { id: 'electronics', name: 'إلكترونيات' },
    { id: 'clothing', name: 'ملابس' },
    { id: 'food', name: 'مواد غذائية' },
    { id: 'furniture', name: 'أثاث' },
    { id: 'other', name: 'أخرى' }
  ];

  dateFilters: { id: string, name: string }[] = [
    { id: 'newest', name: 'الأحدث أولاً' },
    { id: 'oldest', name: 'الأقدم أولاً' },
    { id: 'today', name: 'اليوم' },
    { id: 'this-week', name: 'هذا الأسبوع' },
    { id: 'this-month', name: 'هذا الشهر' }
  ];

  locations: { id: string, name: string }[] = [
    { id: '1', name: 'محطة أسوان' },
    { id: '3', name: 'محطة الأقصر' },
    { id: '4', name: 'محطة قنا' },
    { id: '5', name: 'محطة سوهاج' },
    { id: '6', name: 'محطة القاهرة' }
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
      this.isSenderVerified = status.senderStatus === 'Accepted';
    });
  }

  // New method to handle verification check button click
  checkVerification(): void {
    this.verificationService.verificationStatus$.subscribe(status => {
      // If user is already accepted, no action needed (button should be hidden)
      if (status.senderStatus === 'Accepted') {
        return;
      }
      
      // If status is NotSubmitted or Rejected, navigate to verification images
      if (status.senderStatus === 'NotSubmitted' || status.senderStatus === 'Rejected') {
        this.router.navigate(['/verification'], {
          queryParams: { 
            returnUrl: '/offers',
            roleType: 'Sender'
          }
        });
      }
      
      // If status is Pending, navigate to verification status
      if (status.senderStatus === 'Pending') {
        this.router.navigate(['/verification/status'], {
          queryParams: { 
            message: 'طلب التحقق الخاص بك قيد المراجعة من قبل فريقنا'
          }
        });
      }
    });
  }

  loadOrders(): void {

    
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
        // Support both direct and wrapped (Data) responses
        const offersArray = response.items || response.Data || [];
        this.orders = Array.isArray(offersArray) ? offersArray.map(offer => this.transformOfferToOrder(offer)) : [];
        this.hasOrders = this.orders.length > 0;
        this.applyFilters();
      });
  }

  private transformOfferToOrder(offer: any): any {
    const transformedOrder = {
      id: offer.ID,
      description: offer.Description,
      from: offer.PickupStationId,
      fromDisplay: offer.PickupStationName || 'غير محدد',
      to: offer.DropoffStationId,
      toDisplay: offer.DropoffStationName || 'غير محدد',
      category: offer.Category,
      categoryDisplay: this.getCategoryDisplayName(offer.Category),
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
    

    
    return transformedOrder;
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
      'Furniture': 'furniture',
      'Documents': 'documents',
      'Other': 'other',
      // إضافة المزيد من الحالات المحتملة
      'electronics': 'electronics',
      'clothing': 'clothing',
      'food': 'food',
      'furniture': 'furniture',
      'documents': 'documents',
      'other': 'other'
    };
    return categoryMap[category] || 'other';
  }

  private getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'Electronics': 'إلكترونيات',
      'Clothing': 'ملابس',
      'Food': 'طعام',
      'Furniture': 'أثاث',
      'Documents': 'مستندات',
      'Other': 'أخرى',
      'electronics': 'إلكترونيات',
      'clothing': 'ملابس',
      'food': 'طعام',
      'furniture': 'أثاث',
      'documents': 'مستندات',
      'other': 'أخرى'
    };
    return categoryMap[category] || category || 'غير محدد';
  }

  applyFilters(): void {

    
    this.filteredOrders = this.orders.filter(order => {
      // Search text filter
      if (this.filters.search && 
          !order.description.toLowerCase().includes(this.filters.search.toLowerCase())) {
        return false;
      }
      
      // Category filter - convert API category to frontend category ID for comparison
      if (this.filters.category) {
        const orderCategoryId = this.mapCategoryToId(order.category);
        if (orderCategoryId !== this.filters.category) {
          return false;
        }
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
      
      // From location filter - compare station IDs
      if (this.filters.fromLocation) {
        const orderFromStationId = order.from?.toString();
        if (orderFromStationId !== this.filters.fromLocation) {
          return false;
        }
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
    // Test verification API manually
    this.verificationService.getMyVerificationStatus().subscribe({
      next: (data) => {
      },
      error: (error) => {
      }
    });
  }
}
