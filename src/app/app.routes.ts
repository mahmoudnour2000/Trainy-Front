import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { NotificationsComponent } from './modules/Notifications/notifications-page/notifications-page.component';
import { TrainDetailsComponent } from './modules/Trains/train-details/train-details.component';
import { TrainListComponent } from './modules/Trains/train-list/train-list.component';
import { LostAndFoundListComponent } from './modules/Lost-And-Found/lost-and-found-list/lost-and-found-list.component';
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'auth',
        loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
      },
      {
        path: 'notifications',
        component: NotificationsComponent
      },
      {
        path: 'traindetails/:trainId',
        loadComponent: () =>
          import('./modules/Trains/train-details/train-details.component').then(m => m.TrainDetailsComponent)
      },
      {
        path: 'trains',
        loadComponent: () =>
          import('./modules/Trains/train-list/train-list.component').then(m => m.TrainListComponent)
      },
      {
        path: 'traindetails/:trainId/lost-and-found',
        loadComponent: () =>
          import('./modules/Lost-And-Found/lost-and-found-list/lost-and-found-list.component').then(m => m.LostAndFoundListComponent)
      },
      {
        path: 'train-tracking/:trainId',
        loadComponent: () =>
          import('./modules/train-tracking/train-tracking.component').then(m => m.TrainTrackingComponent)
      },
      {
        path: 'train-history/:trainId',
        loadComponent: () =>
          import('./modules/train-tracking-history/train-tracking-history.component').then(m => m.TrainHistoryComponent)
      },
      {
        path: 'report-lost/:trainId',
        loadComponent: () =>
          import('./modules/Lost-And-Found/lost-and-found-form/lost-and-found-form.component').then(m => m.LostAndFoundFormComponent)
      },
      {
        path: 'edit-post/:postId',
        loadComponent: () =>
          import('./modules/Lost-And-Found/lost-and-found-edit/lost-and-found-edit.component').then(m => m.LostAndFoundEditComponent)
      },
      {
        path: 'lost-and-found/:trainId',
        component: LostAndFoundListComponent
      },
      {path: 'stations',
        loadComponent: () =>
          import('./modules/stations/stations.component').then(m => m.StationsComponent)
      },
      {
        path: 'stations/services/:stationId',
        loadComponent: () =>
          import('./modules/stationService/stationService.component').then(m => m.ServicesComponent)
      },
      {
        path: 'chat',
        loadChildren: () => import('./modules/public-chat/public-chat.module').then(m => m.PublicChatModule)
      },
      {
        path: 'offers',
        loadChildren: () => import('./modules/offers-page/offers-page.module').then(m => m.OffersPageModule)
      },
      {
        path: 'userProfile',
        loadChildren: () => import('./modules/account-profile/account-profile.module').then(m => m.AccountProfileModule)
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule]
})
export class AppRoutingModule {}