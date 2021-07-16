import {Component} from '@angular/core';

@Component({
    selector: 'val-app-footer',
    template: `<div class="p-d-flex p-jc-end p-p-2">Copyright Valassis {{currentYear}}. All Rights Reserved.</div>`
})
export class AppFooterComponent {
  currentYear: string;

  constructor() {
    const today = new Date();
    this.currentYear = today.getFullYear().toString();
  }
}
