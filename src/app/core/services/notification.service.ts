import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject, BehaviorSubject, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { Notification } from '../../core/models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection!: HubConnection;
  private notificationSubject = new Subject<Notification>();
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initHubConnection();
  }

  private initHubConnection(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.error('لا يوجد توكن متاح لاتصال SignalR');
      return;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}OurtrainTrackingHub`, { // تصحيح اسم الـ Hub
        accessTokenFactory: () => token
      })
      .build();

    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      console.log('Received notification:', notification);
      this.updateNotifications(notification);
    });

    this.hubConnection.start()
      .then(() => console.log('SignalR connected at', new Date()))
      .catch(err => console.error('SignalR connection error:', err));
  }

  private updateNotifications(notification: Notification): void {
    const currentNotifications = this.notifications$.value;
    const index = currentNotifications.findIndex(n => n.Id === notification.Id);
    if (index !== -1) {
      currentNotifications[index] = notification;
    } else {
      currentNotifications.push(notification);
    }
    this.notifications$.next(currentNotifications);
    this.updateUnreadCount();
  }

  getNotifications(): Observable<Notification> {
    return this.notificationSubject.asObservable();
  }

  getAllNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  markAsRead(notificationId: number): Observable<void> {
    const url = `${environment.apiUrl}Notification/markAsRead/${notificationId}`;
    return this.http.post<void>(url, {}, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`
      })
    }).pipe(
      tap(() => {
        const currentNotifications = this.notifications$.value;
        const updatedNotifications = currentNotifications.map(n =>
          n.Id === notificationId ? { ...n, IsRead: true } : n
        );
        this.notifications$.next(updatedNotifications);
        this.updateUnreadCount();
      })
    );
  }

  fetchNotifications(): void {
    if (!this.authService.isAuthenticated()) {
      console.error('المستخدم غير مصادق عليه');
      return;
    }
    const url = `${environment.apiUrl}Notification/getUserNotifications`;
    this.http
      .get<Notification[]>(url, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.authService.getToken()}`
        })
      })
      .subscribe({
        next: notifications => {
          console.log('Fetched notifications:', notifications);
          this.notifications$.next(notifications);
          this.updateUnreadCount();
          notifications.forEach(n => this.notificationSubject.next(n));
        },
        error: err => console.error('خطأ في جلب الإشعارات:', err)
      });
  }

  private updateUnreadCount(): void {
    const unread = this.notifications$.value.filter(n => !n.IsRead).length;
    this.unreadCount$.next(unread);
  }

  joinTrainGroup(trainId: number): void {
    if (!this.authService.isAuthenticated()) {
      console.error('المستخدم غير مصادق عليه');
      return;
    }
    this.hubConnection.invoke('JoinTrainGroup', trainId)
      .then(() => console.log(`Joined train group ${trainId}`))
      .catch(err => console.error('خطأ في الانضمام لمجموعة القطار:', err));
  }

  leaveTrainGroup(trainId: number): void {
    if (!this.authService.isAuthenticated()) {
      console.error('المستخدم غير مصادق عليه');
      return;
    }
    this.hubConnection.invoke('LeaveTrainGroup', trainId)
      .catch(err => console.error('خطأ في مغادرة مجموعة القطار:', err));
  }

  enableNotification(trainId: number): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('المستخدم غير مصادق عليه'));
    }
    return this.http
      .post<void>(`${environment.apiUrl}Notification/enableNotification/${trainId}`, {}, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.authService.getToken()}`
        })
      })
      .pipe(
        tap(() => {
          this.joinTrainGroup(trainId);
          this.fetchNotifications();
        })
      );
  }

  disableNotification(trainId: number): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('المستخدم غير مصادق عليه'));
    }
    return this.http
      .post<void>(`${environment.apiUrl}Notification/disableNotification/${trainId}`, {}, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.authService.getToken()}`
        })
      })
      .pipe(
        tap(() => this.leaveTrainGroup(trainId))
      );
  }

  isNotificationEnabled(trainId: number): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('المستخدم غير مصادق عليه'));
    }
    return this.http.get<boolean>(`${environment.apiUrl}Notification/isNotificationEnabled/${trainId}`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`
      })
    });
  }
}