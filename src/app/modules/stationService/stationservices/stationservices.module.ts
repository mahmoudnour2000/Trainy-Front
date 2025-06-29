import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { StationsComponent } from '../../stations/stations.component';

const routes: Routes = [
  { path: '', component: StationsComponent },
  { 
    path: 'services/:stationId', 
    loadComponent: () => import('../stationService.component').then(m => m.ServicesComponent)
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    StationsComponent
  ]
})
export class StationServicesModule {}