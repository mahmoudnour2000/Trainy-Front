import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.css']
})
export class OrderCardComponent implements OnInit {
  @Input() order: any;
  @Output() deleteOrder = new EventEmitter<number>();
  
  currentUserRole: string = '';
  isOrderOwner: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Temporarily set user as owner and courier
    this.currentUserRole = 'Courier';
    this.isOrderOwner = true;
  }

  private getCurrentUser(): any {
    // Placeholder - temporarily returning default values
    return { id: 'user123', role: 'Courier' };
  }

  onSendRequest(): void {
    console.log('Send request clicked');
    
    // Directly navigate to the order details page to send a request
    this.router.navigate(['/offers/order', this.order.id]);
  }

  onEdit(): void {
    console.log('Edit clicked');
    // Navigate directly to the edit page
    window.location.href = `/offers/add-offer/${this.order.id}`;
  }

  onDelete(): void {
    console.log('Delete clicked');
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      this.deleteOrder.emit(this.order.id);
    }
  }

  canEditOrder(): boolean {
    // Temporarily always return true
    return true;
  }

  canDeleteOrder(): boolean {
    // Temporarily always return true
    return true;
  }

  canSendRequest(): boolean {
    // Temporarily always return true
    return true;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
