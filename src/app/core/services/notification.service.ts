import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { Notification } from '../../core/models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection!: HubConnection;
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);
  private hasNewNotification$ = new BehaviorSubject<boolean>(false);
  showSuccessPopup = false;
  successPopupMessage = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.isAuthenticated$().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.initHubConnection();
        this.fetchNotifications();
        this.LoadNotifications();
      }
      else {
        this.stopHubConnection();
        this.notifications$.next([]);
        this.unreadCount$.next(0);
        this.hasNewNotification$.next(false);
      }
    });
  }
  showSuccessToast(message: string) {
    (window as any).lastSuccessToastTimeout && clearTimeout((window as any).lastSuccessToastTimeout);
    this.successPopupMessage = message;
    this.showSuccessPopup = true;
    (window as any).lastSuccessToastTimeout = setTimeout(() => {
      this.showSuccessPopup = false;
    }, 3000);
  }
  private initHubConnection(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.error('لا يوجد توكن متاح لاتصال SignalR');
      return;
    }

    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      return;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}OurtrainTrackingHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect() // إضافة إعادة الاتصال التلقائي
      .build();

    console.log('Initializing SignalR connection...');
    this.hubConnection.on('ReceiveTrainUpdate', (data: any) => {
      console.log('📩 SignalR message received:', data);
      if (!data) {
        console.warn('Received empty data from SignalR');
        return;
      }
      this.showSuccessToast(`${data.Message || 'إشعار جديد'}`);

      // لو جاي فيه Message اعتبريه إشعار
      if (data.Message && data.NotificationTime) {
        const notification: Notification = {
          Id: data.Id || Date.now(),
          Message: data.Message,
          NotificationTime: data.NotificationTime,
          IsRead: false,
          TrainId: data.TrainId,
          UserName: data.UserName || ''
        };
        console.log('📨 إشعار جديد:', notification);
        this.updateNotifications(notification);
        if (!notification.IsRead) {
          this.hasNewNotification$.next(true);
        }

      } else {
        // غير كده، ممكن يكون مجرد تحديث مكان القطار
        console.log('📍 تحديث مكان القطار:', data);
      }
    });


    // التعامل مع إعادة الاتصال
    this.hubConnection.onreconnected(() => {
      console.log('SignalR reconnected at', new Date());
      this.LoadNotifications(); // إعادة تحميل الإشعارات بعد إعادة الاتصال
    });

    this.hubConnection.onclose(err => {
      console.error('SignalR connection closed:', err);
      // محاولة إعادة الاتصال
      setTimeout(() => this.initHubConnection(), 5000);
    });
  }

  joinTrainGroup(trainId: number): void {
    if (!this.authService.isAuthenticated()) {
      console.error('المستخدم غير مصادق عليه');
      return;
    }
    if (this.hubConnection.state !== HubConnectionState.Connected) {
      // console.error('SignalR غير متصل. جاري المحاولة...');
      this.initHubConnection();
    }
    this.hubConnection.invoke('JoinTrainGroup', trainId)
      .then(() => console.log(`Joined train group ${trainId}`))
      .catch(err => console.error('خطأ في الانضمام لمجموعة القطار:', err));
    return;
  }

  leaveTrainGroup(trainId: number): void {
    if (!this.authService.isAuthenticated()) {
      console.error('المستخدم غير مصادق عليه');
      return;
    }
    if (this.hubConnection.state !== HubConnectionState.Connected) {
      console.error('SignalR غير متصل. لا يمكن مغادرة المجموعة.');
      return;
    }
    this.hubConnection.invoke('LeaveTrainGroup', trainId)
      .catch(err => console.error('خطأ في مغادرة مجموعة القطار:', err));
  }

  private stopHubConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => console.log('SignalR disconnected'))
        .catch(err => console.error('Error stopping SignalR:', err));
    }
  }

  private updateNotifications(notification: Notification): void {
    const currentNotifications = this.notifications$.value;
    console.log("Basoom");

    const index = currentNotifications.findIndex(n => n.Id === notification.Id);
    if (index === -1) {
      currentNotifications.unshift(notification);
    } else {
      currentNotifications[index] = notification;
    }
    this.notifications$.next([...currentNotifications]);

    this.updateUnreadCount();
  }

  getAllNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  getHasNewNotification(): Observable<boolean> {
    return this.hasNewNotification$.asObservable();
  }

  resetNewNotification(): void {
    this.hasNewNotification$.next(false);
  }

  markAsRead(notificationId: number): Observable<void> {
    const url = `${environment.apiUrl}Notification/MarkAsRead/${notificationId}`;
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
        if (updatedNotifications.every(n => n.IsRead)) {
          this.hasNewNotification$.next(false);
        }
      })
    );
  }

  fetchNotifications(): void {
    if (!this.authService.isAuthenticated()) {
      console.error('المستخدم غير مصادق عليه');
      this.notifications$.next([]);
      this.unreadCount$.next(0);
      this.hasNewNotification$.next(false);
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
          this.hasNewNotification$.next(notifications.some(n => !n.IsRead));
        },
        error: err => {
          console.error('خطأ في جلب الإشعارات:', err);
          this.notifications$.next([]);
          this.unreadCount$.next(0);
          this.hasNewNotification$.next(false);
        }
      });
  }


  LoadNotifications(): void {
    console.log('---------------------------------------------------------');
    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      console.log('✅ متصل بـ OurtrainTrackingHub');
      this.hubConnection.on('ReceiveTrainUpdate', (notification: Notification) => {
        console.log('📨 إشعار جديد:', notification);
        this.updateNotifications(notification);
        if (!notification.IsRead) {
          this.hasNewNotification$.next(true);
        }
      });
      this.hubConnection.invoke('LoadNotifications').then(
        (notification: any) => {
          console.log('Received notification:', notification);
          // this.updateNotifications(notification);
          // if (!notification.IsRead) {
          //   this.hasNewNotification$.next(true); 
          // }
        }).catch(err => {
          console.error('Error loading notifications:', err)
        });
    }

  }
  private updateUnreadCount(): void {
    const unread = this.notifications$.value.filter(n => !n.IsRead).length;
    console.log('Updated unread count:', unread);
    this.unreadCount$.next(unread);
  }

  // joinTrainGroup(trainId: number): void {
  //   if (!this.authService.isAuthenticated()) {
  //     console.error('المستخدم غير مصادق عليه');
  //     return;
  //   }
  //   this.hubConnection.invoke('JoinTrainGroup', trainId)
  //     .then(() => console.log(`Joined train group ${trainId}`))
  //     .catch(err => console.error('خطأ في الانضمام لمجموعة القطار:', err));
  // }

  // leaveTrainGroup(trainId: number): void {
  //   if (!this.authService.isAuthenticated()) {
  //     console.error('المستخدم غير مصادق عليه');
  //     return;
  //   }
  //   this.hubConnection.invoke('LeaveTrainGroup', trainId)
  //     .catch(err => console.error('خطأ في مغادرة مجموعة القطار:', err));
  // }

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
          // this.fetchNotifications();
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