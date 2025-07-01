import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OffersPageComponent } from './offers-page.component';
import { AddOfferComponent } from './components/add-offer/add-offer.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { VerificationGuard } from '../../core/guards/verification.guard';

const routes: Routes = [
  {
    path: '',
    component: OffersPageComponent
  },
  {
    path: 'add-offer',
    component: AddOfferComponent,
    canActivate: [AuthGuard, VerificationGuard],
    data: { requiredRole: 'sender' }
  },
  {
    path: 'add-offer/:id',
    component: AddOfferComponent,
    canActivate: [AuthGuard, VerificationGuard],
    data: { requiredRole: 'sender' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OffersPageRoutingModule { }
