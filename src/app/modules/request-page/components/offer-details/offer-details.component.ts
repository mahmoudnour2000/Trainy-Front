import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
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
export class OfferDetailsComponent implements OnInit, OnDestroy, OnChanges {
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
    // Only fetch from API if offer is not provided by parent
    if (this.offer) {
      this.requestService.setOfferDetails(this.offer);
    } else {
      this.isLoading = true;
      this.subscription.add(
        this.route.params.pipe(
          switchMap(params => {
            const offerId = params['id'];
            if (!offerId) {
              return of(null);
            }
            return this.offerService.getOfferById(+offerId);
          })
        ).subscribe({
          next: (offer) => {
            this.isLoading = false;
            if (offer) {
              const offerAny = offer as any;
              this.offer = {
                ...offer,
                description: offer.description || offerAny.Description,
                senderName: offer.senderName || offerAny.SenderName,
                senderImage: offer.senderImage || offerAny.SenderImage,
                fromStationName: offer.fromStationName || offerAny.PickupStationName,
                toStationName: offer.toStationName || offerAny.DropoffStationName,
                weight: offer.weight || offerAny.Weight,
                price: offer.price || offerAny.Price,
                createdAt: offer.createdAt || offerAny.CreatedAt,
                isBreakable: offer.isBreakable ?? offerAny.IsBreakable,
                requestsCount: offer.requestsCount ?? offerAny.RequestsCount,
                image: offer.image || offerAny.Picture,
                category: offer.category || offerAny.Category
              };
              

              this.requestService.setOfferDetails(this.offer);
            } else {
              this.error = 'لم يتم العثور على تفاصيل العرض';
            }
          },
          error: (err) => {
            this.isLoading = false;
            this.error = 'حدث خطأ أثناء تحميل تفاصيل العرض';
          }
        })
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['offer'] && changes['offer'].currentValue) {
      const offer = changes['offer'].currentValue;
      const offerAny = offer as any;
      this.offer = {
        ...offer,
        senderName: offer.senderName || offerAny.SenderName,
        senderImage: offer.senderImage || offerAny.SenderImage,
        fromStationName: offer.fromStationName || offerAny.PickupStationName,
        toStationName: offer.toStationName || offerAny.DropoffStationName,
        weight: offer.weight || offerAny.Weight,
        price: offer.price || offerAny.Price,
        createdAt: offer.createdAt || offerAny.CreatedAt,
        isBreakable: offer.isBreakable ?? offerAny.IsBreakable,
        requestsCount: offer.requestsCount ?? offerAny.RequestsCount,
        image: offer.image || offerAny.Picture,
        category: offer.category || offerAny.Category
      };
      

      this.isLoading = false;
      this.error = null;
      this.requestService.setOfferDetails(this.offer);
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

  getCategoryDisplayName(category: string): string {
    if (!category) return 'غير محدد';
    
    const categoryMap: { [key: string]: string } = {
      'Electronics': 'إلكترونيات',
      'Clothing': 'ملابس',
      'Food': 'طعام',
      'Furniture': 'أثاث',
      'Documents': 'مستندات',
      'Other': 'أخرى',
      'electronics': 'إلكترونيات',
      'clothing': 'ملابس',
      'food': 'طعام',
      'furniture': 'أثاث',
      'documents': 'مستندات',
      'other': 'أخرى'
    };
    
    return categoryMap[category] || category;
  }
} 