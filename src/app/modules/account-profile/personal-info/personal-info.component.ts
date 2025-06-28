import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { User } from '../../../core/models/user';

@Component({
  standalone: false,
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.css']
})
export class PersonalInfoComponent implements OnChanges {
  @Input() user: User | null = null;
  @Input() editMode: boolean = false;
  @Output() updateUser = new EventEmitter<Partial<User>>();
  @Output() cancelEdit = new EventEmitter<void>();

  editedUser: Partial<User> = {};

  governorates: string[] = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.editedUser = { ...this.user }; // Reset editedUser with the latest user data
    }
  }

  onSubmit(): void {
    this.updateUser.emit(this.editedUser);
    this.editMode = false; // This should be handled by the parent, so remove or adjust
  }

  onCancel(): void {
    this.cancelEdit.emit();
    this.editedUser = { ...this.user || {} }; // Reset to original user data
  }
  isFormValid(): boolean {
   return !!(this.editedUser.Name && this.editedUser.Email && this.editedUser.Governorate && this.editedUser.City);
}
}