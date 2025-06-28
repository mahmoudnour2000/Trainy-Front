import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // التحقق من وجود الـ token
    const isAuthenticated = this.authService.isAuthenticated();

    if (isAuthenticated) {
      return true; // يسمح بالوصول للـ route
    } else {
      // لو مش authenticated، يوجهه لصفحة الـ Login
      this.router.navigate(['auth/login']);
      return false;
    }
  }
}