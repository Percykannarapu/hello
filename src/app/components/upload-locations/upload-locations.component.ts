import { Component, ViewChild } from '@angular/core';
import { siteListUploadRules, siteUploadHeaderValidator } from './upload.rules';
import { FileService, ParseResponse, ParseRule } from '../../val-modules/common/services/file.service';
import { ValGeocodingService } from '../../services/app-geocoding.service';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ValGeocodingResponse } from '../../models/val-geocoding-response.model';
import { FileUpload } from 'primeng/primeng';
import { ValSiteListService } from '../../services/app-site-list.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import * as XLSX from 'xlsx';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';

@Component({
  selector: 'val-upload-locations',
  templateUrl: './upload-locations.component.html',
  styleUrls: ['./upload-locations.component.css']
})
export class UploadLocationsComponent {
  public listType: string = 'Site';

  @ViewChild('fileUpload') private fileUploadEl: FileUpload;

  private csvParseRules: ParseRule[] = siteListUploadRules;
  private csvHeaderValidator: (foundHeaders: ParseRule[]) => boolean = siteUploadHeaderValidator;

  private spinnerKey = 'UploadLocationsComponentKey';
  private spinnerMessage: string = 'Geocoding Locations';

  constructor(private messagingService: AppMessagingService,
              public geocodingService: ValGeocodingService,
              private siteListService: ValSiteListService,
              private usageService: UsageService) { }

  public onRemove(row: ValGeocodingResponse) {
    this.geocodingService.removeFailedGeocode(row);
  }

  public onResubmit(row: ValGeocodingResponse) {
    this.geocodingService.removeFailedGeocode(row);
    this.messagingService.startSpinnerDialog(this.spinnerKey, this.spinnerMessage);
    this.siteListService.geocodeAndPersist([row.toGeocodingRequest()], this.listType).then(() => {
      this.messagingService.stopSpinnerDialog(this.spinnerKey);
    });
  }

  public uploadFile(event: any) : void {
    const reader = new FileReader();
    const name: String = event.files[0].name;
    console.log('file Name:::', name);
    if (name.includes('.xlsx') || name.includes('.xls') ) {
      reader.readAsBinaryString(event.files[0]);
      reader.onload = () => {
        this.parseExcelFile(reader.result);
      };
    } else {
      reader.readAsText(event.files[0]);
      reader.onload = () => {
        this.parseCsvFile(reader.result);
      };
    }

    this.fileUploadEl.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.fileUploadEl.basicFileInput.nativeElement.value = '';
  }

  private parseCsvFile(dataBuffer: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    try {
      const data: ParseResponse<ValGeocodingRequest> = FileService.parseDelimitedData(header, rows, this.csvParseRules, this.csvHeaderValidator);
      if (data.failedRows.length > 0) {
        console.error('There were errors parsing the following rows in the CSV: ', data.failedRows);
        this.handleError(`There were ${data.failedRows.length} rows in the uploaded file that could not be read.`);
      }
      const classInstances = data.parsedData.map(d => new ValGeocodingRequest(d));
      this.messagingService.startSpinnerDialog(this.spinnerKey, this.spinnerMessage);
      this.siteListService.geocodeAndPersist(classInstances, this.listType).then(() => {
      //const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: this.listType.toLowerCase() + '-data-file', action: 'upload' });
      //this.usageService.createCounterMetric(usageMetricName, `total=${rows.length - 1}`, null);
      this.messagingService.stopSpinnerDialog(this.spinnerKey);
      });
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  // to process excel upload data
  public parseExcelFile(bstr: string) : void {
    console.log('process excel data::');
    try {
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
      const worksheetName: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[worksheetName];
      const csvData  = XLSX.utils.sheet_to_csv(ws);
      this.parseCsvFile(csvData);
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  private handleError(message: string) : void {
    this.messagingService.stopSpinnerDialog(this.spinnerKey);
    this.messagingService.showGrowlError('Geocoding Error', message);
  }
}
