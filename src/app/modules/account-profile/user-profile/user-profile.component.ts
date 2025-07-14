// src/app/modules/account-profile/user-profile/user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { User, Offer, Request } from '../../../core/models/user';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  offers: Offer[] = [];
  requests: Request[] = [];
  personalInfoEditMode: boolean = false;
  isLoadingProfile: boolean = false;
  isLoadingOffers: boolean = false;
  isLoadingRequests: boolean = false;
  errorMessage: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadAllUserData();
  }

  loadAllUserData(): void {
    this.isLoadingProfile = true;
    this.isLoadingOffers = true;
    this.isLoadingRequests = true;

    forkJoin({
      user: this.userService.getUserProfile(),
      offers: this.userService.getUserOffers(),
      requests: this.userService.getUserRequests()
    }).subscribe({
      next: (result) => {
        // console.log('User data loaded successfully:', result);
        this.user = result.user;

        if ('message' in result.offers) {
          this.offers = [];
          this.errorMessage = result.offers.message || 'لا توجد عروض متاحة';
        } else {
          this.offers = result.offers;
          this.errorMessage = null;
        }

        if ('message' in result.requests) {
          this.requests = [];
          this.errorMessage = this.errorMessage || result.requests.message || 'لا توجد طلبات متاحة';
        } else {
          this.requests = result.requests;
          this.errorMessage = null;
        }
      },
      error: (err) => {
        console.error('Error loading user data:', err);
        this.errorMessage = err.error?.message || 'حدث خطأ أثناء تحميل البيانات';
        this.offers = [];
        this.requests = [];
      },
      complete: () => {
        this.isLoadingProfile = false;
        this.isLoadingOffers = false;
        this.isLoadingRequests = false;
      }
    });
  }

  loadUserProfile(): void {
    this.isLoadingProfile = true;
    this.userService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.errorMessage = null;
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
        this.errorMessage = err.error?.message || 'حدث خطأ أثناء جلب بيانات المستخدم';
      },
      complete: () => this.isLoadingProfile = false
    });
  }

  loadOffers(): void {
    this.isLoadingOffers = true;
    this.userService.getUserOffers().subscribe({
      next: (response) => {
        if ('message' in response) {
          this.offers = [];
          this.errorMessage = response.message || 'لا توجد عروض متاحة';
        } else {
          this.offers = response;
          this.errorMessage = null;
        }
      },
      error: (err) => {
        console.error('Error fetching offers:', err);
        this.errorMessage = err.error?.message || 'حدث خطأ أثناء جلب العروض';
        this.offers = [];
      },
      complete: () => {
        this.isLoadingOffers = false;
      }
    });
  }

  loadRequests(): void {
    this.isLoadingRequests = true;
    this.userService.getUserRequests().subscribe({
      next: (response) => {
        if ('message' in response) {
          this.requests = [];
          this.errorMessage = response.message || 'لا توجد طلبات متاحة';
        } else {
          this.requests = response;
          this.errorMessage = null;
        }
      },
      error: (err) => {
        console.error('Error fetching requests:', err);
        this.errorMessage = err.error?.message || 'حدث خطأ أثناء جلب الطلبات';
        this.requests = [];
      },
      complete: () => this.isLoadingRequests = false
    });
  }

  onUpdateImage(file: File): void {
    if (this.user) {
      this.userService.uploadProfileImage(file).subscribe({
        next: (response) => {
          if (this.user) {
            this.user.Image = response.imageUrl;
            // console.log('تم تحديث صورة الملف الشخصي بنجاح');
          }
        },
        error: (err) => {
          console.error('Error uploading image:', err);
          this.errorMessage = err.error?.message || 'فشل في رفع الصورة، حاولي مرة أخرى';
        }
      });
    } else {
      console.error('User data is missing');
      this.errorMessage = 'بيانات المستخدم غير موجودة';
    }
  }

  onCancelEdit(): void {
    this.personalInfoEditMode = false;
  }

  onUpdateUser(updatedUser: Partial<User>): void {
    if (this.user) {
      this.isLoadingProfile = true;
      const userToUpdate = { ...this.user, ...updatedUser };
      this.userService.updateUserData(userToUpdate).subscribe({
        next: (updatedUserResponse) => {
          this.user = { ...this.user, ...updatedUserResponse };
          this.personalInfoEditMode = false;
          this.errorMessage = null;
          // console.log('User updated successfully:', this.user);
        },
        error: (err) => {
          console.error('Error updating user:', err);
          this.errorMessage = err.error?.message || 'فشل في تحديث البيانات، حاولي مرة أخرى';
        },
        complete: () => this.isLoadingProfile = false
      });
    }
  }
}