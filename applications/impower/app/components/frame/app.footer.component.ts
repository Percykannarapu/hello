import {Component} from '@angular/core';

@Component({
    selector: 'val-app-footer',
    template: `<div class="footer">Copyright Valassis {{currentYear}}. All Rights Reserved.</div>`,
    styleUrls: ['./app.footer.component.scss']
})
export class AppFooterComponent {
  currentYear: string;

  constructor() {
    const today = new Date();
    this.currentYear = today.getFullYear().toString();
  }
}
