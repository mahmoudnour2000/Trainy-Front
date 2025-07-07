import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { Offer, PaymentMethod } from '../../../core/models/user';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-offer-details',
   standalone: false,
  templateUrl: './offer-details.component.html',
  styleUrls: ['./offer-details.component.css']
})
export class OfferDetailsComponent implements OnInit {
  offer: Offer | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const offerId = this.route.snapshot.paramMap.get('id');
    if (offerId && !isNaN(+offerId)) {
      this.loadOfferDetails(+offerId);
    } else {
      this.errorMessage = 'معرف العرض غير صالح';
    }
  }

  loadOfferDetails(offerId: number): void {
    this.isLoading = true;
    this.userService.getOfferById(offerId).subscribe({
      next: (response) => {
        if ('message' in response) {
          this.errorMessage = response.message || 'العرض غير موجود';
          this.offer = null;
        } else {
          this.offer = response;
          this.errorMessage = null;
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'حدث خطأ أثناء جلب تفاصيل العرض';
        this.offer = null;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  getPaymentMethodLabel(paymentMethod: PaymentMethod): string {
    switch (paymentMethod) {
      case PaymentMethod.EtisalatCash:
        return 'اتصالات كاش';
      case PaymentMethod.VodafoneCash:
        return 'فودافون كاش';
      case PaymentMethod.PayPal:
        return 'باي بال';
      case PaymentMethod.Stripe:
        return 'سترايب';
      case PaymentMethod.AccountNumber:
        return 'رقم الحساب';
      default:
        return 'غير معروف';
    }
  }

  goBack(): void {
    this.router.navigate(['/userProfile']);
  }
}