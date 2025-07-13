import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IUserLogin } from '../../../../core/models/auth';
import { AuthService } from '../../../../core/services/auth.service';
import { CookieService } from 'ngx-cookie-service';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/user';
import { AuthResponse } from '../../../../core/models/auth';
@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
}) 
export class LoginComponent implements OnInit {
  user: IUserLogin = {
    LoginMethod: '',
    Password: ''
  };

  errorMessage: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;

  constructor(
    private accountSrv: AuthService,
    private UserSrv: UserService,
    private router: Router,
    private cookieService: CookieService
  ) { }

  ngOnInit(): void { }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.user.LoginMethod || !this.user.Password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;


    this.accountSrv.Login(this.user).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading = false;

        if (res.token) {
          this.UserSrv.getUserProfile().subscribe({
            next: (user: User) => {
              this.accountSrv.LoggedUser.next(user);
              console.log('User profile fetched successfully:', user);
              // التحقق من وجود مسار للرجوع إليه
              const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/';
              localStorage.removeItem('redirectAfterLogin'); // حذف المسار بعد استخدامه
              this.router.navigateByUrl(redirectUrl);
            },
            error: (error) => {
              console.error('Error fetching user profile:', error);
              // لو فشل جلب الملف الشخصي، نوجه للصفحة الرئيسية
              this.router.navigate(['/']);
            }
          });
        } else {
          console.warn('User data missing in login response');
          this.errorMessage = 'Login failed: No token received';
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
