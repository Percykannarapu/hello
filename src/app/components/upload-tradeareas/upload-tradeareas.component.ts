import { Component, OnInit, ViewChild } from '@angular/core';
import { FileUpload } from 'primeng/primeng';
import * as XLSX from 'xlsx';
import { MessageService } from 'primeng/components/common/messageservice';

@Component({
  selector: 'val-upload-tradeareas',
  templateUrl: './upload-tradeareas.component.html',
  styleUrls: ['./upload-tradeareas.component.css']
})
export class UploadTradeAreasComponent implements OnInit {
  public listType1: string = 'Site';

  @ViewChild('tradeAreaUpload') private fileUploadEl: FileUpload;
  
  constructor(private messageService: MessageService) { }

  ngOnInit() {
  }

  //upload tradearea rings with site numbers and geos: US6879
  public onUploadClick(event: any) : void {
    console.log('Inside Upload TradeAreas:::');
    const reader = new FileReader();
    const name: String = event.files[0].name;
    console.log('file Name:::', name);
    if (name.includes('.xlsx') || name.includes('.xls')) {
      console.log('Includes Excel:::');
      reader.readAsText(event.files[0]);
      reader.onload = () => {
        this.parseExcelFile(event);
      };
      //this.tradeAreaService.applyRadialDefaults
    }
    else {
      reader.readAsText(event.files[0]);
      reader.onload = () => {
        this.onFileUpload(reader.result);
      };
    }
  }
  public parseExcelFile(event: any ) : void {
    console.log('process excel data::');
  
    const target: DataTransfer = <DataTransfer>(event);
    const reader: FileReader = new FileReader();
    reader.readAsBinaryString(target.files[0]);
    reader.onload = () => {
      const bstr: string = reader.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const csvData  = XLSX.utils.sheet_to_csv(ws);
      //console.log('csv data:::data1', csvData);
      this.onFileUpload(csvData);
      this.fileUploadEl.clear();
      // workaround for https://github.com/primefaces/primeng/issues/4816
      this.fileUploadEl.basicFileInput.nativeElement.value = '';

    };
  }

  private onFileUpload(dataBuffer: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    try {
      // const data: ParseResponse<ValGeocodingRequest> = FileService.parseDelimitedData(header, rows, this.csvParseRules, this.csvHeaderValidator);
      // if (data.failedRows.length > 0) {
      //   console.error('There were errors parsing the following rows in the CSV: ', data.failedRows);
      //   this.handleError(`There were ${data.failedRows.length} rows in the uploaded file that could not be read.`);
      // }
      // const classInstances = data.parsedData.map(d => new ValGeocodingRequest(d));
      // this.displayGcSpinner = true;
      const headerCheck: string[] = header.split(/,/);
      if (headerCheck.length == 2){
        console.log('sending to Fuse', header);
      }else{
        this.messageService.add({ severity: 'error', summary: 'Upload Error', detail: `message` });
        console.log('Set A validation message', header);
      }

      // this.siteListService.geocodeAndPersist(classInstances, this.listType).then(() => {
      //   this.displayGcSpinner = false;
      // });
    } catch (e) {
      //this.handleError(`${e}`);
    }
  }

}
