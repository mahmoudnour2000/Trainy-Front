
import { LoginComponent } from "./components/login/login.component";  
import { RegisterComponent } from "./components/register/register.component";  
import { NgModule } from '@angular/core';  
import { Routes, RouterModule } from '@angular/router';
import { ForgotPasswordComponent } from "./components/forget-password/forget-password.component";
import { ResetPasswordComponent } from "./components/reset-password/reset-password.component";  
  
const routes: Routes = [  
  { path: 'login', component: LoginComponent },  
  { path: 'register', component: RegisterComponent }  ,
  { path: 'forget-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '**', redirectTo: '/trains' }
];  
  
@NgModule({  
  imports: [RouterModule.forChild(routes)],  
  exports: [RouterModule]  
})  
export class AuthRoutingModule { }