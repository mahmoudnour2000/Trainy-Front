import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';
import { Notification } from '../../core/models/notification';
import { ElementRef, HostListener } from '@angular/core';

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
  private notificationSub!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
     private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.notificationSub = this.notificationService.getAllNotifications().subscribe(notifications => {
        this.notifications = notifications;
        console.log('Notifications in header:', notifications);
      });
      this.notificationService.getUnreadCount().subscribe(count => {
        this.unreadCount = count;
      });
      this.notificationService.fetchNotifications(); // جلب الإشعارات عند بدء الـ component
    }
  }

  ngOnDestroy(): void {
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
    }
  }

  logout(): void {
    this.authService.LogOut().subscribe({
      next: () => {
        this.isLoggedIn = false;
        this.authService.clearToken();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        console.error('Logout failed');
      }
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    // شيلنا المنطق بتاع markAsRead وunreadCount = 0 عشان الإشعارات تبقى موجودة
  }

  viewAll(): void {
    this.router.navigate(['/notifications']);
  }
  @HostListener('document:click', ['$event'])
onClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;

  if (this.showDropdown && !this.eRef.nativeElement.contains(target)) {
    this.showDropdown = false;
  }

}}