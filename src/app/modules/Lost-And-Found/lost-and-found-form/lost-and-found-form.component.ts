import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router,RouterModule } from '@angular/router';
import { LostAndFoundService } from '../../../core/services/lost-and-found.service';
import { TrainService } from '../../../core/services/train.service';
import { LostAndFound } from '../../../core/models/lost-and-found';
import { TrainListViewModel } from '../../../core/models/train';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  standalone: true,
  selector: 'app-lost-and-found-form',
  templateUrl: './lost-and-found-form.component.html',
  styleUrls: ['./lost-and-found-form.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class LostAndFoundFormComponent implements OnInit {
  trainId!: number;
  train!: TrainListViewModel;
  post: LostAndFound = { TrainId: 0, ItemDescription: '', ContactDetails: '' };
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  charCount: number = 0;
  isCharCountWarning: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lostAndFoundService: LostAndFoundService,
    private trainService: TrainService,
    public authService: AuthService
  ) {
    const idParam = this.route.snapshot.paramMap.get('trainId');
    if (idParam) {
      this.trainId = parseInt(idParam, 10);
      this.post.TrainId = this.trainId;
    }
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.trainService.getTrainById(this.trainId).subscribe({
      next: (data) => {
        this.train = data;
      },
      error: (error) => {
        console.error('Error loading train:', error);
        this.errorMessage = 'حدث خطأ أثناء تحميل بيانات القطار';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.selectedFile = null;
      this.imagePreviewUrl = null;
    }
  }

  updateCharCounter(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    const maxLength = 100;
    this.charCount = input.value.length;
    this.isCharCountWarning = this.charCount > maxLength * 0.8;
  }

  resetForm(): void {
    this.post = { TrainId: this.trainId, ItemDescription: '', ContactDetails: '' };
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.charCount = 0;
    this.isCharCountWarning = false;
    this.errorMessage = '';
    this.successMessage = '';
    
    // إعادة تعيين input الملف
    const fileInput = document.getElementById('photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.post.ItemDescription || !this.post.ContactDetails || !this.selectedFile || this.post.TrainId <= 0) {
      this.errorMessage = 'جميع الحقول مطلوبة، بما في ذلك صورة المفقود';
      return;
    }

    if (this.post.ItemDescription.length > 100) {
      this.errorMessage = 'وصف المفقود يجب أن لا يتجاوز 100 حرف';
      return;
    }

    const formData = new FormData();
    formData.append('trainId', this.post.TrainId.toString());
    formData.append('itemDescription', this.post.ItemDescription);
    formData.append('contactDetails', this.post.ContactDetails);
    formData.append('photo', this.selectedFile);

    this.lostAndFoundService.addPost(formData).subscribe({
      next: (response: { message: string }) => {
        this.successMessage = response.message;
        setTimeout(() => {
          this.router.navigate([`/traindetails/${this.trainId}/lost-and-found`]);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'حدث خطأ أثناء رفع البلاغ';
        console.error('Error adding post:', error);
      }
    });
  }
}