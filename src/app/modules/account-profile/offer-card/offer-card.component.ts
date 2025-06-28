// src/app/modules/account-profile/offer-card/offer-card.component.ts
import { Component, Input } from '@angular/core';
import { Offer } from '../../../core/models/user';

@Component({
    standalone:false,
  selector: 'app-offer-card',
  templateUrl: './offer-card.component.html',
  styleUrls: ['./offer-card.component.css']
})
export class OfferCardComponent {
  @Input() offer: Offer | null = null;
}