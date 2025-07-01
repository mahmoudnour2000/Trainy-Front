import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RequestPageComponent } from './request-page.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { VerificationGuard } from '../../core/guards/verification.guard';

const routes: Routes = [
  { path: '', component: RequestPageComponent },
  { path: 'offer/:id', component: RequestPageComponent, canActivate: [AuthGuard, VerificationGuard], data: { requiredRole: 'courier' } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RequestPageRoutingModule { } 