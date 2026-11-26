import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, AdminGuard } from './core/route-guards';

const routes: Routes = [
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadChildren: () => import('./admin/admin-module').then(module => module.AdminModule),
  },
  {
    path: 'minhas-compras',
    canActivate: [AuthGuard],
    loadChildren: () => import('./purchases/purchases-module').then(module => module.PurchasesModule),
  },
  {
    path: '',
    loadChildren: () => import('./catalog/catalog-module').then(module => module.CatalogModule),
  },
  {
    path: '',
    loadChildren: () => import('./account/account-module').then(module => module.AccountModule),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
