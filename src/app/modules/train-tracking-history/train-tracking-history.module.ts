import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrainTrackingHistoryComponent } from './train-tracking-history.component';

const routes: Routes = [
  { path: ':trainId', component: TrainTrackingHistoryComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class TrainTrackingHistoryModule { } 