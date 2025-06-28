import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AddOfferComponent } from './components/add-offer/add-offer.component';

@Component({
  selector: 'app-add-offer-page',
  standalone: true,
  imports: [CommonModule, RouterModule, AddOfferComponent],
  template: `<app-add-offer></app-add-offer>`
})
export class AddOfferPageComponent {} 