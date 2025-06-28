import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { StationsComponent } from '../../stations/stations.component';
import { ServicesComponent } from '../../stationService/stationService.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  { path: '', component: StationsComponent },
  { path: 'services/:stationId', component: ServicesComponent }
];

@NgModule({
  declarations: [ServicesComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    StationsComponent,
    ServicesComponent,
    LeafletModule,
    FormsModule
  ]
})
export class StationServicesModule {}