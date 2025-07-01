import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { NotificationsComponent } from './modules/Notifications/notifications-page/notifications-page.component';
import { TrainListComponent } from './modules/Trains/train-list/train-list.component';
import { LostAndFoundListComponent } from './modules/Lost-And-Found/lost-and-found-list/lost-and-found-list.component';
import { AboutUsComponent } from '../app/modules/AboutUs/about-us/about-us.component'; 
import{ AuthGuard } from './core/guards/auth.guard';
import { NotFoundComponent } from './modules/NotFoundPage/not-found/not-found.component';
import { ActivatedRoute } from '@angular/router';
import { TrainTrackingService } from './core/services/train-tracking.service';
import { interval } from 'rxjs';

export const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'auth/login',
  //   pathMatch: 'full'
  // },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: TrainListComponent // الـ Homepage
      },
      {
        path: 'about-us',
        component: AboutUsComponent // صفحة "من نحن" بدون guard
      },
      {
        path: 'auth',
        loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
      },
      {
        path: 'notifications',
        canActivate: [AuthGuard],
        component: NotificationsComponent
      },
      {
        path: 'traindetails/:trainId',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./modules/Trains/train-details/train-details.component').then(m => m.TrainDetailsComponent)
      },
      {
        path: 'trains',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./modules/Trains/train-list/train-list.component').then(m => m.TrainListComponent)
      },
      {
        path: 'traindetails/:trainId/lost-and-found',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./modules/Lost-And-Found/lost-and-found-list/lost-and-found-list.component').then(m => m.LostAndFoundListComponent)
      },
      {
        path: 'train-tracking/:trainId',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./modules/train-tracking/train-tracking.component').then(m => m.TrainTrackingComponent)
      },
      {
        path: 'train-history/:trainId',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./modules/train-tracking-history/train-tracking-history.component').then(m => m.TrainTrackingHistoryComponent)
      },
      {
        path: 'report-lost/:trainId',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./modules/Lost-And-Found/lost-and-found-form/lost-and-found-form.component').then(m => m.LostAndFoundFormComponent)
      },
      {
        path: 'edit-post/:postId',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./modules/Lost-And-Found/lost-and-found-edit/lost-and-found-edit.component').then(m => m.LostAndFoundEditComponent)
      },
      {
        path: 'lost-and-found/:trainId',
        canActivate: [AuthGuard],
        component: LostAndFoundListComponent
      },
      {path: 'stations',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./modules/stations/stations.component').then(m => m.StationsComponent)
      },
      {
        path: 'stations/services/:stationId',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./modules/stationService/stationService.component').then(m => m.ServicesComponent)
      },
      {
        path: 'chat',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/public-chat/public-chat.module').then(m => m.PublicChatModule)
      },
      {
        path: 'offers',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/offers-page/offers-page.module').then(m => m.OffersPageModule)
      },
      {
        path: 'userProfile',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/account-profile/account-profile.module').then(m => m.AccountProfileModule)
      }
    ]
  },

  {
    path: '**',
    component: NotFoundComponent
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule]
})
export class AppRoutingModule {}