// src/app/modules/account-profile/request-card/request-card.component.ts
import { Component, Input } from '@angular/core';
import { Request } from '../../../core/models/user';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    standalone:true,
  selector: 'app-request-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './request-card.component.html',
  styleUrls: ['./request-card.component.css']
})
export class RequestCardComponent {
  @Input() request: Request | null = null;
}

