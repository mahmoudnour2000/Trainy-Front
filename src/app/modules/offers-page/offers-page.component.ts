import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterAndContainerComponent } from './components/filter-and-container/filter-and-container.component';

@Component({
  selector: 'app-offers-page',
  standalone: true,
  imports: [CommonModule, FilterAndContainerComponent],
  templateUrl: './offers-page.component.html',
  styleUrls: ['./offers-page.component.css']
})
export class OffersPageComponent {
  hasOrders: boolean = true;

  changeOrderStatus(event: { order: any; status: string }): void {
    console.log('Order status changed:', event);
    // Handle the status change at the page level if needed
  }
}
