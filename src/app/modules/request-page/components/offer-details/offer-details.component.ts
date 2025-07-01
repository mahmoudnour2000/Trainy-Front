import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RequestService } from '../../../../core/services/request.service';
import { OfferService, Offer } from '../../../../core/services/offer.service';
import { Subscription, take, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-offer-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offer-details.component.html',
  styleUrls: ['./offer-details.component.css']
})
export class OfferDetailsComponent implements OnInit, OnDestroy {
  @Input() offer: Offer | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  private subscription: Subscription = new Subscription();
  
  constructor(
    private requestService: RequestService,
    private offerService: OfferService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // First check if offer was provided via Input
    if (this.offer) {
      console.log('Offer provided via Input:', this.offer);
      // Store offer in the service for other components
      this.requestService.setOfferDetails(this.offer);
    } else {
      // Otherwise, get from API based on route parameters
      this.isLoading = true;
      this.subscription.add(
        this.route.params.pipe(
          switchMap(params => {
            const offerId = params['id'];
            if (!offerId) {
              console.error('No offer ID provided in route params');
              return of(null);
            }
            return this.offerService.getOfferById(+offerId);
          })
        ).subscribe({
          next: (offer) => {
            this.isLoading = false;
            if (offer) {
              this.offer = offer;
              // Store offer in the service for other components
              this.requestService.setOfferDetails(offer);
            } else {
              this.error = 'لم يتم العثور على تفاصيل العرض';
            }
          },
          error: (err) => {
            console.error('Error loading offer details:', err);
            this.isLoading = false;
            this.error = 'حدث خطأ أثناء تحميل تفاصيل العرض';
          }
        })
      );
    }
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  formatDate(dateString: string | Date): string {
    if (!dateString) return '';
    
    // Convert to Date object if it's a string
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Arabic month names
    const arabicMonths: { [key: number]: string } = {
      0: "يناير", 1: "فبراير", 2: "مارس", 3: "أبريل", 4: "مايو", 5: "يونيو",
      6: "يوليو", 7: "أغسطس", 8: "سبتمبر", 9: "أكتوبر", 10: "نوفمبر", 11: "ديسمبر"
    };
    
    // Convert numbers to Arabic numerals
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const arabicDay = date.getDate().toString().split('').map(d => arabicNumerals[parseInt(d)]).join('');
    const arabicYear = date.getFullYear().toString().split('').map(d => arabicNumerals[parseInt(d)]).join('');
    
    return `${arabicDay} ${arabicMonths[date.getMonth()]} ${arabicYear}`;
  }
} 