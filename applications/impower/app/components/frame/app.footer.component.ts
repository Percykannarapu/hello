import {Component} from '@angular/core';

@Component({
    selector: 'val-app-footer',
    template: `
        <div class="footer">
            <div class="card clearfix">
                <span class="footer-text-left">Copyright {{currentYear}} Valassis</span>
                <span class="footer-text-right">&copy;&nbsp;All Rights Reserved</span>
            </div>
        </div>
    `
})
export class AppFooterComponent {
  currentYear: string;

  constructor() {
    const today = new Date();
    this.currentYear = today.getFullYear().toString();
  }
}
