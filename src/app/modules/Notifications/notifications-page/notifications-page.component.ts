import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { Notification } from '../../../core/models/notification';


@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.getAllNotifications().subscribe(notifications => {
      this.notifications = notifications;
      console.log('Fetched notifications in component:', notifications);
    });
    this.notificationService.fetchNotifications(); 
  }


trackByFn(index: number, item: any) {
  return item.id || index;
}
}