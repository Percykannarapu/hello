import {Component} from '@angular/core';

@Component({
    selector: 'app-footer',
    template: `
        <div class="footer">
            <div class="card clearfix">
                <span class="footer-text-left">Copyright Valassis, 2018</span>
                <span class="footer-text-right"><span class="ui-icon ui-icon-copyright"></span>  <span>All Rights Reserved</span></span>
            </div>
        </div>
    `
})
export class AppFooterComponent {

}