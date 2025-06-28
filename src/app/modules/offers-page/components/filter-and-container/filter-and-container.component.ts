import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderCardsContainerComponent } from '../order-cards-container/order-cards-container.component';

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
  isAuthenticated: boolean = true; // Setting default authentication to true

  // These will be replaced with API data
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
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Removing authentication check temporarily
    this.isAuthenticated = true;
    this.currentUserRole = 'Sender'; // Default to Sender role
    this.loadOrders();
    
    // Update hasOrders based on the orders array length
    this.hasOrders = this.orders.length > 0;
  }

  private loadUserInfo(): void {
    // This is a placeholder - replaced with default values
    this.currentUserRole = 'Sender';
  }

  loadOrders(): void {
    // First check if there are orders in localStorage
    const ordersJson = localStorage.getItem('orders');
    
    if (ordersJson) {
      try {
        // Parse the stored orders
        this.orders = JSON.parse(ordersJson);
      } catch (error) {
        console.error('Error parsing orders from localStorage:', error);
        this.orders = [];
      }
    } else {
      // If no orders found in localStorage, initialize with empty array
      this.orders = [];
      
      // Optionally create a sample order for first-time users
      // Comment this out if you don't want a default order
      /*
      this.orders = [
        {
          id: 1,
          title: 'شحن حقيبة يد',
          description: 'حقيبة يد جلدية فاخرة تحتاج للشحن بعناية خاصة، التغليف متوفر.',
          from: 'cairo',
          fromDisplay: 'القاهرة',
          to: 'aswan',
          toDisplay: 'أسوان',
          category: 'clothing',
          categoryDisplay: 'ملابس',
          weight: 2.5,
          price: 50,
          image: 'assets/0001699_bags-handbags.jpeg',
          date: new Date(2023, 4, 15),
          userId: 'user123'
        }
      ];
      // Save the initial orders to localStorage
      localStorage.setItem('orders', JSON.stringify(this.orders));
      */
    }
    
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(order => {
      // Search text filter
      if (this.filters.search && 
          !order.title.toLowerCase().includes(this.filters.search.toLowerCase()) && 
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
        } else if (this.filters.date === 'newest') {
          // Sorting will be handled separately
        } else if (this.filters.date === 'oldest') {
          // Sorting will be handled separately
        }
      }
      
      // From location filter
      if (this.filters.fromLocation && order.from !== this.filters.fromLocation) {
        return false;
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
    // Filter out the deleted order
    this.orders = this.orders.filter(order => order.id !== orderId);
    
    // Update localStorage
    localStorage.setItem('orders', JSON.stringify(this.orders));
    
    // Update hasOrders flag if all orders are deleted
    this.hasOrders = this.orders.length > 0;
    
    // Re-apply filters to update the displayed orders
    this.applyFilters();
  }

  addOrder(): void {
    console.log('addOrder method called');
    
    // Use direct navigation instead of router
    window.location.href = '/offers/add-offer';
  }

  // Helpers for template
  getFilterById(filterId: string, filterType: 'category' | 'date' | 'location'): string {
    if (filterType === 'category') {
      return this.categories.find(c => c.id === filterId)?.name || '';
    } else if (filterType === 'date') {
      return this.dateFilters.find(d => d.id === filterId)?.name || '';
    } else {
      return this.locations.find(l => l.id === filterId)?.name || '';
    }
  }

  canAddOrder(): boolean {
    // Temporarily always return true to enable the button
    return true;
  }
}
