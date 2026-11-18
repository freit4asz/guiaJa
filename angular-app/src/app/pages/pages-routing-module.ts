import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { Pacotes } from './pacotes/pacotes';
import { Hoteis } from './hoteis/hoteis';

const routes: Routes = [
  { path: '', component: Home },
  { path: 'pacotes', component: Pacotes },
  { path: 'hospedagem', component: Hoteis }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
