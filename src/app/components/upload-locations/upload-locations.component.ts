import { Component, ViewChild, ElementRef } from '@angular/core';
import { MessageService } from 'primeng/components/common/messageservice';
import { siteListUploadRules, siteUploadHeaderValidator } from './upload.rules';
import { FileService, ParseResponse, ParseRule } from '../../val-modules/common/services/file.service';
import { ValGeocodingService } from '../../services/val-geocoding.service';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ValGeocodingResponse } from '../../models/val-geocoding-response.model';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';

class CsvSiteData extends ValGeocodingRequest {
  latitude?: number | null;
  longitude?: number | null;

  constructor(initializer: any) {
    super(initializer);
  }

  public hasLatAndLong() : boolean {
    return this.hasOwnProperty('longitude') && this.hasOwnProperty('latitude') && this.longitude != null && this.latitude != null;
  }

  public toGeoLocation(siteType: string) : ImpGeofootprintLocation {
    const nonAttributeProps = ['name', 'number', 'market', 'street', 'city', 'state', 'zip', 'latitude', 'longitude'];
    const result = new ImpGeofootprintLocation({
      locationName: this.name,
      marketName: this.market,
      locAddress: this.street,
      locCity: this.city,
      locState: this.state,
      locZip: this.zip,
      xcoord: this.longitude,
      ycoord: this.latitude,
      impClientLocationType: siteType
    });
    if (this.number != null && !Number.isNaN(Number(this.number))) {
      result.locationNumber = Number(this.number);
      result.glId = Number(this.number);
    }
    const attributes: ImpGeofootprintLocAttrib[] = [];
    for (const [k, v] of Object.entries(this)) {
      if (nonAttributeProps.indexOf(k) < 0 && typeof v !== 'function') {
        const locationAttribute = new ImpGeofootprintLocAttrib({
          attributeCode: k,
          attributeValue: v,
          impGeofootprintLocation: location
        });
        attributes.push(locationAttribute);
      }
    }
    result['_attributes'] = attributes;
    return result;
  }
}

@Component({
  selector: 'val-upload-locations',
  templateUrl: './upload-locations.component.html',
  styleUrls: ['./upload-locations.component.css']
})
export class UploadLocationsComponent {
  public disableshowBusiness: boolean = true; // flag for enabling/disabling the show business search button
  public listType: string = 'Site';
  public displaySpinnerMessage: string = 'Geocoding Locations';
  public displayGcSpinner: boolean = false;

  @ViewChild('fileUpload1') private fileUploadEl: ElementRef;

  private csvParseRules: ParseRule[] = siteListUploadRules;
  private csvHeaderValidator: (foundHeaders: ParseRule[]) => boolean = siteUploadHeaderValidator;

  constructor(private messageService: MessageService, public locationListService: ValGeocodingService,
              private locationService: ImpGeofootprintLocationService, private attributeService: ImpGeofootprintLocAttribService) { }

  public onRemove(row) {
    this.locationListService.removeFailedGeocode(row);
  }

  public onResubmit(row) {
    this.displayGcSpinner = true;
    this.locationListService.resubmitFailedGeocode(row).then((result: ValGeocodingResponse) => {
      this.handlePersist([result.toGeoLocation(this.listType)]);
    });
  }

  public uploadCsv(event: Event) : void {
    const domNode = event.target as HTMLInputElement;
    const reader = new FileReader();
    reader.readAsText(domNode.files[0]);
    reader.onload = () => {
      this.onFileUpload(reader.result);
    };
    this.fileUploadEl.nativeElement.value = '';
  }

  private onFileUpload(dataBuffer: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    try {
      const data: ParseResponse<CsvSiteData> = FileService.parseDelimitedData(header, rows, this.csvParseRules, this.csvHeaderValidator);
      if (data.failedRows.length > 0) {
        console.error('There were errors parsing the following rows in the CSV: ', data.failedRows);
        this.handleError(`There were ${data.failedRows.length} rows in the uploaded file that could not be read.`);
      }
      const classInstances = data.parsedData.map(d => new CsvSiteData(d));
      this.handleGeocodingAndPersisting(classInstances);
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  private handleGeocodingAndPersisting(data: CsvSiteData[]) {
    // attach geo status to each location
    data.forEach(d => d['Geocode Status'] = (d.hasLatAndLong() ? 'PROVIDED' : 'SUCCESS'));
    // split the data into two groups: on that needs geocoded, and one that doesn't
    const needsGeoCoding = data.filter(d => d.hasLatAndLong() === false);
    const noGeoCoding = data.filter(d => d.hasLatAndLong());
    // strip any null/superfluous lat/lon fields from the data being sent to Fuse
    needsGeoCoding.forEach(d => {
      delete d.latitude;
      delete d.longitude;
    });
    this.displayGcSpinner = true;
    this.locationListService.geocodeLocations(needsGeoCoding).then((result: ValGeocodingResponse[]) => {
      const persistLocations = result.map(r => r.toGeoLocation(this.listType))
                                     .concat(noGeoCoding.map(v => v.toGeoLocation(this.listType)));
      this.handlePersist(persistLocations);
      this.displayGcSpinner = false;
    });
  }

  private handlePersist(data: ImpGeofootprintLocation[]) : void {
    const flatten = (previous: ImpGeofootprintLocAttrib[], current: ImpGeofootprintLocAttrib[]) => {
      previous.push(...current);
      return previous;
    };
    const attrs: ImpGeofootprintLocAttrib[] = data.map(l => l['_attributes']).reduce(flatten, []);
    data.forEach(d => delete d['_attributes']);
    this.locationService.add(data);
    this.attributeService.add(attrs);
  }

  private handleError(message: string) : void {
    this.displayGcSpinner = false;
    this.messageService.add({ severity: 'error', summary: 'Geocoding Error', detail: message });
  }
}
