import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VerificationService, CombinedVerificationStatus, VerificationRequestCreateModel, VerificationStatusType } from '../../../../core/services/verification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-verification-images',
  templateUrl: './verification-images.component.html',
  styleUrls: ['./verification-images.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class VerificationImagesComponent implements OnInit {
  verificationForm: FormGroup;
  returnUrl: string = '/';
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  idImagePreview: string | ArrayBuffer | null = null;
  selfieImagePreview: string | ArrayBuffer | null = null;
  
  maxFileSize = 5 * 1024 * 1024;
  
  environment = environment;

  canSubmitSender = true;
  canSubmitCourier = true;
  currentSenderStatus: VerificationStatusType = 'Pending';
  currentCourierStatus: VerificationStatusType = 'Pending';
  
  constructor(
    private fb: FormBuilder,
    private verificationService: VerificationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.verificationForm = this.fb.group({
      requestedRole: [null, Validators.required],
      nationalId: ['', [
        Validators.required,
        Validators.pattern(/^\d{14}$/),
        Validators.minLength(14),
        Validators.maxLength(14)
      ]],
      idImage: [null, Validators.required],
      selfieImage: [null, Validators.required]
    });
    
    console.log('Verification Images Component initialized');
  }
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
    
    this.verificationService.verificationStatus$.subscribe((status: CombinedVerificationStatus) => {
      console.log('Current verification status in ImagesComponent:', status);
      this.currentSenderStatus = status.senderStatus;
      this.currentCourierStatus = status.courierStatus;

      // Update submission availability - users can submit if status is NotSubmitted or Rejected
      this.canSubmitSender = status.senderStatus === 'NotSubmitted' || status.senderStatus === 'Rejected';
      this.canSubmitCourier = status.courierStatus === 'NotSubmitted' || status.courierStatus === 'Rejected';

      const queryRole = this.route.snapshot.queryParams['roleType'] as 'Sender' | 'Courier';
      if (queryRole) {
        if (queryRole === 'Sender' && this.canSubmitSender) {
          this.verificationForm.patchValue({ requestedRole: 'Sender' });
        } else if (queryRole === 'Courier' && this.canSubmitCourier) {
          this.verificationForm.patchValue({ requestedRole: 'Courier' });
        }
      }

      // Check if user should be redirected to status page
      // Redirect if both roles are either Pending or Accepted (can't submit anything)
      const bothRolesBlocked = 
        (status.senderStatus === 'Pending' || status.senderStatus === 'Accepted') &&
        (status.courierStatus === 'Pending' || status.courierStatus === 'Accepted');
      
      const hasAnySubmittedVerification = status.verificationRequests.length > 0;
      
      if (bothRolesBlocked && hasAnySubmittedVerification) {
         console.log('User has pending/approved verification. Redirecting to status page.');
         this.router.navigate(['/verification/status'], { 
           queryParams: { 
             message: 'لديك طلب تحقق قيد المراجعة أو مُوافق عليه بالفعل' 
           } 
         });
      } else if (!this.canSubmitSender && !this.canSubmitCourier && hasAnySubmittedVerification) {
         console.log('No available roles for submission. Redirecting to status page.');
         this.router.navigate(['/verification/status'], { 
           queryParams: { 
             message: 'يرجى مراجعة حالة التحقق الخاصة بك' 
           } 
         });
      }
      
      // If user has NotSubmitted status and no specific role is selected, auto-select the first available role
      if (!this.verificationForm.get('requestedRole')?.value) {
        if (this.canSubmitSender) {
          this.verificationForm.patchValue({ requestedRole: 'Sender' });
        } else if (this.canSubmitCourier) {
          this.verificationForm.patchValue({ requestedRole: 'Courier' });
        }
      }
    });
  }
  
  onIdImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      if (file.size > this.maxFileSize) {
        this.errorMessage = 'ملف صورة الهوية كبير جداً. الحد الأقصى 5 ميجابايت.';
        this.verificationForm.controls['idImage'].setValue(null);
        this.idImagePreview = null;
        return;
      }
      this.verificationForm.patchValue({ idImage: file });
      this.verificationForm.get('idImage')?.markAsTouched();
      const reader = new FileReader();
      reader.onload = () => { this.idImagePreview = reader.result; };
      reader.readAsDataURL(file);
      this.errorMessage = '';
      console.log('ID image selected:', file.name, 'Size:', this.formatFileSize(file.size));
    }
  }
  
  onSelfieImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      if (file.size > this.maxFileSize) {
        this.errorMessage = 'ملف الصورة الشخصية كبير جداً. الحد الأقصى 5 ميجابايت.';
        this.verificationForm.controls['selfieImage'].setValue(null);
        this.selfieImagePreview = null;
        return;
      }
      this.verificationForm.patchValue({ selfieImage: file });
      this.verificationForm.get('selfieImage')?.markAsTouched();
      const reader = new FileReader();
      reader.onload = () => { this.selfieImagePreview = reader.result; };
      reader.readAsDataURL(file);
      this.errorMessage = '';
      console.log('Selfie image selected:', file.name, 'Size:', this.formatFileSize(file.size));
    }
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  getRoleInArabic(role: string): string {
    switch(role) {
      case 'Sender': return 'مرسل';
      case 'Courier': return 'موصل';
      default: return 'مرسل أو موصل';
    }
  }

  onNationalIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remove any non-digit characters
    const value = input.value.replace(/\D/g, '');
    // Limit to 14 characters
    input.value = value.substring(0, 14);
    // Update form control
    this.verificationForm.get('nationalId')?.setValue(input.value);
  }

  onSubmit(): void {
    if (this.verificationForm.invalid) {
      this.errorMessage = 'يرجى ملء جميع الحقول واختيار كلا الصورتين.';
      Object.values(this.verificationForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const formValue = this.verificationForm.value;
    const submissionData: VerificationRequestCreateModel = {
      requestedRole: formValue.requestedRole,
      nationalId: formValue.nationalId,
      photo1: formValue.idImage,
      photo2: formValue.selfieImage
    };

    console.log('Submitting verification for role:', submissionData.requestedRole);
    console.log('National ID:', submissionData.nationalId);
    console.log('Photo 1:', submissionData.photo1.name, 'Size:', this.formatFileSize(submissionData.photo1.size));
    console.log('Photo 2:', submissionData.photo2.name, 'Size:', this.formatFileSize(submissionData.photo2.size));
        
    this.verificationService.submitVerification(submissionData)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log('Verification submission successful:', response);
          this.successMessage = 'تم رفع المستندات بنجاح! جاري التوجيه إلى صفحة الحالة...';
          
          // Reset form after successful submission
          this.verificationForm.reset();
          this.idImagePreview = null;
          this.selfieImagePreview = null;
          
          // Redirect to status page immediately after successful submission
          setTimeout(() => {
            this.router.navigate(['/verification/status'], {
              queryParams: { message: 'تم إرسال طلب التحقق بنجاح! سيتم مراجعته خلال 1-2 يوم عمل.' }
            });
          }, 1500);
        },
        error: (error: any) => {
          console.error('Error uploading verification documents:', error);
          this.errorMessage = error.message || 'فشل في رفع مستندات التحقق. يرجى المحاولة مرة أخرى.';
        }
      });
  }
} 