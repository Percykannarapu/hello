import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { ExportMCIssuesLog, DeleteCustomTAMustCoverGeosReset } from 'app/state/data-shim/data-shim.actions';
import { projectIsReady, deleteMustCover } from 'app/state/data-shim/data-shim.selectors';
import { ImpProjectService } from 'app/val-modules/targeting/services/ImpProject.service';
import { ImpProjectPrefService } from 'app/val-modules/targeting/services/ImpProjectPref.service';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as xlsx from 'xlsx';
import { AppProjectPrefService } from '../../../services/app-project-pref.service';
import { AppStateService } from '../../../services/app-state.service';
import { LocalAppState,MustCoverPref } from '../../../state/app.interfaces';
import { ImpGeofootprintGeoService } from '../../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ProjectPrefGroupCodes } from '../../../val-modules/targeting/targeting.enums';
import { AppDiscoveryService } from 'app/services/app-discovery.service';
import { AppLoggingService } from 'app/services/app-logging.service';

interface CustomMCDefinition {
  Number: number;
  geocode: string;
}
@Component({
  selector: 'val-upload-must-cover',
  templateUrl: './upload-must-cover.component.html'
})
export class UploadMustCoverComponent implements OnInit {

   private readonly spinnerId = 'MUST_COVERS_UPLOAD';
   public isDisable: boolean = true;
   public isUpload: boolean = true;
   public tooltip;
   public currentAnalysisLevel$: Observable<string>;
   public totalUploadedRowCount = 0;
   private fileName: string;
   public currentSelection: 'Upload' | 'Manually Add';

   allAnalysisLevels: SelectItem[] = [];
   fileAnalysisLevels: SelectItem[] = [];
   fileAnalysisSelected: string;
   mustCoverGeos: string;
   fileAnalysisLabel: string;
   @Output() isMustCoverExists = new EventEmitter<boolean>();

   @ViewChild('mustCoverUpload', { static: true }) private mustCoverUploadEl: FileUpload;

   constructor(public impGeofootprintGeoService: ImpGeofootprintGeoService
              , private appStateService: AppStateService
              , private appProjectPrefService: AppProjectPrefService
              , private confirmationService: ConfirmationService
              , private impProjectPrefService: ImpProjectPrefService
              , private impProjectService: ImpProjectService
              , private appDiscoveryService: AppDiscoveryService
              , private store$: Store<LocalAppState>
              , private logger: AppLoggingService
              ) {
                this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
                this.appStateService.applicationIsReady$.pipe(filter(ready => ready)).subscribe(() => {
                   this.impGeofootprintGeoService.uploadFailures = [];
                   this.onProjectLoad();
                  });
                this.appStateService.clearUI$.subscribe(() => this.onReset());
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
          this.processMustCovers(geos);
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

    /* this.store$.select(projectIsReady).subscribe((flag) => {
      if (flag){
         this.fileAnalysisSelected = null;
            this.isDisable = true;
            this.impGeofootprintGeoService.uploadFailures = [];
      }
    }); */

    this.store$.select(deleteMustCover).subscribe(isDeleteMustCover => this.switchAnalysisLevel(isDeleteMustCover));
   }

   public onResubmit(data: CustomMCDefinition){
     let csvData = 'Geocode \n';
     csvData = csvData + data.geocode;
     this.onRemove(data);
    this.parseMustcovers(csvData, this.fileName, true, data);
   }

   public onReset(){
      this.fileAnalysisSelected = null;
      this.mustCoverGeos = null;
   }

   public onProjectLoad(){
      const projectPref = this.appProjectPrefService.getPref('Must Cover Manual');
      if(projectPref != null){
         const mustCoverFormData : MustCoverPref = JSON.parse(projectPref.largeVal);
         this.isUpload = false;
         this.fileAnalysisSelected = mustCoverFormData.fileAnalysisLevel;
         this.currentSelection = 'Manually Add';
         this.mustCoverGeos = mustCoverFormData.fileContents;
      }
   }

   public onRemove(data: CustomMCDefinition){
    this.totalUploadedRowCount -= 1;
    this.impGeofootprintGeoService.uploadFailures = this.impGeofootprintGeoService.uploadFailures.filter(f => f.Number !== data.Number);
   }


   private parseMustcovers(dataBuffer: string, fileName: string, isResubmit: boolean = false, customMCDefinition?: CustomMCDefinition){
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    this.impGeofootprintGeoService.parseMustCoverFile(dataBuffer, fileName, analysisLevel, isResubmit, this.fileAnalysisSelected).subscribe();
   }

   private processMustCovers(geos: string[]){
      const mustcoverText =  this.isUpload ? 'Must Cover Upload' : 'Must Cover Manual'; 
      const prefItems : MustCoverPref = {
         fileName: this.isUpload ? this.fileName : 'manual',
         fileContents: geos.join(', '),
         fileAnalysisLevel: this.fileAnalysisSelected,
      };

      if(mustcoverText === 'Must Cover Manual')
         this.appProjectPrefService.createPref(ProjectPrefGroupCodes.MustCover, mustcoverText, JSON.stringify(prefItems));
      else 
      this.appProjectPrefService.createPref(ProjectPrefGroupCodes.MustCover, mustcoverText + name, geos.join(', '));

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
      this.store$.dispatch(new DeleteCustomTAMustCoverGeosReset({ resetFlag: false }));
      const reader = new FileReader();
      this.fileName = event.files[0].name ? event.files[0].name.toLowerCase() : null;
      const key = this.spinnerId;
      const project = this.appStateService.currentProject$.getValue();
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
                  this.totalUploadedRowCount = csvData.split(/\r\n|\n|\r/).length - 2;
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
      //this.fileAnalysisSelected = null;
   }

   onFileAnalysisChange(event: any) : void {
      this.isDisable = this.currentSelection != null && this.currentSelection === 'Manually Add' ? true : false;
      this.fileAnalysisSelected = event;
      this.fileAnalysisLabel = this.allAnalysisLevels.filter(analysis => analysis.value === this.fileAnalysisSelected)[0].label;
      this.tooltip = 'CSV or Excel format, required field is Geocode';
   }

   deleteMustCovers(){

      this.confirmationService.confirm({
         message: 'Do you want to delete all the Must Cover geos?',
         header: 'Delete Must Cover Confirmation',
         icon: 'pi pi-trash',

         accept: () => {
            this.impGeofootprintGeoService.clearMustCovers();
            this.isMustCoverExists.emit(false);
            this.impProjectService.get()[0].impProjectPrefs = this.impProjectPrefService.get().filter(pref => pref.prefGroup !== ProjectPrefGroupCodes.MustCover);
            this.impGeofootprintGeoService.uploadFailures = [];
            /*if (this.impGeofootprintGeoService.uploadFailures.length > 0)
               this.isMustCoverExists = true;*/
            this.isDisable = true;
            this.mustCoverGeos = null;
         },
         reject: () => {
            this.isMustCoverExists.emit(true);
         }
      });
   }

   public onSelectionChange(data: 'Upload' | 'Manually Add') {
      this.currentSelection = data;
      if(this.currentSelection === 'Manually Add'){
         this.isUpload = false;
         this.isDisable = true;
      } else{
         this.isDisable = false;
         this.isUpload = true;
      }
   }

   validateMustCovers(){
      let geos : string[] = ["geocode"];
      let manualFailures: string[] = [];
      const analysisLevel = this.appStateService.analysisLevel$.getValue();
      const manualMustCoverGeos = this.mustCoverGeos.split(/,|,\s|\r\n|\n|\r/);
      manualMustCoverGeos.forEach(geo => {
         geo.replace(" ","");
         if(this.fileAnalysisSelected === 'ZIP' && geo.match(/^[0-9]{5}$/) || (this.fileAnalysisSelected === 'ATZ' && geo.match(/^[0-9]{5}|[0-9]{5}[A-Z]{1}?[0-9]{1}?$/)) ||
               (this.fileAnalysisSelected === 'Digital ATZ' && geo.match(/^[0-9]{5,9}?$/)) || (this.fileAnalysisSelected === 'PCR' && geo.match(/^[0-9]{5}[A-Z]{1}[0-9]{3}$/)) ||
                  (this.fileAnalysisSelected === 'WRAP_MKT_ID' && geo.match(/^[A-Z]{1,8}$/)) || (this.fileAnalysisSelected === 'COUNTY' && geo.match(/^[a-zA-Z ]*$/)) ||
                   (this.fileAnalysisSelected === 'STATE' && geo.match(/^[A-Za-z]{2}$/)) || (this.fileAnalysisSelected === 'DMA' && geo.match(/^[0-9]{4}$/)) || 
                     (this.fileAnalysisSelected === 'INFOSCAN_CODE' && geo.match(/^[0-9]{3}$/)) || (this.fileAnalysisSelected === 'SCANTRACK_CODE')){
            geos.push(geo);
         }
         else
            manualFailures.push(geo);
      });
      if(manualFailures.length > 0)
         this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: 'Invalid Geos, Please check and try again'}));

      this.processMustCovers(geos);
      this.impGeofootprintGeoService.parseMustCoverFile(geos, 'manual', analysisLevel, false, this.fileAnalysisSelected).subscribe();
      geos = [];
      manualFailures = [];
      
   }

   disableDeleteBtn() {
      return this.impGeofootprintGeoService.allMustCoverBS$.value.length > 0 || (this.mustCoverGeos?.length > 0) ;
   }

   rollDownIssuesLog(){
      const records: string[] = [];
      records.push('Geocode' + '\n');
      this.impGeofootprintGeoService.uploadFailures.forEach(record => {
            records.push(`${record.geocode}` + '\n');
      });
      this.store$.dispatch(new ExportMCIssuesLog({uploadFailures: records}));
    }

    switchAnalysisLevel(isDeleteMustCover: boolean){
       if (isDeleteMustCover){
         this.impGeofootprintGeoService.clearMustCovers();
         this.isMustCoverExists.emit(false);
         this.impProjectService.get()[0].impProjectPrefs = this.impProjectPrefService.get().filter(pref => pref.prefGroup !== ProjectPrefGroupCodes.MustCover);
         this.impGeofootprintGeoService.uploadFailures = [];
         this.fileAnalysisSelected = null;
         this.isDisable = true;
       }
    }
}
