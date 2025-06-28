import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LostAndFoundService } from '../../../core/services/lost-and-found.service';
import { LostAndFound } from '../../../core/models/lost-and-found';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-lost-and-found-edit',
  templateUrl: './lost-and-found-edit.component.html',
  styleUrls: ['./lost-and-found-edit.component.css'],
  imports: [CommonModule, FormsModule]
})
export class LostAndFoundEditComponent implements OnInit {
  postId!: number;
  post: LostAndFound = { TrainId: 0, ItemDescription: '', ContactDetails: '', UserId: '', Status: 0, DateLost: '', LfId: 0 };
  selectedFile: File | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lostAndFoundService: LostAndFoundService,
    public authService: AuthService
  ) {
    const idParam = this.route.snapshot.paramMap.get('postId');
    if (idParam) {
      this.postId = parseInt(idParam, 10);
    }
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.loadPost();
  }

  loadPost(): void {
    this.loading = true;
    this.lostAndFoundService.getVerifiedPosts().subscribe({
      next: (posts) => {
        const post = posts.Data.find(p => p.LfId === this.postId && p.UserId === this.authService.getCurrentUserId());
        if (post ) {
          this.post = { ...post };
       // التأكد من أن TrainId موجود
          if (!this.post.TrainId) {
            this.errorMessage = 'معرف القطار غير موجود في البلاغ';
            this.loading = false;
            setTimeout(() => this.router.navigate([`/lost-and-found/0`]), 2000);
            return;
          }
        } else {
          this.errorMessage = 'البلاغ غير موجود، أو لا تملك صلاحية لتعديله، أو ليس في حالة قيد الانتظار';
          this.loading = false;
          setTimeout(() => this.router.navigate([`/lost-and-found/0`]), 2000);
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'حدث خطأ أثناء تحميل البلاغ';
        this.loading = false;
        console.error('Error loading post:', error);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت';
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.post.Photo = URL.createObjectURL(file); // معاينة الصورة فورًا
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    if (!this.post.ItemDescription || !this.post.ContactDetails) {
      this.errorMessage = 'جميع الحقول المطلوبة يجب ملؤها';
      this.loading = false;
      return;
    }

    const formData = new FormData();
    formData.append('trainId', this.post.TrainId.toString()); // استخدام TrainId من البوست
    formData.append('itemDescription', this.post.ItemDescription);
    formData.append('contactDetails', this.post.ContactDetails);
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    this.lostAndFoundService.updatePost(this.postId, formData).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate([`/lost-and-found/${this.post.TrainId}`]);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'حدث خطأ أثناء تعديل البلاغ';
        this.loading = false;
        console.error('Error updating post:', error);
      }
    });
  }
}