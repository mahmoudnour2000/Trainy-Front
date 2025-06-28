import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IUserLogin } from '../../../../core/models/auth';
import { AuthService } from '../../../../core/services/auth.service';
import { CookieService } from 'ngx-cookie-service';

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
    private router: Router,
    private cookieService: CookieService 
  ) {}

  ngOnInit(): void {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.user.LoginMethod || !this.user.Password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }
        this.errorMessage = ''; 
        this.isLoading = true ;


    this.accountSrv.Login(this.user).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading = false;
        localStorage.setItem('token', res.token);

        if (res.token) {
          this.cookieService.set('TOKEN', res.token, 1, '/');
        } else {
          console.warn('User data missing in login response');
        }

        console.log('Login successful', 'Token:', res.token);
        this.router.navigate(['/userProfile']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}

interface AuthResponse {
  token: string;
  // user: {
  //   id: string;
  //   email: string;
  //   name: string;
  //   role: string;
  // };
}
