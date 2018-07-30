import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ImpGeofootprintLocation } from '../../../val-modules/targeting/models/ImpGeofootprintLocation';

@Component({
  selector: 'val-failed-geocode-grid',
  templateUrl: './failed-geocode-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FailedGeocodeGridComponent {

  @Input() failedSites: ImpGeofootprintLocation[] = [];
  @Input() totalCount: number = 0;

  @Output() resubmit = new EventEmitter<ImpGeofootprintLocation>();
  @Output() accept = new EventEmitter<ImpGeofootprintLocation>();
  @Output() remove = new EventEmitter<ImpGeofootprintLocation>();

  private edited = new Set<ImpGeofootprintLocation>();

  canBeAccepted(site: ImpGeofootprintLocation) : boolean {
    return site.recordStatusCode !== 'ERROR';
  }

  getCoordinates(site: ImpGeofootprintLocation) : string {
    const lineBreak = '\r\n';
    if (site.ycoord == null || site.xcoord == null) {
      return '';
    } else {
      return `${site.ycoord},${lineBreak}${site.xcoord}`;
    }
  }

  setCoordinates(event: any, site: ImpGeofootprintLocation) : void {
    console.log('Row edited result', event);
    const enteredValue = event.target.value as string;
    const coords = enteredValue.split(',');
    if (coords.length === 2) {
      const lat = Number(coords[0]);
      const lon = Number(coords[1]);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        site.recordStatusCode = 'PROVIDED';
        site.geocoderMatchCode = '';
        site.geocoderLocationCode = '';
        site.xcoord = lon;
        site.ycoord = lat;
        this.edited.add(site);
        return;
      }
    }
    event.target.value = ''; // clear the text area
  }

  onAccept(site: ImpGeofootprintLocation) : void {
    if (!this.edited.has(site)) {
      site.recordStatusCode = 'SUCCESS';
    }
    this.accept.emit(site);
  }
}

