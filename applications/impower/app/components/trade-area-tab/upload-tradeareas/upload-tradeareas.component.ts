import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator, WarningNotification } from '@val/messaging';
import { ExportCustomTAIssuesLog } from 'app/state/data-shim/data-shim.actions';
import { projectIsReady } from 'app/state/data-shim/data-shim.selectors';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { MessageService } from 'primeng/components/common/messageservice';
import { FileUpload } from 'primeng/fileupload';
import { BehaviorSubject, Observable, of, EMPTY } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { AppEditSiteService } from '../../../services/app-editsite.service';
import { AppGeoService } from '../../../services/app-geo.service';
import { AppStateService } from '../../../services/app-state.service';
import { AppTradeAreaService } from '../../../services/app-trade-area.service';
import { LocalAppState } from '../../../state/app.interfaces';
import { FileService, Parser, ParseResponse, ParseRule } from '../../../val-modules/common/services/file.service';
import { LoggingService } from '../../../val-modules/common/services/logging.service';
import { ImpGeofootprintLocation } from '../../../val-modules/targeting/models/ImpGeofootprintLocation';
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
  //headerValidator: (found: ParseRule[]) => found.length === 2,

  createNullParser: (header: string, isUnique?: boolean) : ParseRule => {
    return { headerIdentifier: '', outputFieldName: header, dataProcess: data => data};
  }
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
  //public isCustomTAExists: boolean;
  public isDisable: boolean = true;
  public currentAnalysisLevel$: Observable<string>;
  public deleteFlag: boolean = false;
  public tooltip;

  allAnalysisLevels: SelectItem[] = [];
  fileAnalysisLevels: SelectItem[] = [];
  fileAnalysisSelected: string;
  fileAnalysisLabel: string;

  public deleteConfirmFlag$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  @Output() isCustomTAExists = new EventEmitter<boolean>();


  @ViewChild('tradeAreaUpload', { static: true }) private fileUploadEl: FileUpload;

  constructor(private messageService: MessageService,
              private appGeoService: AppGeoService,
              private stateService: AppStateService,
              private tradeAreaService: AppTradeAreaService,
              private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
              private confirmationService: ConfirmationService,
              private appEditSiteService: AppEditSiteService,
              private logger: LoggingService,
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
      this.logger.debug.log('currentProject is customTA', project.impGeofootprintMasters[0].impGeofootprintLocations.some(loc => loc.impGeofootprintTradeAreas.some(ta => ta.taType === 'CUSTOM' && ta.impGeofootprintGeos.length > 0)));
      this.isCustomTAExists.emit(project.impGeofootprintMasters[0].impGeofootprintLocations.some(loc => loc.impGeofootprintTradeAreas.some(ta => ta.taType === 'CUSTOM' && ta.impGeofootprintGeos.length > 0)))  ;
    });

    this.appEditSiteService.customTradeAreaData$.subscribe(message => {
      if (message != null) {
        this.parseCsvFile(message.data);
      }
    });

    this.tradeAreaService.uploadFailuresObs$.subscribe(result => {
      this.uploadFailures.push(...result);
      this.uploadFailures.sort((a, b) => (a.geocode > b.geocode) ? 1 : -1);
      this.isCustomTAExists.emit(this.impGeofootprintTradeAreaService.get().some(ta => ta.taType === 'CUSTOM' && ta.impGeofootprintGeos.length > 0));
    });

    this.currentAnalysisLevel$.subscribe(val => {
      switch (val){
        case 'ZIP' :
            this.fileAnalysisLevels = this.allAnalysisLevels.filter(v =>  v.value !== 'ATZ' && v.value !== 'PCR' && v.value !== 'Digital ATZ');
            break;
        case 'ATZ' :
            this.fileAnalysisLevels = this.allAnalysisLevels.filter(v =>  v.value !== 'Digital ATZ' && v.value !== 'PCR');
            break;
        case 'Digital ATZ':
            this.fileAnalysisLevels = this.allAnalysisLevels.filter(v =>  v.value !== 'PCR');
            break;
        default:
            this.fileAnalysisLevels = this.allAnalysisLevels;
            break;
      }
    });
    this.tooltip = 'Please select an Analysis Level before uploading a Custom TA file';

    this.store$.select(projectIsReady).subscribe((flag) => {
      if (flag){
        this.fileAnalysisSelected = null;
           this.isDisable = true;
           this.uploadFailures = [];
           this.listType1 = 'Site';
           //this.currentAnalysisLevel$.subscribe(val => val = null).unsubscribe();
     }
      
    });
  }

  public onResubmit(data: TradeAreaDefinition) {
    this.onRemove(data);
    data.message = null;
    this.processUploadedTradeArea([data], true);
  }

  public onRemove(data: TradeAreaDefinition) {
    this.totalUploadedRowCount -= 1;
    this.uploadFailures = this.uploadFailures.filter(f => f !== data);
  }

  //upload trade areas with site numbers and geos: US6879 tradeAreaUpload
  public onUploadClick(event: any) : void {
    const reader = new FileReader();
    const name: String = event.files[0].name;
    this.logger.debug.log('file Name:::', name);
    this.confirmationService.confirm({
        message: 'You are about to change analysis level and you have',
        header: 'Change Analysis Level',
        key: 'analysisLevelChange',
        accept: () => {
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
        }
    });

    this.stateService.uniqueIdentifiedGeocodes$.pipe(
      filter(geos => geos != null && geos.length > 0),
      take(1)
    ).subscribe (null, null, () => this.tradeAreaService.zoomToTradeArea());

    this.fileUploadEl.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.fileUploadEl.basicFileInput.nativeElement.value = '';
    //this.isDisable = true;
    //this.fileAnalysisSelected = null;
  }

  // to process excel upload data
  private parseExcelFile(bstr: string | ArrayBuffer) : void {
    this.logger.debug.log('process excel data::');
    try {
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const worksheetName: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[worksheetName];
      const csvData = XLSX.utils.sheet_to_csv(ws);
      this.parseCsvFile(csvData);
    } catch (e) {
      this.logger.error.log('Error converting Excel sheet to CSV', e);
    }
  }

  private parseCsvFile(dataBuffer: string) {
    const key = 'CUSTOM_TRADEAREA';
    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Applying Custom Trade Area'}));
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    if (header.split(/,/).length >= 2) {
      const uniqueRows: string[] = [];
      const duplicateRows: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        if (uniqueRows.indexOf(rows[i]) == -1) {
          uniqueRows.push(rows[i]);
        } else {
          duplicateRows.push(rows[i]);

        }
      }
      try {
        if (duplicateRows.length > 0) {
          this.store$.dispatch(new WarningNotification({ message: 'The upload file contains duplicate rows. Processing will continue, though you may want to re-evaluate the upload file.', notificationTitle: 'Custom TA Upload' }));
        }
          const data: ParseResponse<TradeAreaDefinition> = FileService.parseDelimitedData(header, uniqueRows, tradeAreaUpload);
          if (data != null) {
            const failedCount = data.failedRows ? data.failedRows.length : 0;
            const successCount = data.parsedData ? data.parsedData.length : 0;
            this.totalUploadedRowCount = failedCount;
            if (failedCount > 0) {
              this.messageService.add({summary: 'Upload Error', detail: `There were ${failedCount} rows that could not be parsed. See the F12 console for more details.`});
              this.logger.error.log('Failed Trade Area Upload Rows:', data.failedRows);
            }
            if (successCount > 0) {
              //this.isCustomTAExists.emit(true);
              this.processUploadedTradeArea(data.parsedData);
            }
            //this.store$.dispatch(new StopBusyIndicator({ key}));
          } else {
            this.store$.dispatch(new StopBusyIndicator({ key}));
            this.messageService.add({summary: 'Upload Error', detail: `The file must contain two columns: Site Number and Geocode.` });
          }
         /*else {
          this.store$.dispatch(new StopBusyIndicator({ key}));
          this.store$.dispatch(new WarningNotification({ message: 'The upload file contains duplicate rows. Processing will continue, though you may want to re-evaluate the upload file.', notificationTitle: 'Custom TA Upload' }));
        }*/
      } catch (e) {
          this.logger.debug.log('There was an error parsing the uploaded data', e);
          this.store$.dispatch(new StopBusyIndicator({ key}));
          this.store$.dispatch(new ErrorNotification({ message: 'Site # and Geocode are required columns in the upload file.', notificationTitle: 'Custom TA Upload' }));
      }
    } else {
      this.store$.dispatch(new StopBusyIndicator({ key}));
      this.store$.dispatch(new ErrorNotification({ message: 'Site # and Geocode are required columns in the upload file.', notificationTitle: 'Custom TA Upload' }));
    }
  }

  public onFileAnalysisChange(event: any) : void {
    this.fileAnalysisSelected = event;
    this.fileAnalysisLabel = this.allAnalysisLevels.filter(analysis => analysis.value === this.fileAnalysisSelected)[0].label;
    this.isDisable = false;
    this.tooltip = 'CSV or Excel format, required fields are Site #, Geocode';
    //!this.isDisable ? 'Please select an Analysis Level before uploading a Custom TA file' : 'CSV or Excel format, required fields are Site #, Geocode';
  }

  private processUploadedTradeArea(data: TradeAreaDefinition[], isResubmit: boolean = false) : void {
    this.totalUploadedRowCount += data.length;
    this.tradeAreaService.applyCustomTradeArea(data, this.fileAnalysisSelected, isResubmit);
  }

  public deleteCustomTradeArea() : void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete your custom trade area?',
      header: 'Delete Custom TA',
      key: 'delete',
      accept: () => {
        this.tradeAreaService.deleteTradeAreas(this.impGeofootprintTradeAreaService.get().filter(ta => ta.taType === 'CUSTOM' || ta.taType === 'HOMEGEO'));
        this.appGeoService.ensureMustCovers();
        this.isCustomTAExists.emit(false);
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
        this.fileAnalysisSelected = null;
        this.isDisable = true;
      }
    });
  }

  disableDeleteBtn(){
    return this.impGeofootprintTradeAreaService.get().filter(ta => ta.taType === 'CUSTOM').length > 0;
 }

  rollDownIssuesLog(){
    this.store$.dispatch(new ExportCustomTAIssuesLog({uploadFailures: this.uploadFailures}));
  }
}
