// src/app/modules/account-profile/personal-info/personal-info.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { User } from '../../../core/models/user';
import { Governorate, City, governorates } from '../../../core/models/governorates-cities';

@Component({
  selector: 'app-personal-info',
  standalone: false,
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.css']
})
export class PersonalInfoComponent implements OnChanges {
  @Input() user: User | null = null;
  @Input() editMode: boolean = false;
  @Output() updateUser = new EventEmitter<Partial<User>>();
  @Output() cancelEdit = new EventEmitter<void>();

  editedUser: Partial<User> = {};
  governorates: Governorate[] = governorates; // استيراد قائمة المحافظات
  cities: City[] = []; // قائمة المدن بناءً على المحافظة المختارة

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.editedUser = { ...this.user }; // نسخ بيانات المستخدم
      this.onGovernorateChange(); // تحديث قائمة المدن بناءً على المحافظة الحالية
    }
  }

  onGovernorateChange(): void {
    const selectedGovernorate = this.governorates.find(
      gov => gov.id === this.editedUser.Governorate
    );
    this.cities = selectedGovernorate ? selectedGovernorate.cities : [];
    this.editedUser.City = ''; // إعادة تعيين المدينة عند تغيير المحافظة
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.updateUser.emit(this.editedUser);
      this.editMode = false; // إغلاق وضع التعديل
    }
  }

  onCancel(): void {
    this.cancelEdit.emit();
    this.editedUser = { ...this.user || {} }; // إعادة تعيين البيانات
    this.onGovernorateChange(); // إعادة تحميل المدن
  }

  isFormValid(): boolean {
    return !!(this.editedUser.Name && this.editedUser.Email && this.editedUser.Governorate && this.editedUser.City);
  }
}