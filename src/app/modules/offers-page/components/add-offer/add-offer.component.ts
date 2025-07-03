import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { OfferService } from '../../../../core/services/offer.service';

// Temporary interface for fixed stations - will be replaced with API model later
interface Station {
  id: number;
  name: string;
  location: string;
}

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
  isLoading: boolean = false;
  
  // Categories for offers
  categories: { id: string, name: string }[] = [
    { id: 'documents', name: 'مستندات' },
    { id: 'electronics', name: 'إلكترونيات' },
    { id: 'clothing', name: 'ملابس' },
    { id: 'food', name: 'مواد غذائية' },
    { id: 'furniture', name: 'أثاث' },
    { id: 'other', name: 'أخرى' }
  ];
  
  // Fixed stations list (0-3) - will be replaced with API call later
  stations: Station[] = [
    { id: 0, name: 'محطة القاهرة', location: 'القاهرة' },
    { id: 1, name: 'محطة الإسكندرية', location: 'الإسكندرية' },
    { id: 2, name: 'محطة الجيزة', location: 'الجيزة' },
    { id: 3, name: 'محطة الأقصر', location: 'الأقصر' }
  ];

  // Price matrix for calculating suggested prices
  priceMatrix: { [key: string]: { [key: string]: number } } = {
    '0': {
      '1': 50,
      '2': 25,
      '3': 100,
      '0': 20
    },
    '1': {
      '0': 50,
      '2': 60,
      '3': 140,
      '1': 20
    },
    '2': {
      '0': 25,
      '1': 60,
      '3': 110,
      '2': 20
    },
    '3': {
      '0': 100,
      '1': 140,
      '2': 110,
      '3': 20
    }
  };

  suggestedPrice: number = 0;
  
  paymentMethods = [
    { value: 'EtisalatCash', label: 'اتصالات كاش' },
    { value: 'VodafoneCash', label: 'فودافون كاش' },
    { value: 'PayPal', label: 'PayPal' },
    { value: 'Stripe', label: 'Stripe' },
    { value: 'AccountNumber', label: 'رقم حساب بنكي' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private offerService: OfferService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
    // TODO: Replace with API call when station service is ready
    // this.loadStationsFromAPI();
  }

  // TODO: This method will be implemented when the station API service is ready
  // private loadStationsFromAPI(): void {
  //   // Example of future implementation:
  //   // this.stationService.getStations().subscribe({
  //   //   next: (response) => {
  //   //     this.stations = response.data;
  //   //   },
  //   //   error: (error) => {
  //   //     console.error('Error loading stations:', error);
  //   //   }
  //   // });
  // }

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
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
      category: ['', Validators.required],
      from: ['', Validators.required],
      to: ['', Validators.required],
      weight: [null, [Validators.required, Validators.min(0.1)]],
      price: [null, [Validators.required, Validators.min(1)]],
      isBreakable: [false],
      paymentMethod: ['', Validators.required],
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
    this.isLoading = true;
    
    // Load offer data from API
    this.offerService.getOfferById(orderId).subscribe({
      next: (offer) => {
        console.log('Loaded offer for editing:', offer);
        
        // Map API data to form fields
        this.offerForm.patchValue({
          description: offer.description,
          category: this.mapCategoryToId(offer.category),
          from: offer.fromStationId?.toString() || offer.from?.toString(),
          to: offer.toStationId?.toString() || offer.to?.toString(),
          weight: offer.weight,
          price: offer.price,
          isBreakable: offer.isBreakable || false,
          paymentMethod: offer.paymentMethod || ''
        });
        
        // Set image if available
        if (offer.image) {
          this.uploadedPhoto = offer.image;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading offer:', error);
        alert('حدث خطأ أثناء تحميل بيانات العرض');
        this.isLoading = false;
        this.router.navigate(['/offers']);
      }
    });
  }

  onSubmit(): void {
    if (this.offerForm.invalid) {
      this.markFormGroupTouched(this.offerForm);
      return;
    }
    this.isLoading = true;
    const formData = this.offerForm.value;

    // Build FormData for multipart/form-data
    const payload = new FormData();
    payload.append('Description', formData.description);
    payload.append('Category', this.mapCategoryToApiCategory(formData.category));
    payload.append('PaymentMethod', formData.paymentMethod);
    payload.append('PickupStationId', formData.from);
    payload.append('DropoffStationId', formData.to);
    payload.append('Weight', formData.weight);
    payload.append('Price', formData.price);
    payload.append('IsBreakable', formData.isBreakable);

    // Append the image file if present
    if (formData.image) {
      payload.append('ImageFile', formData.image); // must be a File object
    }

    if (this.editMode && this.orderId) {
      this.offerService.updateOffer(this.orderId, payload).subscribe({
        next: () => {
          alert('تم تحديث العرض بنجاح');
          this.router.navigate(['/offers']);
        },
        error: (err) => {
          alert('حدث خطأ أثناء تحديث العرض: ' + (err?.error?.message || ''));
          this.isLoading = false;
        }
      });
    } else {
      this.offerService.createOffer(payload).subscribe({
        next: () => {
          alert('تم إنشاء العرض بنجاح');
          this.router.navigate(['/offers']);
        },
        error: (err) => {
          alert('حدث خطأ أثناء إنشاء العرض: ' + (err?.error?.message || ''));
          this.isLoading = false;
        }
      });
    }
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
      this.offerForm.patchValue({ image: file });
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
    const location = this.stations.find(loc => loc.id.toString() === locationId);
    return location ? location.name : '';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  }

  // Map frontend category ID to API category
  private mapCategoryToApiCategory(categoryId: string): string {
    const categoryMap: { [key: string]: string } = {
      'electronics': 'Electronics',
      'clothing': 'Clothing',
      'food': 'Food',
      'furniture': 'Furniture',
      'documents': 'Documents',
      'other': 'Other'
    };
    return categoryMap[categoryId] || 'Other';
  }

  // Map API category to frontend category ID
  private mapCategoryToId(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'Electronics': 'electronics',
      'Clothing': 'clothing',
      'Food': 'food',
      'Furniture': 'furniture',
      'Documents': 'documents',
      'Other': 'other'
    };
    return categoryMap[category] || 'other';
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
