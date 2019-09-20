import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'val-batch-map-footer',
  templateUrl: './batch-map-footer.component.html',
  styleUrls: ['./batch-map-footer.component.scss']
})
export class BatchMapFooterComponent {

  @Input() isReady: boolean = false;
  @Input() nextSiteNumber: string;
  @Input() isLastSite: boolean = false;

  @Output() goToSite = new EventEmitter<string>();

  constructor() { }

  nextSiteClick() {
    if (!this.isLastSite) this.goToSite.emit(this.nextSiteNumber);
  }
}
