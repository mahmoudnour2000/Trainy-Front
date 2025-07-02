// src/app/modules/account-profile/account-profile.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { ProfileHeaderComponent } from './profile-header/profile-header.component';
import { ProfileImageComponent } from './profile-image/profile-image.component';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { WalletCardComponent } from './wallet-card/wallet-card.component';
import { ProfileTabsComponent } from './profile-tabs/profile-tabs.component';
import { OfferCardComponent } from './offer-card/offer-card.component';
import { AccountProfileRoutingModule } from './account-profile-routing.module'; // استيراد الـ routing module
import { WithdrawButtonComponent } from './withdraw-button/withdraw-button.component';
import { DepositButtonComponent } from './deposit-button/deposit-button.component';
import { OfferDetailsComponent } from './offer-details/offer-details.component';
import { RequestCardComponent } from './request-card/request-card.component';
@NgModule({
  declarations: [
    UserProfileComponent,
    ProfileHeaderComponent,
    ProfileImageComponent,
     WalletCardComponent,
    PersonalInfoComponent,
    WithdrawButtonComponent,
    DepositButtonComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ProfileTabsComponent, // مستورد كـ standalone
    OfferCardComponent,   // مستورد كـ standalone
    OfferDetailsComponent,
    RequestCardComponent,
    AccountProfileRoutingModule // إضافة الـ routing هنا
  ],
  bootstrap: [UserProfileComponent] // بما إن ده الـ root module
})
export class AccountProfileModule { }