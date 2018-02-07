import {Component} from '@angular/core';

@Component({
    selector: 'app-footer',
    template: `
        <div class="footer" style="bottom: 0%; position: fixed; width: 97.55%">
            <div class="card clearfix">
                <span class="footer-text-left">Copyright Valassis, 2017</span>
                <span class="footer-text-right"><span class="ui-icon ui-icon-copyright"></span>  <span>All Rights Reserved</span></span>
            </div>
        </div>
    `
})
export class AppFooterComponent {

}
