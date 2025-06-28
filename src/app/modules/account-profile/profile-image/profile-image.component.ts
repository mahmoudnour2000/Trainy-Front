// src/app/modules/account-profile/profile-image/profile-image.component.ts
import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { environment } from '../../../../environments/environment'; // استيراد environment
import { UserService } from '../../../core/services/user.service';
@Component({
  standalone:false,
  selector: 'app-profile-image',
  templateUrl: './profile-image.component.html',
  styleUrls: ['./profile-image.component.css']
})
export class ProfileImageComponent {
  @Input() imageUrl: string | null = null;
  @Output() imageChange = new EventEmitter<File>();

    profileImageFullUrl: string = ''; // هنا هنخزن لينك الصورة

  constructor(private userService: UserService) {}
  ngOnInit(): void {
  this.userService.getProfileImage().subscribe({
    next: (res) => {
      this.profileImageFullUrl = res.imageUrl || 'default-image-url';
    },
    error: () => {
      this.profileImageFullUrl = 'default-image-url';
    }
  });
}



onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];

    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      alert('صيغة الملف غير مدعومة. الرجاء رفع ملف بصيغة PNG، JPG، JPEG، أو GIF.');
      return;
    }

    // ارفع الصورة عبر السيرفيس
    this.userService.uploadProfileImage(file).subscribe({
      next: (res) => {
        // حدث رابط الصورة
        this.profileImageFullUrl = `${environment.apiUrl}${res.imageUrl}`;
        alert('تم تحديث الصورة بنجاح!');
      },
      error: (err) => {
        console.error('خطأ أثناء رفع الصورة:', err);
        alert('حدث خطأ أثناء رفع الصورة. حاول مرة أخرى.');
      }
    });
  }
}

}