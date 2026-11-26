import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { PurchasesRoutingModule } from './purchases-routing-module';
import { Purchases } from './pages/purchases/purchases';

@NgModule({
  declarations: [Purchases],
  imports: [CommonModule, SharedModule, PurchasesRoutingModule],
})
export class PurchasesModule {}
