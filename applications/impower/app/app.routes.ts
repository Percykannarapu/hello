import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImpowerMainComponent } from './components/impower-main/impower-main.component';
import { BatchMapComponent } from './components/batch-map/batch-map.component';
import { ProjectComponent } from './components/project-dashboard/project.component';
import { PocComponent } from './poc/poc.component';
import { PocMapComponent } from './poc/poc.map';
import { SampleComponent } from './poc/sample/sample.component';
import { AuthService } from './services/auth.service';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';

export const routes: Routes = [
  {path: '', component: ImpowerMainComponent, canActivate: [AuthService]},
  {path: 'project', component: ProjectComponent},
  {path: 'auth-callback', component: AuthCallbackComponent},

  {path: 'poc', component: PocComponent},
  {path: 'poc map', component: PocMapComponent},
  {path: 'sample', component: SampleComponent},

  {path: 'batch-map', component: BatchMapComponent},
  {path: 'batch-map/:id', component: BatchMapComponent}
];

export const AppRoutes: ModuleWithProviders = RouterModule.forRoot(routes, { useHash: false });
