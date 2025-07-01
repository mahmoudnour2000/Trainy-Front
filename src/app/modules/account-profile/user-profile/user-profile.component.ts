import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { User, Offer, Request as UserRequest } from '../../../core/models/user';
import { forkJoin } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  offers: Offer[] = [];
  requests: UserRequest[] = [];

  personalInfoEditMode: boolean = false;

  isLoadingProfile: boolean = false;
  isLoadingOffers: boolean = false;
  isLoadingRequests: boolean = false;
errorMessage: string | null = null; // For error display
  constructor(
    private userService: UserService
  ) {}

  // ngOnInit(): void {
  //   this.loadUserProfile();
  //   this.loadOffers();
  //   this.loadRequests();
  // }


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
      console.log('User data loaded successfully:', result);
      this.user = result.user;
      this.offers = result.offers;
      this.requests = result.requests;
    },
    error: (err) => {
      console.error('Error loading user data:', err);
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
      next: (user) => this.user = user,
      error: (err) => {
        console.error('Error fetching user profile:', err);
      },
      complete: () => this.isLoadingProfile = false
    });
  }

  loadOffers(): void {
    this.isLoadingOffers = true;
    this.userService.getUserOffers().subscribe({
      next: (offers) => this.offers = offers,
      error: (err) => {
        console.error('Error fetching offers:', err);
      },
      complete: () => this.isLoadingOffers = false
    });
  }

  loadRequests(): void {
    this.isLoadingRequests = true;
    this.userService.getUserRequests().subscribe({
      next: (requests) => this.requests = requests,
      error: (err) => {
        console.error('Error fetching requests:', err);
      },
      complete: () => this.isLoadingRequests = false
    });
  }
onUpdateImage(file: File): void {
  if (this.user) {  // طالما الدالة نفسها بتجيب الـ userId
    this.userService.uploadProfileImage(file).subscribe({
      next: (response) => {
        if (this.user) {
          this.user.Image = response.imageUrl;
          console.log('تم تحديث صورة الملف الشخصي بنجاح');
        }
      },
      error: (err) => {
        console.error('Error uploading image:', err);
      }
    });
  } else {
    console.error('User data is missing');
  }
}
// user-profile.component.ts
onCancelEdit(): void {
  this.personalInfoEditMode = false;
}

  onUpdateUser(updatedUser: Partial<User>): void {
  if (this.user) {
    this.isLoadingProfile = true;
    const userToUpdate = { ...this.user, ...updatedUser }; // Merge the updated data with the existing user
    this.userService.updateUserData(userToUpdate).subscribe({
      next: (updatedUserResponse) => {
        // Merge the response with the existing user to preserve all properties
        this.user = { ...this.user, ...updatedUserResponse };
        this.personalInfoEditMode = false;
        this.errorMessage = null;
        console.log('User updated successfully:', this.user);
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.errorMessage = 'فشل في تحديث البيانات، حاولي مرة أخرى';
      },
      complete: () => this.isLoadingProfile = false
    });
  }
}

  
  
}
