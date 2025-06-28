import { Component } from '@angular/core';
import { UserService, paymentMethod } from '../../../core/services/user.service';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-deposit-button',
  templateUrl: './deposit-button.component.html',
  styleUrls: ['./deposit-button.component.css']
})
export class DepositButtonComponent {
  amount: number = 0;
  selectedPaymentMethod: paymentMethod = paymentMethod.PayPal;
  paymentMethods = [
    { id: paymentMethod.Stripe, name: 'Stripe' },
    { id: paymentMethod.PayPal, name: 'PayPal' },
    { id: paymentMethod.VodafoneCash, name: 'Vodafone Cash' },
    { id: paymentMethod.EtisalatCash, name: 'Etisalat Cash' }
  ];
  response$: Observable<{ PaymentToken: string, PaymentId: number, PaymentMethod: string }> | null = null;
  errorMessage: string | null = null;
  isSubmitting: boolean = false;

  constructor(private userService: UserService) {}

  onDeposit(): void {
    console.log('Deposit initiated with amount:', this.amount, 'and payment method:', this.selectedPaymentMethod);
    
    if (this.isSubmitting) return;
    if (!this.amount || this.amount <= 0) {
      this.errorMessage = 'المبلغ يجب أن يكون أكبر من صفر.';
      return;
    }
    if (this.amount > 10000) {
      this.errorMessage = 'المبلغ يجب أن يكون أقل من 10,000 جنيه.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.response$ = this.userService.deposit(this.amount, this.selectedPaymentMethod).pipe(take(1));
    this.response$.subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.errorMessage = null;
        console.log('Deposit response:', response);
        if (this.selectedPaymentMethod === paymentMethod.Stripe) {
          alert(`يرجى تأكيد الدفعة باستخدام الـ Client Secret: ${response.PaymentToken}`);
        } else if (this.selectedPaymentMethod === paymentMethod.PayPal) {
          if (response.PaymentToken) {
            window.location.href = response.PaymentToken;
          } else {
            this.errorMessage = 'رابط PayPal غير صالح. حاول مرة أخرى.';
            console.error('Invalid PayPal link:', response.PaymentToken);
          }
        } else {
          alert(`تم بدء عملية الإيداع بنجاح. الرمز: ${response.PaymentToken}`);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Deposit error:', err);
        this.errorMessage = `حدث خطأ: ${err.error?.message || 'فشل الإيداع'}`;
      }
    });
  }
}