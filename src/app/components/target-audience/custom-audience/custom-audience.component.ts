import { Component, ViewChild } from '@angular/core';
import { AppMessagingService } from '../../../services/app-messaging.service';
import { FileUpload } from 'primeng/primeng';
import * as XLSX from 'xlsx';
import { FileService, ParseResponse, ParseRule } from '../../../val-modules/common/services/file.service';
import { audienceUploadRules, headerCache } from './upload.rules';
import { TopVarService } from '../../../services/top-var.service';
import { UsageService } from '../../../services/usage.service';
import { ImpMetricName } from '../../../val-modules/metrics/models/ImpMetricName';

interface CustomAudienceData {
  geocode: string;
  data: string;
}

@Component({
  selector: 'val-custom-audience',
  templateUrl: './custom-audience.component.html'
})
export class CustomAudienceComponent {
  private readonly spinnerId = 'CUSTOM_UPLOAD';
  private csvParseRules: ParseRule[] = audienceUploadRules;

  @ViewChild('audienceUpload') private audienceUploadEl: FileUpload;

  constructor(private messagingService: AppMessagingService, private dataService: TopVarService, private usageService: UsageService) { }

  public uploadFile(event: any) : void {
    const reader = new FileReader();
    const name: String = event.files[0].name;
    this.messagingService.startSpinnerDialog(this.spinnerId, 'Loading Audience Data');
    if (name.includes('.xlsx') || name.includes('.xls') ) {
      reader.readAsBinaryString(event.files[0]);
      reader.onload = () => {
        try {
          const wb: XLSX.WorkBook = XLSX.read(reader.result, {type: 'binary'});
          const worksheetName: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[worksheetName];
          const csvData  = XLSX.utils.sheet_to_csv(ws);
          this.parseFile(csvData);
        } catch (e) {
          this.handleError(`${e}`);
        }
      };
    } else {
      reader.readAsText(event.files[0]);
      reader.onload = () => {
        this.parseFile(reader.result);
      };
    }

    this.audienceUploadEl.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.audienceUploadEl.basicFileInput.nativeElement.value = '';
  }

  private parseFile(dataBuffer: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    try {
      const data: ParseResponse<CustomAudienceData> = FileService.parseDelimitedData(header, rows, this.csvParseRules);
      if (data.failedRows.length > 0) {
        console.error('There were errors parsing the following rows in the CSV: ', data.failedRows);
        this.handleError(`There were ${data.failedRows.length} rows in the uploaded file that could not be read.`);
      }
      const uniqueGeos = new Set(data.parsedData.map(d => d.geocode));
      if (uniqueGeos.size !== data.parsedData.length) {
        this.handleError('The file should contain unique geocodes. Please remove duplicates and resubmit the file.');
      } else {
        this.dataService.setCustomData(headerCache.variableName, data.parsedData);
        this.messagingService.showGrowlSuccess('Audience Upload Success', 'Upload Complete');
      }
    } catch (e) {
      this.handleError(`${e}`);
    } finally {
      this.messagingService.stopSpinnerDialog(this.spinnerId);
    }
    if (rows.length > 0) {
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'custom', action: 'upload' });
      this.usageService.createCounterMetric(usageMetricName, '', rows.length);
    }
  }

  private handleError(message: string) : void {
    this.messagingService.stopSpinnerDialog(this.spinnerId);
    this.messagingService.showGrowlError('Audience Upload Error', message);
  }
}
