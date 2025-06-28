// src/app/modules/account-profile/account-profile-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AuthGuard } from '../../core/guards/auth.guard'; // تأكد من مسار الـ AuthGuard
const routes: Routes = [
  {
    path: '', 
    component: UserProfileComponent ,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountProfileRoutingModule { }