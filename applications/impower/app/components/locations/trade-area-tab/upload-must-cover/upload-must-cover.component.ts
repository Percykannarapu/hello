import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { isNotNil } from '@val/common';
import { ErrorNotification, MessageBoxService, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { DeleteCustomTAMustCoverGeosReset, ExportMCIssuesLog } from 'app/state/data-shim/data-shim.actions';
import { deleteMustCover } from 'app/state/data-shim/data-shim.selectors';
import { ImpProjectService } from 'app/val-modules/targeting/services/ImpProject.service';
import { ImpProjectPrefService } from 'app/val-modules/targeting/services/ImpProjectPref.service';
import { PrimeIcons, SelectItem } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as xlsx from 'xlsx';
import { ProjectPrefGroupCodes } from '../../../../../worker-shared/data-model/impower.data-model.enums';
import { AppProjectPrefService } from '../../../../services/app-project-pref.service';
import { AppStateService } from '../../../../services/app-state.service';
import { LocalAppState, MustCoverPref } from '../../../../state/app.interfaces';
import { ImpGeofootprintGeoService } from '../../../../val-modules/targeting/services/ImpGeofootprintGeo.service';

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
   public tooltip = 'Please select an Analysis Level before uploading a Must Cover file';
   public manualToolTip;
   public currentAnalysisLevel$: Observable<string>;
   public totalUploadedRowCount = 0;
   private fileName: string;
   public currentSelection: 'Upload' | 'Manually Add';

   allAnalysisLevels: SelectItem[] = [
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
   fileAnalysisLevels: SelectItem[] = [];
   fileAnalysisSelected: string;
   mustCoverGeos: string;
   fileAnalysisLabel: string;
   @Output() isMustCoverExists = new EventEmitter<boolean>();

   @ViewChild('mustCoverUpload', { static: true }) private mustCoverUploadEl: FileUpload;

   constructor(public impGeofootprintGeoService: ImpGeofootprintGeoService,
               private appStateService: AppStateService,
               private appProjectPrefService: AppProjectPrefService,
               private impProjectPrefService: ImpProjectPrefService,
               private impProjectService: ImpProjectService,
               private messageService: MessageBoxService,
               private store$: Store<LocalAppState>) {}

   ngOnInit() {
     this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
     this.appStateService.applicationIsReady$.pipe(filter(ready => ready)).subscribe(() => {
       this.impGeofootprintGeoService.uploadFailures = [];
     });
     this.appStateService.clearUI$.subscribe(() => this.onReset());

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

    this.store$.select(deleteMustCover).subscribe(isDeleteMustCover => this.switchAnalysisLevel(isDeleteMustCover));
   }

   public onResubmit(data: CustomMCDefinition){
     let csvData = 'Geocode \n';
     csvData = csvData + data.geocode;
     this.onRemove(data);
    this.parseMustCovers(csvData, this.fileName, true);
   }

   public onReset(){
      this.fileAnalysisSelected = null;
      this.mustCoverGeos = null;
   }

   public onRemove(data: CustomMCDefinition){
    this.totalUploadedRowCount -= 1;
    this.impGeofootprintGeoService.uploadFailures = this.impGeofootprintGeoService.uploadFailures.filter(f => f.Number !== data.Number);
   }

   private parseMustCovers(dataBuffer: string, fileName: string, isResubmit: boolean = false){
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    this.impGeofootprintGeoService.parseMustCoverFile(dataBuffer, fileName, analysisLevel, isResubmit, this.fileAnalysisSelected).subscribe();
   }

   private processMustCovers(geos: string[]){
      const mustCoverText =  this.isUpload ? 'Must Cover Upload' : 'Must Cover Manual';
      const prefItems: MustCoverPref = {
         fileName: this.isUpload ? this.fileName : 'manual',
         fileContents: geos.join(', '),
         fileAnalysisLevel: this.fileAnalysisSelected,
      };

      if (mustCoverText === 'Must Cover Manual') {
        this.appProjectPrefService.createPref(ProjectPrefGroupCodes.MustCover, mustCoverText, JSON.stringify(prefItems));
      } else {
        this.appProjectPrefService.createPref(ProjectPrefGroupCodes.MustCover, mustCoverText + this.fileName, geos.join(', '));
      }

      //ensure must cover are active
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
      if (isNotNil(this.fileName)) {
         this.store$.dispatch(new StartBusyIndicator({ key, message: 'Loading Must Cover Data'}));
         if (this.fileName.includes('.xlsx') || this.fileName.includes('.xls')) {
            reader.readAsBinaryString(event.files[0]);
            reader.onload = () => {
               try {
                  const wb: xlsx.WorkBook = xlsx.read(reader.result, {type: 'binary'});
                  const worksheetName: string = wb.SheetNames[0];
                  const ws: xlsx.WorkSheet = wb.Sheets[worksheetName];
                  const csvData  = xlsx.utils.sheet_to_csv(ws);
                  this.parseMustCovers(csvData, this.fileName);
                  this.totalUploadedRowCount = csvData.split(/\r\n|\n|\r/).length - 2;
               }
               catch (e) {
                  this.store$.dispatch(ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: e}));
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
                this.parseMustCovers(reader.result.toString(), this.fileName);
                this.totalUploadedRowCount = reader.result.toString().split(/\r\n|\n/).length - 2;
               }
               catch (e) {
                  this.store$.dispatch(ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: e}));
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
      this.isDisable = this.currentSelection == null || this.currentSelection === 'Manually Add';
      this.fileAnalysisSelected = event;
      this.fileAnalysisLabel = this.allAnalysisLevels.filter(analysis => analysis.value === this.fileAnalysisSelected)[0].label;
      this.tooltip = 'CSV or Excel format, required field is Geocode';
      this.manualToolTip = 'Please enter geocodes separated by comma or carriage return.';
   }

   deleteMustCovers(){
     this.messageService.showDeleteConfirmModal('Do you want to delete all the Must Cover geos?').subscribe(result => {
       if (result) {
         this.impGeofootprintGeoService.clearMustCovers();
         this.isMustCoverExists.emit(false);
         this.impProjectService.get()[0].impProjectPrefs = this.impProjectPrefService.get().filter(pref => pref.prefGroup !== ProjectPrefGroupCodes.MustCover);
         this.impGeofootprintGeoService.uploadFailures = [];
         this.isDisable = true;
         this.mustCoverGeos = null;
       } else {
         this.isMustCoverExists.emit(true);
       }
     });
   }

   public onSelectionChange(data: 'Upload' | 'Manually Add') {
      this.currentSelection = data;
      if (this.currentSelection === 'Manually Add'){
         this.isUpload = false;
         this.isDisable = true;
      } else{
         this.isDisable = false;
         this.isUpload = true;
      }
   }

  validateMustCovers() {
    let geos: string[] = ['geocode'];
    let manualFailures: string[] = [];
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    const manualMustCoverGeos = this.mustCoverGeos.split(/,|,\s|\r\n|\n|\r/);
    manualMustCoverGeos.forEach(geo => {
      if (this.fileAnalysisSelected === 'ZIP' && geo.match(/^\s*[0-9]{5}\s*$/) || (this.fileAnalysisSelected === 'ATZ' && geo.match(/^\s*[0-9]{5}|[0-9]{5}[A-Z]{1}?[0-9]{1}?\s*$/)) ||
        (this.fileAnalysisSelected === 'Digital ATZ' && geo.match(/^\s*[0-9]{5,9}?$\s*/)) || (this.fileAnalysisSelected === 'PCR' && geo.match(/^\s*[0-9]{5}[A-Z]{1}[0-9]{3}\s*$/)) ||
                  (this.fileAnalysisSelected === 'WRAP_MKT_ID' && geo.match(/^\s*[0-9]{8}\s*$/)) || (this.fileAnalysisSelected === 'COUNTY' && geo.match(/^\s*[a-zA-Z ]*\s*$/)) ||
        (this.fileAnalysisSelected === 'STATE' && geo.match(/^\s*[A-Za-z]{2}\s*$/)) || (this.fileAnalysisSelected === 'DMA' && geo.match(/^\s*[0-9]{4}\s*$/)) ||
        (this.fileAnalysisSelected === 'INFOSCAN_CODE' && geo.match(/^\s*[0-9]{3}\s*$/)) || (this.fileAnalysisSelected === 'SCANTRACK_CODE' && geo.match(/^\s*[0-9]{2}\s*$/))) {
        geos.push(geo);
      } else {
        manualFailures.push(geo);
      }
    });
    if (manualFailures.length > 0)
      this.store$.dispatch(ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: 'Invalid Geos, Please check and try again' }));

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
      records.push('Geocode');
      this.impGeofootprintGeoService.uploadFailures.forEach(record => {
            records.push(`${record.geocode}`);
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
