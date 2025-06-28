import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { OffersPageComponent } from './offers-page.component';
import { FilterAndContainerComponent } from './components/filter-and-container/filter-and-container.component';
import { OrderCardComponent } from './components/order-card/order-card.component';
import { AddOfferComponent } from './components/add-offer/add-offer.component';
import { OffersPageRoutingModule } from './offers-page-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    OffersPageRoutingModule,
    OffersPageComponent,
    FilterAndContainerComponent,
    OrderCardComponent,
    AddOfferComponent
  ],
  exports: [
    OffersPageComponent
  ]
})
export class OffersPageModule { }
