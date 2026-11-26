import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PackageList } from './pages/package-list/package-list';
import { PackageDetail } from './pages/package-detail/package-detail';
import { FlightList } from './pages/flight-list/flight-list';
import { GuideList } from './pages/guide-list/guide-list';
import { HotelList } from './pages/hotel-list/hotel-list';

const routes: Routes = [
  { path: '', component: PackageList, pathMatch: 'full' },
  { path: 'pacotes', component: PackageList },
  { path: 'pacotes/:id', component: PackageDetail },
  { path: 'voos', component: FlightList },
  { path: 'guias', component: GuideList },
  { path: 'hospedagens', component: HotelList },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CatalogRoutingModule {}
