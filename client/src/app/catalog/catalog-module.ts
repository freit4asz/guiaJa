import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { CatalogRoutingModule } from './catalog-routing-module';
import { PackageList } from './pages/package-list/package-list';
import { PackageDetail } from './pages/package-detail/package-detail';
import { FlightList } from './pages/flight-list/flight-list';
import { GuideList } from './pages/guide-list/guide-list';
import { HotelList } from './pages/hotel-list/hotel-list';

@NgModule({
  declarations: [PackageList, PackageDetail, FlightList, GuideList, HotelList],
  imports: [CommonModule, SharedModule, CatalogRoutingModule],
})
export class CatalogModule {}
