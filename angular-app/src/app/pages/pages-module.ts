import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { PagesRoutingModule } from './pages-routing-module';
import { Home } from './home/home';
import { Pacotes } from './pacotes/pacotes';
import { Hoteis } from './hoteis/hoteis';


@NgModule({
  declarations: [
    Home,
    Pacotes,
    Hoteis
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ]
})
export class PagesModule { }
