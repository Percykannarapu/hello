import {Routes, RouterModule} from '@angular/router';
import {ModuleWithProviders} from '@angular/core';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {LoginComponent} from './components/login/login.component';
import { AuthService } from './services/auth.service';
import { PocMapComponent } from './poc/poc.map';
import { PocComponent } from './poc/poc.component';

export const routes: Routes = [
    {path: '', component: DashboardComponent, canActivate: [AuthService]},
    {path: 'login', component: LoginComponent},

    {path: 'poc', component: PocComponent},
    {path: 'poc map', component: PocMapComponent},
   ];

export const AppRoutes: ModuleWithProviders = RouterModule.forRoot(routes);
