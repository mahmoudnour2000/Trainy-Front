import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { VerificationService } from '../services/verification.service';

@Injectable({
  providedIn: 'root'
})
export class VerificationGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private verificationService: VerificationService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // First check if user is authenticated
    return this.authService.isAuthenticated$().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          // Redirect to login if not authenticated
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return of(false);
        }
        
        // Check verification status
        return this.verificationService.verificationStatus$.pipe(
          map(status => {
            // Check if user needs to be verified for this route
            const requiresVerification = route.data?.['requiresVerification'];
            const requiredRole = route.data?.['requiredRole']; // 'Sender' or 'Courier'
            
            if (!requiresVerification) {
              // Route doesn't require verification
              return true;
            }
            
            if (requiredRole) {
              // Check specific role verification
              if (requiredRole === 'Sender' && status.senderStatus === 'Accepted') {
                return true;
              }
              if (requiredRole === 'Courier' && status.courierStatus === 'Accepted') {
                return true;
              }
              
              // Role required but not verified - redirect to verification
              this.router.navigate(['/verification'], { 
                queryParams: { returnUrl: state.url, requiredRole: requiredRole } 
              });
              return false;
            }
            
            // General verification required
            if (status.isVerified) {
              return true;
            }
            
            // Not verified - redirect to verification page
            this.router.navigate(['/verification'], { 
              queryParams: { returnUrl: state.url } 
            });
            return false;
          })
        );
      }),
      catchError(error => {
        console.error('Verification guard error:', error);
        // On error, redirect to login
        this.router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: state.url } 
        });
        return of(false);
      })
    );
  }
} 