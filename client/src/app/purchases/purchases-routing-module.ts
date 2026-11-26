import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Purchases } from './pages/purchases/purchases';

const routes: Routes = [{ path: '', component: Purchases }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PurchasesRoutingModule {}
