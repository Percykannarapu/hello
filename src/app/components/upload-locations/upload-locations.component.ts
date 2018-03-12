import { Component, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/components/common/messageservice';
import { siteListUploadRules, siteUploadHeaderValidator } from './upload.rules';
import { FileService, ParseResponse, ParseRule } from '../../val-modules/common/services/file.service';
import { ValGeocodingService } from '../../services/app-geocoding.service';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ValGeocodingResponse } from '../../models/val-geocoding-response.model';
import { FileUpload } from 'primeng/primeng';
import { ValSiteListService } from '../../services/app-site-list.service';

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

  constructor(private messageService: MessageService,
              public geocodingService: ValGeocodingService,
              private siteListService: ValSiteListService) { }

  public onRemove(row: ValGeocodingResponse) {
    this.geocodingService.removeFailedGeocode(row);
  }

  public onResubmit(row: ValGeocodingResponse) {
    this.geocodingService.removeFailedGeocode(row);
    this.displayGcSpinner = true;
    this.siteListService.geocodeAndPersist([row.toGeocodingRequest()], this.listType).then(() => {
      this.displayGcSpinner = false;
    });
  }

  public uploadCsv(event: any) : void {
    console.log('Upload Clicked');
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
      this.displayGcSpinner = true;
      console.log('sending to Fuse');
      this.siteListService.geocodeAndPersist(classInstances, this.listType).then(() => {
        this.displayGcSpinner = false;
      });
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  private handleError(message: string) : void {
    this.displayGcSpinner = false;
    this.messageService.add({ severity: 'error', summary: 'Geocoding Error', detail: message });
  }
}
