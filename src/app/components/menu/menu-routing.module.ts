import { MenuComponent } from './menu.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        RouterModule.forChild([
            {path: '', component: MenuComponent}
        ])
    ],

    exports: [
        RouterModule
    ]
})
export class MenuRoutingModule {}
