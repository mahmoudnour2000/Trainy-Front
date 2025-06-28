import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderCardComponent } from '../order-card/order-card.component';

@Component({
  selector: 'app-order-cards-container',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderCardComponent],
  templateUrl: './order-cards-container.component.html',
  styleUrls: ['./order-cards-container.component.css']
})
export class OrderCardsContainerComponent {
  @Input() orders: any[] = [];
  @Output() deleteOrder = new EventEmitter<number>();

  onDeleteOrder(orderId: number): void {
    this.deleteOrder.emit(orderId);
  }
} 