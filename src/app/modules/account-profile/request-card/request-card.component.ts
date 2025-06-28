// src/app/modules/account-profile/request-card/request-card.component.ts
import { Component, Input } from '@angular/core';
import { Request } from '../../../core/models/user';

@Component({
    standalone:false,

  selector: 'app-request-card',
  templateUrl: './request-card.component.html',
  styleUrls: ['./request-card.component.css']
})
export class RequestCardComponent {
  @Input() request: Request | null = null;
}

