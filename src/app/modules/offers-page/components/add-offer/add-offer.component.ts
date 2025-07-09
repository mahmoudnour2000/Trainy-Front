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
  
  // Fixed stations list - will be replaced with API call later
  stations: Station[] = [
    { id: 1, name: 'محطة أسوان', location: 'أسوان' },
    { id: 3, name: 'محطة الأقصر', location: 'الأقصر' },
    { id: 4, name: 'محطة قنا', location: 'قنا' },
    { id: 5, name: 'محطة سوهاج', location: 'سوهاج' },
    { id: 6, name: 'محطة القاهرة', location: 'القاهرة' }
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
    { value: 0, label: 'اتصالات كاش' },
    { value: 1, label: 'فودافون كاش' },
    { value: 2, label: 'PayPal' },
    { value: 3, label: 'Stripe' },
    { value: 4, label: 'رقم حساب بنكي' }
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
    console.log('Initializing form...');
    
    this.offerForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
      category: ['', Validators.required],
      from: ['', Validators.required],
      to: ['', Validators.required],
      weight: [null, [Validators.required, Validators.min(0.1)]],
      price: [null, [Validators.required, Validators.min(1)]],
      isBreakable: [false],
      paymentMethod: [0, Validators.required],
      image: [null]
    });

    console.log('Form initialized:', this.offerForm);
    console.log('Form controls:', Object.keys(this.offerForm.controls));

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
      console.log('checkEditMode - Route params:', { id });
      if (id) {
        this.editMode = true;
        this.orderId = +id;
        this.pageTitle = 'تعديل الطلب';
        console.log('Edit mode enabled for order ID:', this.orderId);
        
        // تأخير إضافي لضمان أن النموذج جاهز قبل تحميل البيانات
        setTimeout(() => {
          if (this.orderId !== null) {
            this.loadOrderData(this.orderId);
          } else {
            console.error('OrderId is null, cannot load data');
          }
        }, 100);
      } else {
        console.log('Create mode - no ID parameter found');
        this.editMode = false;
        this.orderId = null;
        this.pageTitle = 'إضافة طلب جديد';
      }
    });
  }

  private loadOrderData(orderId: number): void {
    this.isLoading = true;
    this.disableFormControls();
    
    console.log('Loading order data for ID:', orderId);
    
    this.offerService.getOfferById(orderId).subscribe({
      next: (offer) => {
        console.log('Received offer data:', offer);
        
        if (!offer) {
          console.error('No offer data received');
          alert('لم يتم العثور على بيانات العرض');
          this.isLoading = false;
          this.enableFormControls();
          this.router.navigate(['/offers']);
          return;
        }
        
        const formData: any = {};
        
        // معالجة شاملة لجميع أسماء الحقول المحتملة
        const offerAny = offer as any;
        
        // Description
        formData.description = offer.description || offerAny.Description || '';
        
        // Category
        const category = offer.category || offerAny.Category || '';
        formData.category = category ? this.mapCategoryToId(category) : '';
        
        // From Station
        const fromStationId = offer.fromStationId || offerAny.PickupStationId || offer.from || offerAny.from || null;
        formData.from = (fromStationId !== undefined && fromStationId !== null) ? fromStationId.toString() : '';
        
        // To Station
        const toStationId = offer.toStationId || offerAny.DropoffStationId || offer.to || offerAny.to || null;
        formData.to = (toStationId !== undefined && toStationId !== null) ? toStationId.toString() : '';
        
        // Weight
        const weight = offer.weight || offerAny.Weight || null;
        formData.weight = (weight !== undefined && weight !== null) ? weight : '';
        
        // Price
        const price = offer.price || offerAny.Price || null;
        formData.price = (price !== undefined && price !== null) ? price : '';
        
        // Is Breakable
        const isBreakable = offer.isBreakable !== undefined ? offer.isBreakable : 
                           (offerAny.IsBreakable !== undefined ? offerAny.IsBreakable : false);
        formData.isBreakable = (typeof isBreakable === 'boolean') ? isBreakable : false;
        
        // Payment Method
        const paymentMethod = offer.paymentMethod || offerAny.PaymentMethod || null;
        formData.paymentMethod = paymentMethod !== undefined && paymentMethod !== null ? 
                                this.mapPaymentMethodFromApi(paymentMethod) : '0';
        
        console.log('Form data to be patched:', formData);
        console.log('Original offer data for debugging:', offer);
        
        // تفعيل النموذج أولاً ثم تحميل البيانات
        this.enableFormControls();
        
        // تأخير أطول لضمان أن النموذج جاهز
        setTimeout(() => {
          try {
            console.log('Patching form with data:', formData);
            this.offerForm.patchValue(formData, { emitEvent: false });
            
            // تحديث السعر المقترح
            this.updateSuggestedPrice();
            
            console.log('Form values after patching:', this.offerForm.value);
            console.log('Form controls state:', {
              description: this.offerForm.get('description')?.value,
              category: this.offerForm.get('category')?.value,
              from: this.offerForm.get('from')?.value,
              to: this.offerForm.get('to')?.value,
              weight: this.offerForm.get('weight')?.value,
              price: this.offerForm.get('price')?.value,
              isBreakable: this.offerForm.get('isBreakable')?.value,
              paymentMethod: this.offerForm.get('paymentMethod')?.value
            });
            
            // تحميل الصورة إذا كانت موجودة
            const image = offer.image || offerAny.Picture || offerAny.image || null;
            if (image) {
              this.uploadedPhoto = image;
              setTimeout(() => {
                this.updateImageDisplay();
              }, 100);
            }
            
            this.isLoading = false;
          } catch (error) {
            console.error('Error patching form data:', error);
            this.isLoading = false;
            this.enableFormControls();
          }
        }, 1000); // زيادة التأخير إلى 1000ms
      },
      error: (error) => {
        console.error('Error loading offer data:', error);
        alert('حدث خطأ أثناء تحميل بيانات العرض: ' + (error?.error?.message || error?.message || 'خطأ غير معروف'));
        this.isLoading = false;
        this.enableFormControls();
        this.router.navigate(['/offers']);
      }
    });
  }
  
  private updateImageDisplay(): void {
    if (this.uploadedPhoto && this.photoPreview && this.uploadPlaceholder && this.removePhotoBtn) {
      this.photoPreview.nativeElement.src = this.uploadedPhoto;
      this.photoPreview.nativeElement.style.display = 'block';
      this.uploadPlaceholder.nativeElement.style.display = 'none';
      this.removePhotoBtn.nativeElement.style.display = 'flex';
    }
  }

  onSubmit(): void {
    if (this.offerForm.invalid) {
      this.markFormGroupTouched(this.offerForm);
      return;
    }
    // Get all form values including disabled controls
    const formData = this.offerForm.getRawValue();
    this.isLoading = true;
    this.disableFormControls();
    const payload = new FormData();
    payload.append('PaymentMethod', this.mapPaymentMethodToValue(formData.paymentMethod).toString());
    payload.append('Description', formData.description);
    payload.append('Weight', Number(formData.weight).toString());
    payload.append('Category', this.mapCategoryToApiCategory(formData.category));
    payload.append('IsBreakable', (formData.isBreakable === true || formData.isBreakable === 'true') ? 'true' : 'false');
    payload.append('Price', Number(formData.price).toString());
    payload.append('PickupStationId', Number(formData.from).toString());
    payload.append('DropoffStationId', Number(formData.to).toString());
    // Append the image file if present
    if (formData.image) {
      payload.append('ImageFile', formData.image); // must be a File object
    }

    // Log all FormData entries for debugging
    console.log([...payload.entries()]);

    if (this.editMode && this.orderId) {
      this.offerService.updateOffer(this.orderId, payload).subscribe({
        next: () => {
          alert('تم تحديث العرض بنجاح');
          this.router.navigate(['/offers']);
        },
        error: (err) => {
          alert('حدث خطأ أثناء تحديث العرض: ' + (err?.error?.message || ''));
          this.isLoading = false;
          this.enableFormControls();
        }
      });
    } else {
      this.offerService.createOffer(payload).subscribe({
        next: () => {
          alert('تم إنشاء العرض بنجاح');
          this.router.navigate(['/offers']);
        },
        error: (err) => {
          console.error('Error creating offer:', err);
          let errorMessage = 'حدث خطأ أثناء إنشاء العرض';
          
          if (err?.error?.message) {
            errorMessage += ': ' + err.error.message;
          } else if (err?.error?.errors) {
            // Handle validation errors
            const validationErrors = Object.values(err.error.errors).flat();
            errorMessage += ': ' + validationErrors.join(', ');
          } else if (err?.message) {
            errorMessage += ': ' + err.message;
          }
          
          alert(errorMessage);
          this.isLoading = false;
          this.enableFormControls();
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
    if (!category) return 'other';
    
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
    
    const mappedCategory = categoryMap[category];
    console.log(`Mapping category: "${category}" to "${mappedCategory}"`);
    return mappedCategory || 'other';
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

  private disableFormControls(): void {
    console.log('Disabling form controls...');
    
    const controls = [
      'description',
      'from',
      'to',
      'category',
      'weight',
      'isBreakable',
      'price',
      'paymentMethod'
    ];
    
    controls.forEach(controlName => {
      const control = this.offerForm.get(controlName);
      if (control) {
        control.disable();
        console.log(`Disabled control: ${controlName}, Value: ${control.value}`);
      } else {
        console.warn(`Control not found: ${controlName}`);
      }
    });
    
    console.log('Form controls disabled');
  }

  private enableFormControls(): void {
    console.log('Enabling form controls...');
    
    const controls = [
      'description',
      'from',
      'to',
      'category',
      'weight',
      'isBreakable',
      'price',
      'paymentMethod'
    ];
    
    controls.forEach(controlName => {
      const control = this.offerForm.get(controlName);
      if (control) {
        control.enable();
        console.log(`Enabled control: ${controlName}, Value: ${control.value}`);
      } else {
        console.warn(`Control not found: ${controlName}`);
      }
    });
    
    console.log('Form controls enabled. Form valid:', this.offerForm.valid);
    console.log('Form dirty:', this.offerForm.dirty);
    console.log('Form touched:', this.offerForm.touched);
    console.log('Form pristine:', this.offerForm.pristine);
  }

  private mapPaymentMethodToValue(paymentMethod: any): number {
    // If it's already a number, return it
    if (typeof paymentMethod === 'number' && !isNaN(paymentMethod)) {
      return paymentMethod;
    }
    
    // If it's a string, map it to the corresponding enum value
    const paymentMethodMap: { [key: string]: number } = {
      'EtisalatCash': 0,
      'VodafoneCash': 1,
      'PayPal': 2,
      'Stripe': 3,
      'AccountNumber': 4
    };
    
    // Try to convert string to number first
    if (typeof paymentMethod === 'string') {
      const numValue = parseInt(paymentMethod, 10);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 4) {
        return numValue;
      }
      // If not a valid number, try string mapping
      return paymentMethodMap[paymentMethod] !== undefined ? paymentMethodMap[paymentMethod] : 0;
    }
    
    // Default to 0 (EtisalatCash) if all else fails
    return 0;
  }

  private mapPaymentMethodFromApi(apiPaymentMethod: string | number): string {
    console.log('Mapping payment method from API:', apiPaymentMethod, 'Type:', typeof apiPaymentMethod);
    
    // Convert to number if it's a string
    let paymentMethodNumber: number;
    
    if (typeof apiPaymentMethod === 'string') {
      // Try to parse string as number first
      const parsed = parseInt(apiPaymentMethod, 10);
      if (!isNaN(parsed)) {
        paymentMethodNumber = parsed;
      } else {
        // Map string values to numbers
        const stringMap: { [key: string]: number } = {
          'EtisalatCash': 0,
          'VodafoneCash': 1,
          'PayPal': 2,
          'Stripe': 3,
          'AccountNumber': 4,
          'etisalatcash': 0,
          'vodafonecash': 1,
          'paypal': 2,
          'stripe': 3,
          'accountnumber': 4
        };
        paymentMethodNumber = stringMap[apiPaymentMethod] || 0;
      }
    } else {
      paymentMethodNumber = apiPaymentMethod || 0;
    }
    
    // Ensure the number is within valid range
    if (paymentMethodNumber < 0 || paymentMethodNumber > 4) {
      paymentMethodNumber = 0;
    }
    
    const result = paymentMethodNumber.toString();
    console.log('Mapped payment method to:', result);
    return result;
  }
}
