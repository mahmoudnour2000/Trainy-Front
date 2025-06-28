import { Component, Input, OnInit } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms'; // Add this


@Component({
  selector: 'app-activate-traintracking',
  standalone: true, // Assuming standalone component
  imports: [FormsModule], // Add FormsModule here
  templateUrl: './activate-traintracking.component.html',
  styleUrls: ['./activate-traintracking.component.css']
})
export class ActivateTraintrackingComponent implements OnInit {
  @Input() trainId!: number;
  isNotificationEnabled: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.trainId) {
      console.error('trainId is required');
      return;
    }
    if (this.authService.isAuthenticated()) {
      this.checkNotificationStatus();
    } else {
      console.error('User is not authenticated');
    }
  }

  checkNotificationStatus(): void {
    this.notificationService.isNotificationEnabled(this.trainId).subscribe(
      (enabled: boolean) => {
        this.isNotificationEnabled = enabled;
      },
      (error) => console.error('Error checking notification status:', error)
    );
  }

  toggleNotification(): void {
    if (!this.authService.isAuthenticated()) {
      console.error('User is not authenticated');
      return;
    }

    if (this.isNotificationEnabled) {
      this.notificationService.disableNotification(this.trainId).subscribe(
        () => {
          this.isNotificationEnabled = false;
          this.notificationService.leaveTrainGroup(this.trainId);
        },
        (error) => console.error('Error disabling notification:', error)
      );
    } else {
      this.notificationService.enableNotification(this.trainId).subscribe(
        () => {
          this.isNotificationEnabled = true;
          this.notificationService.joinTrainGroup(this.trainId);
        },
        (error) => console.error('Error enabling notification:', error)
      );
    }
  }
}