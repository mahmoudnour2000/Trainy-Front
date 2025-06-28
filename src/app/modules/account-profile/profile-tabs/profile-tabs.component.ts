// src/app/modules/account-profile/profile-tabs/profile-tabs.component.ts
import { Component, Input } from '@angular/core';
import { Offer, Request } from '../../../core/models/user';

@Component({
    standalone:false,
  selector: 'app-profile-tabs',
  templateUrl: './profile-tabs.component.html',
  styleUrls: ['./profile-tabs.component.css']
})
export class ProfileTabsComponent {
  @Input() offers: Offer[] = [];
  @Input() requests: Request[] = [];
}