import { Component, OnInit } from '@angular/core';
import { Gender, IUserRegister } from '../../../../core/models/auth';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthResponse } from '../../../../core/models/auth';
import { Router } from '@angular/router';
import { Governorate, City, governorates } from '../../../../core/models/governorates-cities';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  errorMessages: string[] = []; // تغيير إلى قائمة لتخزين رسائل الخطأ
  successMessage: string = '';

  user: IUserRegister = {
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
  governorates: Governorate[] = governorates;
  cities: City[] = [];

  constructor(
    private accountSrv: AuthService,
    private router: Router
  ) {}

  ngOnInit() {}

  onSubmit() {
    if (!this.user.UserName || this.user.UserName.length < 10) {
      this.errorMessages = ['اسم المستخدم قصير جدًا، يجب أن يحتوي على 10 أحرف على الأقل'];
      return;
    }
    if (!this.user.Password || this.user.Password.length < 8) {
  this.errorMessages = ['كلمة المرور قصيرة جدًا، يجب أن تحتوي على 8 أحرف على الأقل'];
  return;
}
    // التحقق من تطابق كلمتي المرور قبل الإرسال
    if (this.user.Password !== this.user.ConfirmPassword) {
      this.errorMessages = ['كلمتا المرور غير متطابقتان'];
      return;
    }

    this.isLoading = true;
    this.errorMessages = [];
    this.successMessage = '';

    this.accountSrv.Register(this.user).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading = false;
        this.successMessage = 'تم إنشاء الحساب بنجاح!';
        setTimeout(() => {
          this.router.navigate(['auth/login']);
        }, 3000);
      },
      error: (err: any) => {
        this.isLoading = false;
        // استخراج رسائل الخطأ من الاستجابة
        if (err.error && err.error.errors && Array.isArray(err.error.errors)) {
          this.errorMessages = err.error.errors;
        } else {
          this.errorMessages = ['حدث خطأ أثناء التسجيل. من فضلك حاول مرة أخرى.'];
        }
        console.error('Registration error:', err);
      }
    });
  }

  onGovernorateChange() {
    const selectedGovernorate = this.governorates.find(
      gov => gov.id === this.user.Governorate
    );
    this.cities = selectedGovernorate ? selectedGovernorate.cities : [];
    this.user.City = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}