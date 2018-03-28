import { Component, OnInit, ViewChild } from '@angular/core';
import { siteListUploadRules } from './upload.rules';
import { FileService, ParseResponse, ParseRule } from '../../val-modules/common/services/file.service';
import { FileUpload } from 'primeng/primeng';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import * as XLSX from 'xlsx';
import { MessageService } from 'primeng/components/common/messageservice';
import { ImpDiscoveryUI } from '../../models/ImpDiscoveryUI';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { AppConfig } from '../../app.config';
import { EsriQueryService } from '../../esri-modules/layers/esri-query.service';
import { ValTradeAreaService } from '../../services/app-trade-area.service';
import { EsriUtils } from '../../esri-modules/core/esri-utils.service';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';

@Component({
  selector: 'val-upload-tradeareas',
  templateUrl: './upload-tradeareas.component.html',
  styleUrls: ['./upload-tradeareas.component.css']
})
export class UploadTradeAreasComponent implements OnInit {
  public listType1: string = 'Site';
  private tradeAreasForInsert: ImpGeofootprintTradeArea[] = [];
  public impGeofootprintLocations: ImpGeofootprintLocation[];
  private csvParseRules: ParseRule[] = siteListUploadRules;
  //private csvHeaderValidator: (foundHeaders: ParseRule[]) => boolean = siteUploadHeaderValidator;

  @ViewChild('tradeAreaUpload') private fileUploadEl1: FileUpload;

  constructor(private messageService: MessageService,
    private impDiscoveryService: ImpDiscoveryService, private appConfig: AppConfig,
    private esriQueryService: EsriQueryService,
    private tradeAreaService: ValTradeAreaService,
    private impGeofootprintLocationService: ImpGeofootprintLocationService) { }

  ngOnInit() {
  }

  //upload tradearea rings with site numbers and geos: US6879
  public onUploadClick(event: any): void {
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

    }
    else {
      reader.readAsText(event.files[0]);
      reader.onload = () => {
        this.onFileUpload(reader.result);
      };
    }
  }
  public parseExcelFile(event: any): void {
    console.log('process excel data::');

    const target: DataTransfer = <DataTransfer>(event);
    const reader: FileReader = new FileReader();
    reader.readAsBinaryString(target.files[0]);
    reader.onload = () => {
      const bstr: string = reader.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const csvData = XLSX.utils.sheet_to_csv(ws);
      //console.log('csv data:::data1', csvData);
      this.onFileUpload(csvData);
      this.fileUploadEl1.clear();
      // workaround for https://github.com/primefaces/primeng/issues/4816
      //this.fileUploadEl1.basicFileInput.nativeElement.value = '';

    };
  }

  private onFileUpload(dataBuffer: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    try {
      // if (data.failedRows.length > 0) {
      //   console.error('There were errors parsing the following rows in the CSV: ', data.failedRows);
      //   this.handleError(`There were ${data.failedRows.length} rows in the uploaded file that could not be read.`);
      // }
      // const classInstances = data.parsedData.map(d => new ValGeocodingRequest(d));
      // this.displayGcSpinner = true;
      const discoveryUI: ImpDiscoveryUI[] = this.impDiscoveryService.get();
      let customIndex: number = 0;
      const analysisLevel = discoveryUI[0].analysisLevel;
      const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(analysisLevel, false);

      const data: ParseResponse<ValGeocodingRequest> = FileService.parseDelimitedData(header, rows, this.csvParseRules);
      const headerCheck: string[] = header.split(/,/);

      if (headerCheck.length == 2) {

        for (let i = 0; i < data.parsedData.length; i++) {
          if (data.parsedData[i].STORE == this.impGeofootprintLocationService.get()[i].locationNumber) {
            console.log('this.impGeofootprintLocations::', this.impGeofootprintLocationService.get()[i]);
            //draw the tradearea selection points for the geos given in the xls/csv

            const impGeofootprintLocations = this.impGeofootprintLocationService.get()[i];
            const geocodesList = data.parsedData[i];

            customIndex++;

            //this.impGeofootprintLocations.push(this.impGeofootprintLocationService.get()[i]);
            console.log('AnalysisLevel  ::', impGeofootprintLocations);
            console.log('Rows ::', data.parsedData[i]);
          }

        }
        //const sub = this.esriQueryService.queryAttributeIn({ portalLayerId: portalLayerId }, 'geocode', geocodesList, true);
        //this.uploadTradeAreas(data.parsedData);
      } else {
        this.messageService.add({ severity: 'error', summary: 'Upload Error', detail: `The file must contain two columns: Site Number and Geocode.` });
        console.log('Set A validation message', header);
      }

      // this.siteListService.geocodeAndPersist(classInstances, this.listType).then(() => {
      //   this.displayGcSpinner = false;
      // });
    } catch (e) {
      this.handleError(`${e}`);
    }
  }

  private uploadTradeAreas(impGeofootprintLocations) {
  //Helper method for selecting polys with matched site #
    this.tradeAreasForInsert = [];
    console.log('Do the action ::', impGeofootprintLocations);

  }

  //Create a custom trade area 
  public createCustomTradeArea(index: number, location: ImpGeofootprintLocation, isActive: boolean, radius?: number): ImpGeofootprintTradeArea {
    return new ImpGeofootprintTradeArea({
      //gtaId: ValTradeAreaService.id++,
      taNumber: index + 1,
      taName: `${location.clientLocationTypeCode} CUSTOM ${index + 1}`,
      taRadius: (radius !== null ? radius : 0),
      taType: 'CUSTOM',
      impGeofootprintLocation: location,
      isActive: (isActive ? 1 : 0)
    });
  }

  private handleError(message: string): void {
    //this.displayGcSpinner = false;
    this.messageService.add({ severity: 'error', summary: 'Geocoding Error', detail: message });
  }

}
