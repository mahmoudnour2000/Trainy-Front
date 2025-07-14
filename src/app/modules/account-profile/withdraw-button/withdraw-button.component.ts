import { Component } from '@angular/core';
import { UserService, paymentMethod } from '../../../core/services/user.service';
import { Observable } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-withdraw-button',
  templateUrl: './withdraw-button.component.html',
  styleUrls: ['./withdraw-button.component.css']
})
export class WithdrawButtonComponent {
  amount: number = 0;
  accountNumber: string = '';
  selectedPaymentMethod: paymentMethod = paymentMethod.PayPal;
  paymentMethods = [
    { id: paymentMethod.PayPal, name: 'PayPal' },
    { id: paymentMethod.VodafoneCash, name: 'Vodafone Cash' },
    { id: paymentMethod.EtisalatCash, name: 'Etisalat Cash' }
  ];
  response$: Observable<{ message: string }> | null = null;
  errorMessage: string | null = null;

  constructor(private userService: UserService) {}

  onWithdraw(): void {
    // console.log('Withdraw initiated with amount:', this.amount, 'payment method:', this.selectedPaymentMethod, 'account number:', this.accountNumber);
    
    if (!this.amount || this.amount <= 0) {
      this.errorMessage = 'المبلغ يجب أن يكون أكبر من صفر.';
      return;
    }
    if (this.amount > 10000) {
      this.errorMessage = 'المبلغ يجب أن يكون أقل من 10,000 جنيه.';
      return;
    }
    if (!this.accountNumber || this.accountNumber.length < 10) {
      this.errorMessage = 'رقم الحساب يجب أن يكون 10 أرقام على الأقل.';
      return;
    }

    this.errorMessage = null;
    this.response$ = this.userService.withdraw(this.amount, this.selectedPaymentMethod, this.accountNumber);
    this.response$.subscribe({
      next: (response) => {
        this.errorMessage = null;
        // console.log('Withdraw response:', response);
        alert(response.message);
      },
      error: (err) => {
        console.error('Withdraw error:', err);
        this.errorMessage = `حدث خطأ: ${err.error?.message || 'فشل السحب'}`;
      }
    });
  }
}