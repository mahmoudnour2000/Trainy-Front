import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TrainTrackingComponent } from '../../train-tracking/train-tracking.component';
import { TrainHistoryComponent } from '../../train-tracking-history/train-tracking-history.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';


const routes: Routes = [
  { path: 'tracking/:trainId', component: TrainTrackingComponent },
  { path: 'history/:trainId', component: TrainHistoryComponent },
  { path: '', redirectTo: '/tracking/1', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    TrainTrackingComponent,
    TrainHistoryComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    RouterModule, // لازم يكون موجود عشان routerLink
    MatCardModule,
    ReactiveFormsModule
  ],
  exports: [
    TrainTrackingComponent,
    TrainHistoryComponent
  ]
})
export class TrainTrackingModule { }
