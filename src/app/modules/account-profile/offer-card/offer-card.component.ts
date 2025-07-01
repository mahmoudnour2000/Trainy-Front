import { Component, Input } from '@angular/core';
import { Offer } from '../../../core/models/user';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-offer-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './offer-card.component.html',
  styleUrls: ['./offer-card.component.css']
})
export class OfferCardComponent {
  @Input() offer: Offer | null = null;
}
