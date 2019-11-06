import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { EsriQueryService } from '@val/esri';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { MessageService } from 'primeng/components/common/messageservice';
import { FileUpload } from 'primeng/fileupload';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { AppConfig } from '../../../app.config';
import { AppEditSiteService } from '../../../services/app-editsite.service';
import { AppGeoService } from '../../../services/app-geo.service';
import { AppStateService } from '../../../services/app-state.service';
import { AppTradeAreaService } from '../../../services/app-trade-area.service';
import { LocalAppState } from '../../../state/app.interfaces';
import { FileService, Parser, ParseResponse, ParseRule } from '../../../val-modules/common/services/file.service';
import { ImpGeofootprintLocation } from '../../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpDomainFactoryService } from '../../../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintGeoService } from '../../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintTradeAreaService } from '../../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';

interface TradeAreaDefinition {
  store: string;
  geocode: string;
  message: string;
}

const tradeAreaUpload: Parser<TradeAreaDefinition> = {
  columnParsers: [
    { headerIdentifier: ['STORE', 'SITE', 'LOC', 'Site #', 'NUMBER'], outputFieldName: 'store', required: true},
    { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true},
  ],
  headerValidator: (found: ParseRule[]) => found.length === 2
};

@Component({
  selector: 'val-upload-tradeareas',
  templateUrl: './upload-tradeareas.component.html',
  styleUrls: ['./upload-tradeareas.component.scss']
})
export class UploadTradeAreasComponent implements OnInit {
  public listType1: string = 'Site';
  public impGeofootprintLocations: ImpGeofootprintLocation[];
  public uploadFailures: TradeAreaDefinition[] = [];
  public totalUploadedRowCount = 0;
  public isCustomTAExists: boolean;
  public currentAnalysisLevel$: Observable<string>;
  public deleteFlag: boolean = false;

  allAnalysisLevels: SelectItem[] = []; 
  fileAnalysisLevels: SelectItem[] = []; 
  fileAnalysisSelected: string;

  public deleteConfirmFlag$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


  @ViewChild('tradeAreaUpload', { static: true }) private fileUploadEl: FileUpload;

  constructor(private messageService: MessageService,
    private appConfig: AppConfig,
    private appGeoService: AppGeoService,
    private stateService: AppStateService,
    private esriQueryService: EsriQueryService,
    private tradeAreaService: AppTradeAreaService,
    private impGeofootprintLocationService: ImpGeofootprintLocationService,
    private impGeoService: ImpGeofootprintGeoService,
    private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
    private domainFactory: ImpDomainFactoryService,
    private confirmationService: ConfirmationService,
    private appEditSiteService: AppEditSiteService,
    private store$: Store<LocalAppState>) {
    this.currentAnalysisLevel$ = this.stateService.analysisLevel$;

  }

  ngOnInit() {

    this.allAnalysisLevels = [
      {label: 'ZIP', value: 'ZIP'},
      {label: 'ATZ', value: 'ATZ'},
      {label: 'Digital ATZ', value: 'Digital ATZ'},
      {label: 'PCR', value: 'PCR'},
      {label: 'Wrap Zone', value: 'WRAP_MKT_ID'},
      {label: 'County', value: 'COUNTY'},
      {label: 'State', value: 'STATE'},
      {label: 'DMA', value: 'DMA'},
      {label: 'Infoscan', value: 'INFOSCAN_CODE'},
      {label: 'Scantrack', value: 'SCANTRACK_CODE'}
    ];

    this.stateService.currentProject$.pipe(filter(p => p != null)).subscribe(project => {
      this.isCustomTAExists = project.impGeofootprintMasters[0].impGeofootprintLocations.some(loc => loc.impGeofootprintTradeAreas.some(ta => ta.taType === 'CUSTOM' && ta.impGeofootprintGeos.length > 0));
    });

    this.appEditSiteService.customTradeAreaData$.subscribe(message => {
      if (message != null) {
        this.parseCsvFile(message.data);
      }
    });

    this.tradeAreaService.uploadFailuresObs$.subscribe(result => {
      this.uploadFailures.push(...result);
    });

    this.currentAnalysisLevel$.subscribe(val => {
      this.fileAnalysisSelected = val;
      switch (val){
        case 'ZIP' :
            this.fileAnalysisLevels = this.allAnalysisLevels.filter(v =>  v.value !== 'ATZ' && v.value !== 'PCR' && v.value !== 'DTZ');
            break;
        case 'ATZ' :  
            this.fileAnalysisLevels = this.allAnalysisLevels.filter(v =>  v.value !== 'DTZ' && v.value !== 'PCR');  
            break;
        case 'Digital ATZ':
            this.fileAnalysisLevels = this.allAnalysisLevels.filter(v =>  v.value !== 'PCR');
            break;
        default:
            this.fileAnalysisLevels = this.allAnalysisLevels;
            break;    
      }  
    });
  }

  public onResubmit(data: TradeAreaDefinition) {
    this.onRemove(data);
    data.message = null;
    this.processUploadedTradeArea([data]);
  }

  public onRemove(data: TradeAreaDefinition) {
    this.totalUploadedRowCount -= 1;
    this.uploadFailures = this.uploadFailures.filter(f => f !== data);
  }

  //upload trade areas with site numbers and geos: US6879 tradeAreaUpload
  public onUploadClick(event: any) : void {
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
        this.parseCsvFile(reader.result as string);
      };
    }

    this.stateService.uniqueIdentifiedGeocodes$.pipe(
      filter(geos => geos != null && geos.length > 0),
      take(1)
    ).subscribe (null, null, () => this.tradeAreaService.zoomToTradeArea());

    this.fileUploadEl.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.fileUploadEl.basicFileInput.nativeElement.value = '';
  }

  // to process excel upload data
  private parseExcelFile(bstr: string | ArrayBuffer) : void {
    console.log('process excel data::');
    try {
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const worksheetName: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[worksheetName];
      const csvData = XLSX.utils.sheet_to_csv(ws);
      this.parseCsvFile(csvData);
    } catch (e) {
      console.error('Error converting Excel sheet to CSV', e);
    }
  }

  private parseCsvFile(dataBuffer: string) {
    const key = 'CUSTOM_TRADEAREA';
    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Creating Custom Trade Area'}));
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    if (header.split(/,/).length == 2) {
      const uniqueRows: string[] = [];
      const duplicateRows: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        if (uniqueRows.indexOf(rows[i]) == -1) {
          uniqueRows.push(rows[i]);
        } else {
          duplicateRows.push(rows[i]);
          if (duplicateRows.length > 0) {
            break;
          }
        }
      }
      try {
        if (!(duplicateRows.length > 0)) {
          const data: ParseResponse<TradeAreaDefinition> = FileService.parseDelimitedData(header, rows, tradeAreaUpload);
          if (data != null) {
            const failedCount = data.failedRows ? data.failedRows.length : 0;
            const successCount = data.parsedData ? data.parsedData.length : 0;
            this.totalUploadedRowCount = failedCount;
            if (failedCount > 0) {
              this.messageService.add({summary: 'Upload Error', detail: `There were ${failedCount} rows that could not be parsed. See the F12 console for more details.`});
              console.error('Failed Trade Area Upload Rows:', data.failedRows);
            }
            if (successCount > 0) {
              this.isCustomTAExists = true;
              this.processUploadedTradeArea(data.parsedData);
            }
            this.store$.dispatch(new StopBusyIndicator({ key}));
          } else {
            this.store$.dispatch(new StopBusyIndicator({ key}));
            this.messageService.add({summary: 'Upload Error', detail: `The file must contain two columns: Site Number and Geocode.` });
          }
        } else {
          this.store$.dispatch(new StopBusyIndicator({ key}));
          this.store$.dispatch(new ErrorNotification({ message: 'Upload file contains duplicating Site/Geo Combinations.', notificationTitle: 'Error Uploading Custom TA' }));
        }
      } catch (e) {
          console.log('There was an error parsing the uploaded data', e);
          this.store$.dispatch(new ErrorNotification({ message: 'Upload file must contain a Site # column and a Geocode column.', notificationTitle: 'Error Uploading Custom TA' }));
      } finally {
        this.store$.dispatch(new StopBusyIndicator({ key }));
      }
    } else {
      this.store$.dispatch(new StopBusyIndicator({ key}));
      this.store$.dispatch(new ErrorNotification({ message: 'Upload file must contain a Site # column and a Geocode column.', notificationTitle: 'Error Uploading Custom TA' }));
    }
  }

  private processUploadedTradeArea(data: TradeAreaDefinition[]) : void {
    this.totalUploadedRowCount += data.length;
    this.tradeAreaService.applyCustomTradeArea(data, this.fileAnalysisSelected);

  }

  public deleteCustomTradeArea() : void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete your custom trade area?',
      header: 'Delete Custom TA',
      key: 'delete',
      accept: () => {
        this.tradeAreaService.deleteTradeAreas(this.impGeofootprintTradeAreaService.get().filter(ta => ta.taType === 'CUSTOM' || ta.taType === 'HOMEGEO'));
        this.appGeoService.ensureMustCovers();
        this.isCustomTAExists = false;
        if (this.impGeofootprintTradeAreaService.get().filter(ta => ta.taType === 'MANUAL' && ta.impGeofootprintGeos.length > 0).length > 0) {
          this.confirmationService.confirm({
            message: 'Would you like to also delete the manually selected geos?',
            header: 'Delete Manual Geos',
            accept: () => {
                this.tradeAreaService.deleteTradeAreas(this.impGeofootprintTradeAreaService.get().filter(ta => ta.taType === 'MANUAL'));
                this.appGeoService.ensureMustCovers();
            }
          });
        }
        this.uploadFailures = [];
      }
    });
  }
}
