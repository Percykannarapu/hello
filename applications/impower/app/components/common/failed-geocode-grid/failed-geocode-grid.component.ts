import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { ImpGeofootprintLocation } from '../../../val-modules/targeting/models/ImpGeofootprintLocation';

@Component({
  selector: 'val-failed-geocode-grid',
  templateUrl: './failed-geocode-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FailedGeocodeGridComponent implements OnInit{

  @Input() failedSites: ImpGeofootprintLocation[];
  @Input() totalCount: number = 0;
  @Input() type: string;

  @Output() resubmit = new EventEmitter<ImpGeofootprintLocation>();
  @Output() accept = new EventEmitter<ImpGeofootprintLocation>();
  @Output() remove = new EventEmitter<ImpGeofootprintLocation>();

  private edited = new Set<ImpGeofootprintLocation>();
  // public locFieldAddress: string = '';
  // public locFieldCity: string = '';
  // public locFieldState: string = '';
  // public locFieldZip: string = '';

  ngOnInit() {
    // if (this.type === 'edit') {
    //   this.locFieldAddress = 'locAddress';
    //   this.locFieldCity = 'locCity';
    //   this.locFieldState = 'locState';
    //   this.locFieldZip = 'locZip';
    // }
  }

  canBeAccepted(site: ImpGeofootprintLocation) : boolean {
    return site.recordStatusCode !== 'ERROR' && site.recordStatusCode !== '';
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
    if (enteredValue == null || enteredValue.length === 0) {
      site.recordStatusCode = '';
      site.geocoderMatchCode = '';
      site.geocoderLocationCode = '';
      site.xcoord = null;
      site.ycoord = null;
      this.edited.add(site);
    } else {
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
    }
    event.target.value = ''; // clear the text area
  }

  onAccept(site: ImpGeofootprintLocation) : void {
    if (!this.edited.has(site)) {
      site.recordStatusCode = 'SUCCESS';
    }
    this.accept.emit(site);
  }

  openGoogleMap(site: ImpGeofootprintLocation) : void {
    const googleMapUri = `https://www.google.com/maps/place/${site.locAddress},${site.locCity},${site.locState},${site.locZip}`;
    const strWindowFeatures = 'height=1000px,width=1000px';
    window.open(googleMapUri, '_blank', strWindowFeatures);
  }
}

