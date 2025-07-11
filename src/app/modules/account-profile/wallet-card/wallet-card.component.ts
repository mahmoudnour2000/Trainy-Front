import { UserService, paymentMethod } from '../../../core/services/user.service';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Add this import

@Component({
  selector: 'app-wallet-card',
  standalone: false,
  templateUrl: './wallet-card.component.html',
  styleUrls: ['./wallet-card.component.css']
})
export class WalletCardComponent {
  balance: number | undefined;
  lastUpdatedAt: string | undefined;
  showModal: boolean = false;
  modalType: 'deposit' | 'withdraw' = 'deposit';
  amount: number = 0;
  accountNumber: string = '';
  selectedPaymentMethod: paymentMethod = paymentMethod.PayPal;
  paymentMethods = [
    { id: paymentMethod.Stripe, name: 'Stripe' },
    { id: paymentMethod.PayPal, name: 'PayPal' },
    { id: paymentMethod.VodafoneCash, name: 'Vodafone Cash' },
    { id: paymentMethod.EtisalatCash, name: 'Etisalat Cash' }
  ];
  response$: Observable<any> | null = null;
  errorMessage: string | null = null;
  isSubmitting: boolean = false;

  constructor(private userService: UserService) {}

 ngOnInit(): void {
    this.userService.getUserBalance().subscribe({
      next: (res) => {
        this.balance = res.balance;
        this.lastUpdatedAt = res.lastUpdatedAt;
      },
      error: () => {
        this.balance = 0;
        this.lastUpdatedAt = undefined;
      }
    });
  }

  toggleModal(type: 'deposit' | 'withdraw') {
    this.modalType = type;
    this.amount = 0;
    this.accountNumber = '';
    this.errorMessage = null;
    this.showModal = true;
  }

  onDeposit() {
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
        this.showModal = false;
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Deposit error:', err);
        this.errorMessage = `حدث خطأ: ${err.error?.message || 'فشل الإيداع'}`;
      }
    });
  }

  onWithdraw() {
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
        console.log('Withdraw response:', response);
        alert(response.message);
        this.showModal = false;
      },
      error: (err) => {
        console.error('Withdraw error:', err);
        this.errorMessage = `حدث خطأ: ${err.error?.message || 'فشل السحب'}`;
      }
    });
  }

  closeModal() {
    this.showModal = false;
  }
}