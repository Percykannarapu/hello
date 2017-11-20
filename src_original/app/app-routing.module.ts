import { AppComponent } from './app.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

@NgModule({
    imports: [
        RouterModule.forRoot([
            {path: '', component: AppComponent},
//          {path: 'setup', loadChildren: './components/setup/setup.module#SetupModule'},
        ])
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {}
