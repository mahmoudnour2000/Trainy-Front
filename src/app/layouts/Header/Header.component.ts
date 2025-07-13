import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { LoaderService } from '../../core/services/loader.service';
import { Subscription } from 'rxjs';
import { User } from '../../core/models/user';
import { Notification } from '../../core/models/notification';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-Header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  unreadCount: number = 0;
  notifications: Notification[] = [];
  showDropdown: boolean = false;
  showUserDropdown: boolean = false;
  user: User | null = null;
  profileImage: string | undefined = undefined;
  private notificationSub!: Subscription;
  private userProfileSub!: Subscription;
  private profileImageSub!: Subscription;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService,
    private loaderService: LoaderService,
    private eRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.userService.getUserProfile().subscribe({
        next: (user: User) => {
          this.authService.LoggedUser.next(user);
          console.log('User profile fetched successfully', user);
        },
        error: (error) => {
          this.authService.LoggedUser.next(null);
          console.error('Error fetching user profile:', error);
        }
      });

      this.authService.LoggedUser.subscribe({
        next: (user) => {
          this.user = user;
          console.log('User in header:', this.user);
          if (this.user) {
            this.isLoggedIn = true;
            this.profileImage = this.user.Image;
          } else {
            this.isLoggedIn = false;
            this.profileImage = undefined;
          }
        }
      });

      this.notificationSub = this.notificationService.getAllNotifications().subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          console.log('Notifications in header:', notifications);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching notifications:', error);
          this.loaderService.hideLoader();
          this.cdr.detectChanges();
        }
      });

      this.notificationService.getUnreadCount().subscribe({
        next: (count) => {
          this.unreadCount = count;
          console.log(this.unreadCount);
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching unread count:', error);
          this.loaderService.hideLoader();
          this.cdr.detectChanges();
        }
      });

      this.notificationService.fetchNotifications();
    }
  }

  ngOnDestroy(): void {
    if (this.notificationSub) this.notificationSub.unsubscribe();
    if (this.userProfileSub) this.userProfileSub.unsubscribe();
    if (this.profileImageSub) this.profileImageSub.unsubscribe();
  }

  logout(): void {
    this.authService.LogOut().subscribe({
      next: () => {
        this.isLoggedIn = false;
        this.user = null;
        this.profileImage = undefined;
        this.authService.clearToken();
        this.authService.LoggedUser.next(null);
        this.router.navigate(['auth/login']);
      },
      error: () => {
        console.error('Logout failed');
        this.loaderService.hideLoader();
        this.cdr.detectChanges();
      }
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    this.showUserDropdown = false;
    if (this.showDropdown && this.unreadCount > 0) {
      this.notifications.forEach(n => {
        if (!n.IsRead) {
          this.notificationService.markAsRead(n.Id).subscribe();
        }
      });
    }
    this.cdr.detectChanges();
    console.log(this.notifications);
    
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
    this.showDropdown = false;
    this.cdr.detectChanges();
  }

  viewAll(): void {
    this.router.navigate(['/notifications']);
    this.showDropdown = false;
    this.cdr.detectChanges();
  }

  goToProfile(): void {
    this.router.navigate(['/userProfile']);
    this.showUserDropdown = false;
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.showDropdown && !this.eRef.nativeElement.contains(target)) {
      this.showDropdown = false;
    }
    if (this.showUserDropdown && !this.eRef.nativeElement.contains(target)) {
      this.showUserDropdown = false;
    }
    this.cdr.detectChanges();
  }
}