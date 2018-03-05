import { Component, ViewChild } from '@angular/core';
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
import { FileUpload } from 'primeng/primeng';

@Component({
  selector: 'val-upload-locations',
  templateUrl: './upload-locations.component.html',
  styleUrls: ['./upload-locations.component.css']
})
export class UploadLocationsComponent {
  public listType: string = 'Site';
  public displaySpinnerMessage: string = 'Geocoding Locations';
  public displayGcSpinner: boolean = false;

  @ViewChild('fileUpload') private fileUploadEl: FileUpload;

  private csvParseRules: ParseRule[] = siteListUploadRules;
  private csvHeaderValidator: (foundHeaders: ParseRule[]) => boolean = siteUploadHeaderValidator;

  constructor(private messageService: MessageService, public locationListService: ValGeocodingService,
              private locationService: ImpGeofootprintLocationService, private attributeService: ImpGeofootprintLocAttribService) { }

  public onRemove(row: ValGeocodingResponse) {
    this.locationListService.removeFailedGeocode(row);
  }

  public onResubmit(row: ValGeocodingResponse) {
    this.locationListService.removeFailedGeocode(row);
    this.handleGeocodingAndPersisting([row.toGeocodingRequest()]);
  }

  public uploadCsv(event: any) : void {
    const reader = new FileReader();
    reader.readAsText(event.files[0]);
    reader.onload = () => {
      this.onFileUpload(reader.result);
    };
    this.fileUploadEl.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.fileUploadEl.basicFileInput.nativeElement.value = '';
  }

  private onFileUpload(dataBuffer: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    try {
      const data: ParseResponse<ValGeocodingRequest> = FileService.parseDelimitedData(header, rows, this.csvParseRules, this.csvHeaderValidator);
      if (data.failedRows.length > 0) {
        console.error('There were errors parsing the following rows in the CSV: ', data.failedRows);
        this.handleError(`There were ${data.failedRows.length} rows in the uploaded file that could not be read.`);
      }
      const classInstances = data.parsedData.map(d => new ValGeocodingRequest(d));
      this.handleGeocodingAndPersisting(classInstances);
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  private handleGeocodingAndPersisting(data: ValGeocodingRequest[]) {
    this.displayGcSpinner = true;
    this.locationListService.geocodeLocations(data).then((result: ValGeocodingResponse[]) => {
      this.handlePersist(result.map(r => r.toGeoLocation(this.listType)));
      this.displayGcSpinner = false;
    });
  }

  private handlePersist(data: ImpGeofootprintLocation[]) : void {
    const flatten = (previous: ImpGeofootprintLocAttrib[], current: ImpGeofootprintLocAttrib[]) => {
      previous.push(...current);
      return previous;
    };
    const attributes: ImpGeofootprintLocAttrib[] = data.map(l => l['_attributes']).reduce(flatten, []);
    data.forEach(d => delete d['_attributes']);
    this.locationService.add(data);
    this.attributeService.add(attributes);
  }

  private handleError(message: string) : void {
    this.displayGcSpinner = false;
    this.messageService.add({ severity: 'error', summary: 'Geocoding Error', detail: message });
  }
}
