import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  standalone:false,
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  email: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' | 'warning' | '' = '';
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';
  passwordStrengthWidth: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';
      console.log('Token:', this.token); // للتصحيح
      console.log('Email:', this.email); // للتصحيح

      if (!this.token || !this.email) {
        this.showMessage('رابط استعادة كلمة المرور غير صحيح أو منتهي الصلاحية', 'error');
      }
    });
  }

  checkPasswordStrength() {
    if (!this.newPassword) {
      this.passwordStrength = 'weak';
      this.passwordStrengthWidth = 0;
      return;
    }

    let score = 0;
    const password = this.newPassword;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) {
      this.passwordStrength = 'weak';
      this.passwordStrengthWidth = 33;
    } else if (score <= 4) {
      this.passwordStrength = 'medium';
      this.passwordStrengthWidth = 66;
    } else {
      this.passwordStrength = 'strong';
      this.passwordStrengthWidth = 100;
    }
  }

  resetPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      this.showMessage('يرجى ملء جميع الحقول', 'error');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showMessage('كلمات المرور غير متطابقة', 'error');
      return;
    }

    if (this.newPassword.length < 6) {
      this.showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
      return;
    }

    if (this.passwordStrength === 'weak') {
      this.showMessage('كلمة المرور ضعيفة. يرجى اختيار كلمة مرور أقوى', 'warning');
      return;
    }

    if (!this.email || !this.token) {
      this.showMessage('رابط استعادة كلمة المرور غير صحيح أو منتهي الصلاحية', 'error');
      return;
    }

    this.isLoading = true;
    this.message = '';

    const resetData = {
      email: this.email,
      token: this.token,
      newPassword: this.newPassword
    };

    this.authService.resetPassword(resetData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.showMessage('تم تغيير كلمة المرور بنجاح! جاري التوجيه لصفحة تسجيل الدخول...', 'success');

        setTimeout(() => {
          this.router.navigate(['auth/login']);
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 'حدث خطأ أثناء تغيير كلمة المرور';
        this.showMessage(errorMessage, 'error');
        console.error('API Error:', error); // للتصحيح
      }
    });
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning') {
    this.message = message;
    this.messageType = type;

    if (type !== 'success') {
      setTimeout(() => {
        this.message = '';
        this.messageType = '';
      }, 5000);
    }
  }

  goBackToLogin() {
    this.router.navigate(['auth/login']);
  }

  goToForgotPassword() {
    this.router.navigate(['auth/forget-password']);
  }
}