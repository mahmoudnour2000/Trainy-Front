import { Component, Input } from '@angular/core';
import { Offer, Request } from '../../../core/models/user';
import { CommonModule } from '@angular/common';
import { OfferCardComponent } from '../offer-card/offer-card.component';
import { RequestCardComponent } from '../request-card/request-card.component';
@Component({
  selector: 'app-profile-tabs',
  standalone: false,
  templateUrl: './profile-tabs.component.html',
  styleUrls: ['./profile-tabs.component.css']
})
export class ProfileTabsComponent {
  @Input() offers: Offer[] = [];
  @Input() requests: Request[] = [];
  activeTab: 'offers' | 'requests' = 'offers';
}