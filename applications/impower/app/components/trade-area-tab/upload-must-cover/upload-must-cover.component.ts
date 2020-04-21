import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { ExportMCIssuesLog } from 'app/state/data-shim/data-shim.actions';
import { projectIsReady } from 'app/state/data-shim/data-shim.selectors';
import { ImpProjectService } from 'app/val-modules/targeting/services/ImpProject.service';
import { ImpProjectPrefService } from 'app/val-modules/targeting/services/ImpProjectPref.service';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as xlsx from 'xlsx';
import { AppProjectPrefService } from '../../../services/app-project-pref.service';
import { AppStateService } from '../../../services/app-state.service';
import { LocalAppState } from '../../../state/app.interfaces';
import { ImpGeofootprintGeoService } from '../../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ProjectPrefGroupCodes } from '../../../val-modules/targeting/targeting.enums';

interface CustomMCDefinition {
  Number: number;
  geocode: string;
}

@Component({
  selector: 'val-upload-must-cover',
  templateUrl: './upload-must-cover.component.html',
  styleUrls: ['./upload-must-cover.component.css']
})
export class UploadMustCoverComponent implements OnInit {

   private readonly spinnerId = 'MUST_COVERS_UPLOAD';
   public isDisable: boolean = true;
   public tooltip;
   public currentAnalysisLevel$: Observable<string>;
   public totalUploadedRowCount = 0;
   private fileName: string;
   //public isMustCoverExists: boolean;

   allAnalysisLevels: SelectItem[] = [];
   fileAnalysisLevels: SelectItem[] = [];
   fileAnalysisSelected: string;
   fileAnalysisLabel: string;
   @Output() isMustCoverExists = new EventEmitter<boolean>();

   @ViewChild('mustCoverUpload', { static: true }) private mustCoverUploadEl: FileUpload;

   constructor(public impGeofootprintGeoService: ImpGeofootprintGeoService
              , private appStateService: AppStateService
              , private appProjectPrefService: AppProjectPrefService
              , private confirmationService: ConfirmationService
              , private impProjectPrefService: ImpProjectPrefService
              , private impProjectService: ImpProjectService
              , private store$: Store<LocalAppState>) {
                this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
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

    this.tooltip = 'Please select an Analysis Level before uploading a Must Cover file';

    this.impGeofootprintGeoService.uploadFailuresObs$.subscribe(result => {
         this.impGeofootprintGeoService.uploadFailures.push(...result);
         this.impGeofootprintGeoService.uploadFailures.sort(( a, b ) => (a.geocode > b.geocode) ? 1 : -1 );
         //this.isMustCoverExists.emit(true);
         this.impGeofootprintGeoService.makeDirty();
    });

    this.appStateService.currentProject$.pipe(filter(p => p != null)).subscribe(project => {
       this.isMustCoverExists.emit(project.impProjectPrefs.some(pref => pref.prefGroup === 'MUSTCOVER' && pref.getVal() != null));
       /*if (this.impGeofootprintGeoService.uploadFailures.length > 0)
         this.isMustCoverExists.emit(true);*/
    });

    this.impGeofootprintGeoService.allMustCoverBS$.subscribe(geos => {
         if (geos.length > 0)
          this.processMuctCovers(geos);
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

    this.store$.select(projectIsReady).subscribe((flag) => {
      if (flag)
      this.impGeofootprintGeoService.uploadFailures = [];
    });

   }

   public onResubmit(data: CustomMCDefinition){
     let csvData = 'Geocode \n';
     csvData = csvData + data.geocode;
     this.onRemove(data);
    this.parseMustcovers(csvData, this.fileName, true, data);

   }

   public onRemove(data: CustomMCDefinition){
    this.totalUploadedRowCount -= 1;
    this.impGeofootprintGeoService.uploadFailures = this.impGeofootprintGeoService.uploadFailures.filter(f => f.Number !== data.Number);
   }


   private parseMustcovers(dataBuffer: string, fileName: string, isResubmit: boolean = false, customMCDefinition?: CustomMCDefinition){
    //let uniqueGeos: string[] = [];
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    this.impGeofootprintGeoService.parseMustCoverFile(dataBuffer, fileName, analysisLevel, isResubmit, this.fileAnalysisSelected).subscribe();
   }

   private processMuctCovers(geos: string[]){
      const mustcovetText =  'Must Cover Upload';
      this.appProjectPrefService.createPref(ProjectPrefGroupCodes.MustCover, mustcovetText + name, geos.join(', '));
      //ensure mustcover are active
      const uniqueGeoSet = new Set(geos);
      this.impGeofootprintGeoService.get().forEach(geo => {
          if (uniqueGeoSet.has(geo.geocode)){
                geo.isActive = true;
             }
       });
      this.isMustCoverExists.emit(geos.length > 0);
      this.impGeofootprintGeoService.makeDirty();
   }

   public uploadFile(event: any) : void {
      const reader = new FileReader();
      this.fileName = event.files[0].name ? event.files[0].name.toLowerCase() : null;
      const key = this.spinnerId;
      const project = this.appStateService.currentProject$.getValue();
      //let uniqueGeos: string[] = [];
      if (name != null) {
         this.store$.dispatch(new StartBusyIndicator({ key, message: 'Loading Must Cover Data'}));
         if (this.fileName.includes('.xlsx') || this.fileName.includes('.xls')) {
            reader.readAsBinaryString(event.files[0]);
            reader.onload = () => {
               try {
                  const wb: xlsx.WorkBook = xlsx.read(reader.result, {type: 'binary'});
                  const worksheetName: string = wb.SheetNames[0];
                  const ws: xlsx.WorkSheet = wb.Sheets[worksheetName];
                  const csvData  = xlsx.utils.sheet_to_csv(ws);
                  this.parseMustcovers(csvData, this.fileName);
                  this.totalUploadedRowCount = csvData.split(/\r\n|\n/).length - 2;
               }
               catch (e) {
                  this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: e}));
               }
               finally {
                  this.store$.dispatch(new StopBusyIndicator({ key: key }));
               }
            };
         }
         else {
            reader.readAsText(event.files[0]);
            reader.onload = () => {
               try {
                this.parseMustcovers(reader.result.toString(), this.fileName);
                this.totalUploadedRowCount = reader.result.toString().split(/\r\n|\n/).length - 2;
               }
               catch (e) {
                  this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: e}));
               }
               finally {
                  this.store$.dispatch(new StopBusyIndicator({ key: key }));
                  // Create a new project pref for the upload file

               }
            };
         }
      }
      this.mustCoverUploadEl.clear();
      this.mustCoverUploadEl.basicFileInput.nativeElement.value = ''; // workaround for https://github.com/primefaces/primeng/issues/4816
      //this.isDisable = true;
      //this.fileAnalysisSelected = null;
   }

   onFileAnalysisChange(event: any) : void {
      this.isDisable = false;
      this.fileAnalysisSelected = event;
      this.fileAnalysisLabel = this.allAnalysisLevels.filter(analysis => analysis.value === this.fileAnalysisSelected)[0].label;
      this.tooltip = 'CSV or Excel format, required field is Geocode';
   }

   deleteMustCovers(){

      this.confirmationService.confirm({
         message: 'Do you want to delete all the Must Cover geos?',
         header: 'Delete Must Cover Confirmation',
         icon: 'ui-icon-delete',

         accept: () => {
            this.impGeofootprintGeoService.clearMustCovers();
            this.isMustCoverExists.emit(false);
            this.impProjectService.get()[0].impProjectPrefs = this.impProjectPrefService.get().filter(pref => pref.prefGroup !== ProjectPrefGroupCodes.MustCover);
            this.impGeofootprintGeoService.uploadFailures = [];
            /*if (this.impGeofootprintGeoService.uploadFailures.length > 0)
               this.isMustCoverExists = true;*/
            this.fileAnalysisSelected = null;
            this.isDisable = true;
         },
         reject: () => {
            this.isMustCoverExists.emit(true);
         }
      });
   }

   disableDeleteBtn(){
      return this.impGeofootprintGeoService.allMustCoverBS$.value.length > 0 ;
   }

   rollDownIssuesLog(){
      const records: string[] = [];
      records.push('Geocode' + '\n');
      this.impGeofootprintGeoService.uploadFailures.forEach(record => {
            records.push(`${record.geocode}` + '\n');
      });
      this.store$.dispatch(new ExportMCIssuesLog({uploadFailures: records}));
    }
}
