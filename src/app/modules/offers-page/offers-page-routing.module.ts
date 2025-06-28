import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OffersPageComponent } from './offers-page.component';
import { AddOfferComponent } from './components/add-offer/add-offer.component';
import { AuthGuard } from '../../core/guards/auth.guard'; // تأكد من مسار الـ AuthGuard
const routes: Routes = [
  {
    path: '',
    component: OffersPageComponent,
        canActivate: [AuthGuard]
    
  },
  {
    path: 'add-offer',
    component: AddOfferComponent,
        canActivate: [AuthGuard]
    
  },
  {
    path: 'add-offer/:id',
    component: AddOfferComponent,
        canActivate: [AuthGuard]
    
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OffersPageRoutingModule { }
