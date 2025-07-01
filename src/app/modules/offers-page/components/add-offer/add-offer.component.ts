import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-add-offer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-offer.component.html',
  styleUrls: ['./add-offer.component.css']
})
export class AddOfferComponent implements OnInit {
  @ViewChild('photoInput') photoInput!: ElementRef;
  @ViewChild('photoPreview') photoPreview!: ElementRef;
  @ViewChild('uploadPlaceholder') uploadPlaceholder!: ElementRef;
  @ViewChild('removePhotoBtn') removePhotoBtn!: ElementRef;
  @ViewChild('photoUploadProgress') photoUploadProgress!: ElementRef;
  @ViewChild('photoUploadProgressBar') photoUploadProgressBar!: ElementRef;
  
  offerForm!: FormGroup;
  uploadedPhoto: string | null = null;
  editMode: boolean = false;
  orderId: number | null = null;
  pageTitle = 'إضافة طلب جديد';
  imagePreview: string | null = null;
  
  // These will be replaced with API data
  categories: { id: string, name: string }[] = [
    { id: 'documents', name: 'مستندات' },
    { id: 'electronics', name: 'إلكترونيات' },
    { id: 'clothing', name: 'ملابس' },
    { id: 'food', name: 'مواد غذائية' },
    { id: 'furniture', name: 'أثاث' },
    { id: 'other', name: 'أخرى' }
  ];
  
  locations: { id: string, name: string }[] = [
    { id: 'cairo', name: 'القاهرة' },
    { id: 'alexandria', name: 'الإسكندرية' },
    { id: 'giza', name: 'الجيزة' },
    { id: 'sharm', name: 'شرم الشيخ' },
    { id: 'luxor', name: 'الأقصر' },
    { id: 'aswan', name: 'أسوان' }
  ];

  // Price matrix for calculating suggested prices
  priceMatrix: { [key: string]: { [key: string]: number } } = {
    'cairo': {
      'alexandria': 50,
      'giza': 25,
      'sharm': 120,
      'luxor': 100,
      'aswan': 150,
      'cairo': 20
    },
    'alexandria': {
      'cairo': 50,
      'giza': 60,
      'sharm': 160,
      'luxor': 140,
      'aswan': 180,
      'alexandria': 20
    },
    'giza': {
      'cairo': 25,
      'alexandria': 60,
      'sharm': 130,
      'luxor': 110,
      'aswan': 160,
      'giza': 20
    },
    'sharm': {
      'cairo': 120,
      'alexandria': 160,
      'giza': 130,
      'luxor': 200,
      'aswan': 250,
      'sharm': 20
    },
    'luxor': {
      'cairo': 100,
      'alexandria': 140,
      'giza': 110,
      'sharm': 200,
      'aswan': 80,
      'luxor': 20
    },
    'aswan': {
      'cairo': 150,
      'alexandria': 180,
      'giza': 160,
      'sharm': 250,
      'luxor': 80,
      'aswan': 20
    }
  };

  suggestedPrice: number = 0;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
    // this.checkAuthorization(); // Temporarily disable authorization check
  }

  private checkAuthorization(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Check if user has Sender role
    // This is a placeholder - replace with actual implementation
    const token = this.authService.getToken();
    if (token) {
      // Decode token or get user info from service
      if (!this.authService.isSender()) {
        // Navigate to verification page
        this.router.navigate(['/verification']);
      }
    }
  }

  private initForm(): void {
    this.offerForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
      category: ['', Validators.required],
      from: ['', Validators.required],
      to: ['', Validators.required],
      weight: [null, [Validators.required, Validators.min(0.1)]],
      price: [null, [Validators.required, Validators.min(1)]],
      isBreakable: [false],
      image: [null]
    });

    // Listen for weight changes to update suggested price
    this.offerForm.get('weight')?.valueChanges.subscribe(() => {
      this.updateSuggestedPrice();
    });

    // Listen for location changes to update suggested price
    this.offerForm.get('from')?.valueChanges.subscribe(() => {
      this.updateSuggestedPrice();
    });

    this.offerForm.get('to')?.valueChanges.subscribe(() => {
      this.updateSuggestedPrice();
    });
  }

  private checkEditMode(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.editMode = true;
        this.orderId = +id;
        this.pageTitle = 'تعديل الطلب';
        this.loadOrderData(this.orderId);
      }
    });
  }

  private loadOrderData(orderId: number): void {
    // This would be replaced with an API call
    // For now, we'll try to get the order from localStorage
    const ordersJson = localStorage.getItem('orders');
    if (ordersJson) {
      const orders = JSON.parse(ordersJson);
      const order = orders.find((o: any) => o.id === orderId);
      
      if (order) {
        this.offerForm.patchValue({
          title: order.title,
          description: order.description,
          category: order.category,
          from: order.from,
          to: order.to,
          weight: order.weight,
          price: order.price,
          isBreakable: order.isBreakable || false
        });
        
        if (order.image && order.image !== 'https://via.placeholder.com/150?text=طلب+جديد') {
          this.uploadedPhoto = order.image;
        }
      }
    }
  }

  onSubmit(): void {
    if (this.offerForm.invalid) {
      this.markFormGroupTouched(this.offerForm);
      return;
    }
    
    const formData = this.offerForm.value;
    
    // Create new order object
    const order = {
      id: this.editMode ? this.orderId : Date.now(),
      title: formData.title,
      description: formData.description,
      from: formData.from,
      fromDisplay: this.getLocationName(formData.from),
      to: formData.to,
      toDisplay: this.getLocationName(formData.to),
      category: formData.category,
      categoryDisplay: this.getCategoryName(formData.category),
      weight: formData.weight,
      price: formData.price,
      isBreakable: formData.isBreakable,
      image: this.uploadedPhoto || 'assets/defaultOrder.jpg',
      date: this.editMode ? new Date() : new Date(),
      userId: 'user123' // Placeholder user ID
    };
    
    // Save order to localStorage
    this.saveOrder(order);
    
    // Navigate back to offers page
    this.router.navigate(['/offers']);
  }

  private saveOrder(order: any): void {
    const ordersJson = localStorage.getItem('orders');
    let orders = [];
    
    if (ordersJson) {
      try {
        orders = JSON.parse(ordersJson);
      } catch (error) {
        console.error('Error parsing orders from localStorage:', error);
        orders = [];
      }
    }
    
    if (this.editMode) {
      // Update existing order
      const index = orders.findIndex((o: any) => o.id === order.id);
      if (index !== -1) {
        orders[index] = order;
      }
    } else {
      // Add new order
      orders.unshift(order);
    }
    
    localStorage.setItem('orders', JSON.stringify(orders));
  }

  onCancel(): void {
    this.router.navigate(['/offers']);
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  onFileSelect(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }
    
    const file = fileInput.files[0];
    this.offerForm.patchValue({ image: file });
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onPhotoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.handleFileUpload(file);
    }
  }

  handleFileUpload(file: File): void {
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        this.uploadedPhoto = e.target.result;
        
        // Update display elements
        if (this.photoPreview && this.uploadPlaceholder && this.removePhotoBtn) {
          this.photoPreview.nativeElement.src = this.uploadedPhoto;
          this.photoPreview.nativeElement.style.display = 'block';
          this.uploadPlaceholder.nativeElement.style.display = 'none';
          this.removePhotoBtn.nativeElement.style.display = 'flex';
        }
      };
      
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.uploadedPhoto = null;
    
    // Reset file input
    if (this.photoInput) {
      this.photoInput.nativeElement.value = '';
    }
    
    // Update display elements
    if (this.photoPreview && this.uploadPlaceholder && this.removePhotoBtn) {
      this.photoPreview.nativeElement.style.display = 'none';
      this.uploadPlaceholder.nativeElement.style.display = 'block';
      this.removePhotoBtn.nativeElement.style.display = 'none';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.handleFileUpload(file);
      }
    }
  }

  getLocationName(locationId: string): string {
    const location = this.locations.find(loc => loc.id === locationId);
    return location ? location.name : '';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  }

  // Calculate suggested price based on locations and weight
  updateSuggestedPrice(): void {
    const from = this.offerForm.get('from')?.value;
    const to = this.offerForm.get('to')?.value;
    const weight = parseFloat(this.offerForm.get('weight')?.value) || 0;

    if (from && to) {
      // Get base price from the matrix
      let basePrice = 100; // Default price
      
      if (this.priceMatrix[from] && this.priceMatrix[from][to]) {
        basePrice = this.priceMatrix[from][to];
      }

      // Add additional cost for weight over 5kg
      const weightCost = weight > 5 ? (weight - 5) * 5 : 0;
      
      // Calculate final suggested price
      this.suggestedPrice = Math.round(basePrice + weightCost);

      // If price is empty or less than suggested, update it
      const currentPrice = this.offerForm.get('price')?.value;
      if (!currentPrice || currentPrice < this.suggestedPrice) {
        this.offerForm.patchValue({ price: this.suggestedPrice });
      }
    }
  }
  
  validatePrice(): boolean {
    const price = this.offerForm.get('price')?.value;
    if (price < this.suggestedPrice) {
      return false;
    }
    return true;
  }
}
