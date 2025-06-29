// src/app/modules/account-profile/wallet-card/wallet-card.component.ts
import { Component, Input } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
@Component({
    standalone:false,
  selector: 'app-wallet-card',
  templateUrl: './wallet-card.component.html',
  styleUrls: ['./wallet-card.component.css']
})
export class WalletCardComponent {
 balance: number | undefined;

  constructor(private userService: UserService) {}
    ngOnInit(): void {
      this.userService.getUserBalance().subscribe({
        next: (res) => {
          console.log('Balance loaded successfully:', res);
          this.balance = res.balance;
        },
        error: () => {
          this.balance = 0;
        }
      });
    }
}