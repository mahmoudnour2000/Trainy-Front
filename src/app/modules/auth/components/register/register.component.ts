import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Gender, IUserRegister } from '../../../../core/models/auth';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthResponse } from '../../../../core/models/auth';
import { Router } from '@angular/router';
import { Governorate, City, governorates } from '../../../../core/models/governorates-cities';
@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  
  // Loading state
  isLoading: boolean = false;
  
  // Error message
  errorMessage: string = '';
  successMessage: string = ''; // لرسالة النجاح

  user : IUserRegister = {
    UserName: '',
    Email: '',
    Password: '',
    ConfirmPassword: '',
    Governorate: '',
    City: '',
    PhoneNumber: '',
    Gender: Gender.Male,
    DateOfBirth: ''
  };
  governorates: Governorate[] = governorates; // قائمة المحافظات
  cities: City[] = [];
  constructor(
    private accountSrv:AuthService,private router: Router) { }
    onSubmit() {
      this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
      if (this.user.Password !== this.user.ConfirmPassword) {
        console.error('Passwords do not match');
        return;
      }
      this.accountSrv.Register(this.user).subscribe({
        next: (res: AuthResponse) => {
       this.isLoading = false;
        this.successMessage = 'تم إنشاء الحساب بنجاح!';
        // تأخير الانتقال لصفحة تسجيل الدخول لمدة 3 ثوانٍ
        setTimeout(() => {
          this.router.navigate(['auth/login']);
        }, 3000);
          this.router.navigate(['auth/login']);
          },
        error: (err: any) => {
          this.isLoading = false;
        // استخراج الرسالة والأخطاء من استجابة الخادم
        this.errorMessage = err.error.message || 'حدث خطأ أثناء التسجيل';
        if (err.error.errors && err.error.errors.length > 0) {
          this.errorMessage += ': ' + err.error.errors.join('، ');
        }
          console.error('Error:', err);
        }
      });
    }
  ngOnInit() {
  }

  onGovernorateChange() {
    const selectedGovernorate = this.governorates.find(
      gov => gov.id === this.user.Governorate
    );
    this.cities = selectedGovernorate ? selectedGovernorate.cities : [];
    this.user.City = ''; // إعادة تعيين المدينة عند تغيير المحافظة
  }
 togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
