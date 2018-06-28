import { Component, ViewChild, OnInit } from '@angular/core';
import { siteListUploadRules, siteUploadHeaderValidator } from './upload.rules';
import { FileService, ParseResponse, ParseRule } from '../../val-modules/common/services/file.service';
import { AppGeocodingService } from '../../services/app-geocoding.service';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ValGeocodingResponse } from '../../models/val-geocoding-response.model';
import { FileUpload } from 'primeng/primeng';
import { AppLocationService } from '../../services/app-location.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import * as XLSX from 'xlsx';
import { UsageService } from '../../services/usage.service';
import { Observable } from 'rxjs';
import { AppGeoService } from '../../services/app-geo.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';


@Component({
  selector: 'val-upload-locations',
  templateUrl: './upload-locations.component.html',
  styleUrls: ['./upload-locations.component.css']
})
export class UploadLocationsComponent implements OnInit {
  public listType: string = 'Site';

  @ViewChild('fileUpload') private fileUploadEl: FileUpload;

  private csvParseRules: ParseRule[] = siteListUploadRules;
  private csvHeaderValidator: (foundHeaders: ParseRule[]) => boolean = siteUploadHeaderValidator;

  private spinnerKey = 'UploadLocationsComponentKey';
  private spinnerMessage: string = 'Geocoding Locations';

  public hasFailures$: Observable<boolean>;
  public geocodingFailures$: Observable<ValGeocodingResponse[]>;
  public failureCount$: Observable<number>;
  public successCount: number;
  public totalCount: number;
  public failureCount: number;


  constructor(private messagingService: AppMessagingService,
    private geocodingService: AppGeocodingService,
    private siteListService: AppLocationService,
    private usageService: UsageService,
    private valSiteListService: AppLocationService,
    private valGeoService: AppGeoService,
    private locationService: ImpGeofootprintLocationService) {

    this.hasFailures$ = this.geocodingService.hasFailures$;
    this.geocodingFailures$ = this.geocodingService.geocodingFailures$;
    this.failureCount$ = this.geocodingService.failureCount$;

  }

  ngOnInit(){
    this.locationService.storeObservable.subscribe(loc => {
      this.successCount = loc.length;
      this.calculateCounts();
    });
    this.failureCount$.subscribe(n => {
      this.failureCount = n;
      this.calculateCounts();
    });
  }

  public calculateCounts(){
    this.totalCount = this.successCount + this.failureCount;
  }

  public onRemove(row: ValGeocodingResponse) {
    this.geocodingService.removeFailedGeocode(row);
  }
  public onAccept(row: ValGeocodingResponse) {
    const valGeoList: ValGeocodingResponse[] = [];
    valGeoList.push(row);

    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'failure', action: 'accept' });
    const metricText = `Number=${row.Number}~Name=${row.Name}~Street=${row.Address}~City=${row.City}~State=${row.State}~ZIP=${row.ZIP}~X=${row.Longitude}~Y=${row.Latitude}
~Status=${row['Geocode Status']}~MatchCode=${row['Match Code']}~LocationCode=${row['Match Quality']}`;
    this.usageService.createCounterMetric(usageMetricName, metricText, null);

    this.geocodingService.removeFailedGeocode(row);

    if (row['userHasEdited'] != null && row['userHasEdited'] === true) {
       row['Geocode Status'] = 'PROVIDED';
       row['Match Code'] = '';
       row['Match Quality'] = '';
    } else row['Geocode Status'] = 'SUCCESS';
    this.valSiteListService.persistLocationsAndAttributes(valGeoList.map(r => r.toGeoLocation(this.listType)));
  }

  public onResubmit(row: ValGeocodingResponse) {
    this.geocodingService.removeFailedGeocode(row);
    this.messagingService.startSpinnerDialog(this.spinnerKey, this.spinnerMessage);
    this.geocodeData([row.toGeocodingRequest()]);
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'failure', action: 'resubmit' });
    const metricText = `Number=${row.Number}~Name=${row.Name}~Street=${row.Address}~City=${row.City}~State=${row.State}~ZIP=${row.ZIP}~X=${row.Longitude}~Y=${row.Latitude}
~Status=${row['Geocode Status']}~MatchCode=${row['Match Code']}~LocationCode=${row['Match Quality']}`;
    this.usageService.createCounterMetric(usageMetricName, metricText, null);
  }

   public uploadFile(event: any) : void {
    const reader = new FileReader();
    const name: String = event.files[0].name;
    console.log('file Name:::', name);
    if (name.includes('.xlsx') || name.includes('.xls')) {
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
      if (data.duplicateKeys.length > 0) {
        data.parsedData.forEach(dat => {
          if (FileService.uniqueSet.has(dat.number)){
            FileService.uniqueSet.delete(dat.number);
          }
        });
        const topDuplicateNumbers = data.duplicateKeys.slice(0, 5).join(', ');
        const dupeMessage = data.duplicateKeys.length > 5 ? `${topDuplicateNumbers} (+ ${data.duplicateKeys.length - 5} more)` : topDuplicateNumbers;
        this.handleError(`There were ${data.duplicateKeys.length} duplicate store numbers in the uploaded file: ${dupeMessage}`);
      } else {
        const classInstances = data.parsedData.map(d => new ValGeocodingRequest(d));
        this.messagingService.startSpinnerDialog(this.spinnerKey, this.spinnerMessage);
        this.geocodeData(classInstances);
      }
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  // to process excel upload data
  private parseExcelFile(bstr: string) : void {
    console.log('process excel data::');
    try {
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const worksheetName: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[worksheetName];
      const csvData = XLSX.utils.sheet_to_csv(ws);
      this.parseCsvFile(csvData);
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  private handleError(message: string) : void {
    this.messagingService.stopSpinnerDialog(this.spinnerKey);
    this.messagingService.showGrowlError('Geocoding Error', message);
  }

  private geocodeData(model: ValGeocodingRequest[]) : void {
    const allLocations: ImpGeofootprintLocation[] = [];
    this.siteListService.geocode(model, this.listType).subscribe(
      locations => allLocations.push(...locations),
      err => {
        console.error('There was an error geocoding the site', err);
        this.messagingService.stopSpinnerDialog(this.spinnerKey);
      },
      () => {
        this.siteListService.persistLocationsAndAttributes(allLocations);
        this.siteListService.zoomToLocations(allLocations);
        this.messagingService.stopSpinnerDialog(this.spinnerKey);
      }
    );
  }

}

