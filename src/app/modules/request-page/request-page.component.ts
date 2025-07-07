import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestDetailsComponent } from './components/request-details/request-details.component';
import { RequestsContainerComponent } from './components/requests-container/requests-container.component';
import { OfferDetailsComponent } from './components/offer-details/offer-details.component';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestService } from '../../core/services/request.service';
import { Subscription } from 'rxjs';
import { OfferService, Offer } from '../../core/services/offer.service';
import { AuthService } from '../../core/services/auth.service';
import { VerificationService, CombinedVerificationStatus } from '../../core/services/verification.service';

@Component({
  selector: 'app-request-page',
  standalone: true,
  imports: [
    CommonModule,
    RequestDetailsComponent,
    RequestsContainerComponent,
    OfferDetailsComponent
  ],
  templateUrl: './request-page.component.html',
  styleUrls: ['./request-page.component.css']
})
export class RequestPageComponent implements OnInit, OnDestroy {
  offer: Offer | null = null;
  offerId: number = 0; // Initialize with a default value
  errorMessage: string | null = null;
  isLoading: boolean = false;
  isCourierVerified: boolean = false;
  
  private subscription: Subscription = new Subscription();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService,
    private offerService: OfferService,
    public authService: AuthService,
    private verificationService: VerificationService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    
    // Get verification status
    this.subscription.add(
      this.verificationService.verificationStatus$.subscribe((status: CombinedVerificationStatus) => {
        this.isCourierVerified = status.courierStatus === 'Accepted';
      })
    );
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.offerId = +id;
      this.loadOfferDetails();
    } else {
      this.errorMessage = 'No offer ID provided';
    }
  }
  
  // Check if the current user is the owner of the offer
  isOfferOwner(): boolean {
    if (!this.offer || !this.authService.isAuthenticated()) {
      return false;
    }
    
    const currentUserId = this.authService.getUserId();
    return currentUserId === this.offer.senderId;
  }
  
  // Check if the user is a verified courier
  isVerifiedCourier(): boolean {
    return this.authService.isCourier() && this.isCourierVerified;
  }
  
  // Navigate to login page with return URL
  navigateToLogin(): void {
    this.router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: this.router.url } 
    });
  }
  
  // Navigate to verification page
  navigateToVerification(): void {
    this.router.navigate(['/verification'], { 
      queryParams: { 
        roleType: 'courier',
        returnUrl: this.router.url 
      } 
    });
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  loadOfferDetails(): void {
    this.offerService.getOfferById(this.offerId).subscribe({
      next: (offerData) => {
        this.offer = offerData;
        this.loadRequestsCount();
      },
      error: (error) => {
        console.error('Error loading offer details:', error);
        this.errorMessage = 'Failed to load offer details';
      }
    });
  }
  
  loadRequestsCount(): void {
    if (!this.offer) return;
    
    this.requestService.getRequestsForOffer(this.offer.id).subscribe({
      next: (response) => {
        // Update the requestsCount property with the total number of requests
        if (this.offer) {
          this.offer.requestsCount = response.totalCount;
        }
      },
      error: (error) => {
        console.error(`Error loading requests for offer ${this.offer?.id}:`, error);
      }
    });
  }
} 