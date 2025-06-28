import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LostAndFoundService } from '../../../core/services/lost-and-found.service';
import { LostAndFound, LostAndFoundSearchRequest, PaginatedResponse } from '../../../core/models/lost-and-found';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-lost-and-found-list',
  templateUrl: './lost-and-found-list.component.html',
  styleUrls: ['./lost-and-found-list.component.css'],
  imports: [CommonModule, FormsModule]
})
export class LostAndFoundListComponent implements OnInit {
  posts: LostAndFound[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  trainId?: number;
  currentUserId: string | null = null;
  searchDate: string = '';
  pageNumber: number = 1;
  pageSize: number = 9;
  totalPages: number = 0;
  totalCount: number = 0; // Added for accurate pagination
  loading: boolean = false; // Added for loading state

  constructor(
    private route: ActivatedRoute,
    private lostAndFoundService: LostAndFoundService,
    private router: Router,
    public authService: AuthService
  ) {
    const idParam = this.route.snapshot.paramMap.get('trainId');
    if (idParam) {
      this.trainId = parseInt(idParam, 10);
    }
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.currentUserId = this.authService.getCurrentUserId();
    console.log('currentUserId:', this.currentUserId);

    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    if (this.searchDate) {
      // Search by date and trainId
      this.lostAndFoundService.searchByDate(this.searchDate, this.trainId, this.pageNumber, this.pageSize).subscribe({
        next: (response: PaginatedResponse<LostAndFound>) => {
          this.posts = response.Data;
          this.pageNumber = response.PageNumber;
          this.pageSize = response.PageSize;
          this.totalCount = response.TotalCount;
          this.totalPages = Math.ceil(this.totalCount / this.pageSize);
          this.errorMessage = this.posts.length === 0 ? 'لا توجد مفقودات مطابقة' : '';
          this.loading = false;
          for (let post of this.posts) {
            console.log(`Post LfId=${post.LfId} - UserId=${post.UserId} - isUserPost=${this.isUserPost(post)}`);
          }
        },
        error: (error) => {
          this.errorMessage = 'حدث خطأ أثناء تحميل المفقودات';
          this.loading = false;
          console.error('Error loading posts:', error);
        }
      });
    } else {
      // Load all verified posts for the trainId
     this.lostAndFoundService.getVerifiedPosts(this.trainId, this.pageNumber, this.pageSize).subscribe({
        next: (response: PaginatedResponse<LostAndFound>) => {
          this.posts = response.Data; // Capital 'D' to match backend
          this.pageNumber = response.PageNumber;
          this.pageSize = response.PageSize;
          this.totalCount = response.TotalCount;
          this.totalPages = Math.ceil(this.totalCount / this.pageSize);
          this.errorMessage = this.posts.length === 0 ? 'لا توجد مفقودات مطابقة' : '';
          this.loading = false;
          for (let post of this.posts) {
            console.log(`Post LfId=${post.LfId} - UserId=${post.UserId} - isUserPost=${this.isUserPost(post)}`);
          }
        },
        error: (error) => {
          this.errorMessage = 'حدث خطأ أثناء تحميل المفقودات';
          this.loading = false;
          console.error('Error loading posts:', error);
        }
      });
    }
  }

  search(): void {
    this.pageNumber = 1; // Reset to first page on new search
    this.loadPosts();
  }

  nextPage(): void {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadPosts();
    }
  }

  previousPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadPosts();
    }
  }

  editPost(postId: number | undefined): void {
    if (postId == null) {
      this.errorMessage = 'معرف البلاغ غير صالح';
      return;
    }
    this.router.navigate([`/edit-post/${postId}`]);
  }

  deletePost(postId: number | undefined): void {
    if (postId == null) {
      this.errorMessage = 'معرف البلاغ غير صالح';
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا البلاغ؟')) {
      this.lostAndFoundService.deletePost(postId).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.loadPosts();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'حدث خطأ أثناء حذف البلاغ';
          console.error('Error deleting post:', error);
        }
      });
    }
  }

  reportLost(): void {
    if (this.trainId) {
      this.router.navigate([`/report-lost/${this.trainId}`]);
    }
  }

  isUserPost(post: LostAndFound): boolean {
    return !!post.UserId && !!this.currentUserId && post.UserId === this.currentUserId;
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Expose Math for template (to fix Math.ceil issue)
  Math = Math;
}