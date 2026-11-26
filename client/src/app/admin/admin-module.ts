import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { AdminRoutingModule } from './admin-routing-module';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { ResourceCrud } from './components/resource-crud/resource-crud';

@NgModule({
  declarations: [AdminDashboard, ResourceCrud],
  imports: [CommonModule, SharedModule, AdminRoutingModule],
})
export class AdminModule {}
