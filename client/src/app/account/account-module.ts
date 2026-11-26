import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { AccountRoutingModule } from './account-routing-module';
import { Login } from './pages/login/login';
import { Profile } from './pages/profile/profile';
import { Register } from './pages/register/register';

@NgModule({
  declarations: [Login, Profile, Register],
  imports: [CommonModule, SharedModule, AccountRoutingModule],
})
export class AccountModule {}
