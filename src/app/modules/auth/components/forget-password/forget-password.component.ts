import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  standalone:false,
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.css'
})

export class ForgotPasswordComponent {
  Email: string = '';
  isLoading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' | '' = '';


  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.Email) {
      this.showMessage('يرجى إدخال البريد الإلكتروني', 'error');
      return;
    }

    if (!this.isValidEmail(this.Email)) {
      this.showMessage('يرجى إدخال بريد إلكتروني صحيح', 'error');
      return;
    }

    this.isLoading = true;
    this.message = '';

    const resetData = {
      Email: this.Email
    };

    this.authService.ForgetPassword(this.Email).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.showMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني', 'success');
        this.Email = '';
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 'حدث خطاء في استعادة كلمة المرور';
        this.showMessage(errorMessage, 'error');
      }
    });

  }

  private isValidEmail(Email: string): boolean {
    const EmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return EmailRegex.test(Email);
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;
    
    // إخفاء الرسالة بعد 5 ثواني
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 5000);
  }

  goBackToLogin() {
    this.router.navigate(['auth/login']);
  }
}
