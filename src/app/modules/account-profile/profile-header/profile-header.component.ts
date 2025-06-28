// src/app/modules/account-profile/profile-header/profile-header.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../../core/models/user';

@Component({
  standalone:false,
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  styleUrls: ['./profile-header.component.css']
})
export class ProfileHeaderComponent {
  @Input() user: User | null = null;
  
  @Output() editPersonalInfo = new EventEmitter<void>();
  @Output() updateImage = new EventEmitter<File>();

  onImageChange(file: File): void {
    this.updateImage.emit(file);
  }
}