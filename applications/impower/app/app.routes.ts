import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { BatchMapComponent } from './components/batch-map/batch-map.component';
import { ImpowerMainComponent } from './components/impower-main/impower-main.component';
import { AuthService } from './services/auth.service';

export const routes: Routes = [
  {path: '', component: ImpowerMainComponent, canActivate: [AuthService]},
  {path: 'auth-callback', component: AuthCallbackComponent},
  {path: 'batch-map', component: BatchMapComponent},
  {path: 'batch-map/:id', component: BatchMapComponent}
];

export const AppRoutes: ModuleWithProviders = RouterModule.forRoot(routes, { useHash: false });
