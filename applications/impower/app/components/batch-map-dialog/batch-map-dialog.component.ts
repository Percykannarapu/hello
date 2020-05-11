import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppLocationService } from 'app/services/app-location.service';
import { AppProjectPrefService } from 'app/services/app-project-pref.service';
import { AppStateService } from 'app/services/app-state.service';
import { UserService } from 'app/services/user.service';
import { BatchMapPayload, BatchMapSizes, FitToPageOptions, LocalAppState, SinglePageBatchMapPayload, TitlePayload } from 'app/state/app.interfaces';
import { CloseBatchMapDialog, CreateBatchMap } from 'app/state/batch-map/batch-map.actions';
import { getBatchMapDialog } from 'app/state/batch-map/batch-map.selectors';
import { CreateMapExportUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeAreaService } from 'app/val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpClientLocationTypeCodes } from 'app/val-modules/targeting/targeting.enums';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ErrorNotification } from '@val/messaging';
import { groupByExtended, groupBy, mapByExtended } from '@val/common';

@Component({
  selector: 'val-batch-map-dialog',
  templateUrl: './batch-map-dialog.component.html',
  styleUrls: ['./batch-map-dialog.component.scss']
})
export class BatchMapDialogComponent implements OnInit {

  showBatchMapDialog$: Observable<boolean>;
  batchMapForm: FormGroup;
  currentProjectId: number;
  currentProjectName: string;
  numSites: number = 0;
  pageSettings: SelectItem[];
  siteLabels: SelectItem[];
  siteByGroupList: SelectItem[];
  mapBufferOptions: SelectItem[];
  selectedVariable: string;
  input = {
    'title': this.currentProjectName,
    'subTitle': '',
    'subSubTitle': ''
  };
  enableTradeAreaShading: boolean;
  disableTradeArea: boolean;

  constructor(private store$: Store<LocalAppState>,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private appLocationService: AppLocationService,
    private stateService: AppStateService,
    private tradeAreaService: ImpGeofootprintTradeAreaService,
    private appProjectPrefService: AppProjectPrefService,
    private userService: UserService) {
      this.pageSettings = [
        {label: '8.5 x 11 (Letter)', value: BatchMapSizes.letter},
        {label: '8.5 x 14 (Legal)', value: BatchMapSizes.legal},
        {label: '11 x 17 (Tabloid)', value: BatchMapSizes.tabloid},
        {label: '24 x 36 (Arch-D)', value: BatchMapSizes.large},
        {label: '36 x 48 (Arch-E)', value: BatchMapSizes.jumbo}
      ];
      this.mapBufferOptions = [
        {label: '10%', value: 10},
        {label: '15%', value: 15},
        {label: '20%', value: 20},
        {label: '25%', value: 25},
        {label: '30%', value: 30},
        {label: '35%', value: 35},
        {label: '40%', value: 40},
        {label: '45%', value: 45},
        {label: '50%', value: 50}
      ];
      this.stateService.applicationIsReady$.pipe(filter(ready => ready)).subscribe(() => this.onLoadFormData());
    }

  initForm() {
    this.batchMapForm = this.fb.group({
      title: ['user-defined', Validators.required],
      subTitle: 'user-defined',
      subSubTitle: 'user-defined',
      deduplicated: true,
      sitesPerPage: 'oneSitePerPage',
      sitesByGroup: 'locationNumber',
      neighboringSites: 'include',
      fitTo: FitToPageOptions.geos,
      buffer: 10,
      pageSettingsControl: BatchMapSizes.letter,
      layout: 'landscape',
      titleInput: '',
      subTitleInput: '',
      subSubTitleInput: '',
      taTitle: '',
      enableTradeAreaShading: false
    });
    this.batchMapForm.get('sitesByGroup').disable();
  }

  onLoadFormData() {
    let projectPrefValue: string;
    const projectPref = this.appProjectPrefService.getPref('batchMapPayload');
    if (projectPref != null && projectPref != undefined) {
      projectPrefValue = (projectPref.largeVal != null) ? projectPref.largeVal : projectPref.val;
      const savedFormData = JSON.parse(projectPrefValue);
      this.batchMapForm.patchValue({
        title: savedFormData.title,
        subTitle: savedFormData.subTitle,
        subSubTitle: savedFormData.subSubTitle,
        deduplicated: savedFormData.deduplicated,
        sitesPerPage: savedFormData.sitesPerPage,
        sitesByGroup: savedFormData.sitesByGroup,
        neighboringSites: savedFormData.neighboringSites,
        fitTo: FitToPageOptions.geos,
        buffer: savedFormData.buffer,
        pageSettingsControl: savedFormData.pageSettingsControl,
        layout: savedFormData.layout,
        titleInput: savedFormData.titleInput,
        subTitleInput: savedFormData.subTitleInput,
        subSubTitleInput: savedFormData.subSubTitleInput,
        enableTradeAreaShading: savedFormData.enableTradeAreaShading
      });
     /*  if (savedFormData.fitTo === '') {
        this.tradeAreaService.storeObservable.subscribe((tas) => {
          if (tas.length > 0 && tas.filter(ta => ta.taType === 'RADIUS').length > 0) {
            this.batchMapForm.patchValue({ fitTo: FitToPageOptions.ta});
            this.disableTradeArea = false;
          } else {
            this.batchMapForm.patchValue({ fitTo: FitToPageOptions.geos});
            this.disableTradeArea = true;
          }
        });
      }
    } else { */
      this.batchMapForm.patchValue({
        title: 'user-defined',
        subTitle: 'user-defined',
        subSubTitle: 'user-defined',
        deduplicated: true,
        sitesPerPage: 'oneSitePerPage',
        sitesByGroup: 'locationNumber',
        neighboringSites: 'include',
        fitTo: FitToPageOptions.geos,
        buffer: 10,
        pageSettingsControl: BatchMapSizes.letter,
        layout: 'landscape',
        titleInput: '',
        subTitleInput: '',
        subSubTitleInput: '',
        enableTradeAreaShading: false
      });
      /* this.tradeAreaService.storeObservable.subscribe((tas) => {
        if (tas.length > 0 && tas.filter(ta => ta.taType === 'RADIUS').length > 0) {
          this.batchMapForm.patchValue({ fitTo: FitToPageOptions.ta});
          this.disableTradeArea = false;
        } else {
          this.batchMapForm.patchValue({ fitTo: FitToPageOptions.geos});
          this.disableTradeArea = true;
        }
      }); */
      this.stateService.currentProject$.pipe(filter(p => p != null)).subscribe(p => {
        this.currentProjectName = p.projectName;
        this.batchMapForm.patchValue({titleInput: this.currentProjectName});
      });
      this.cd.markForCheck();
    }
  }

  ngOnInit() {
    this.initForm();

    this.batchMapForm.get('title').valueChanges.subscribe(value => {
      if (value !== null) {
        if (value === 'user-defined') {
          this.batchMapForm.get('titleInput').enable();
        } else {
          this.batchMapForm.get('titleInput').disable();
        }
      }
    });
    this.batchMapForm.get('subTitle').valueChanges.subscribe(value => {
      if (value !== null) {
        if (value === 'user-defined') {
          this.batchMapForm.get('subTitleInput').enable();
        } else {
          this.batchMapForm.get('subTitleInput').disable();
        }
      }
    });
    this.batchMapForm.get('subSubTitle').valueChanges.subscribe(val => {
      if (val !== null) {
        if (val === 'user-defined') {
          this.batchMapForm.get('subSubTitleInput').enable();
        } else {
          this.batchMapForm.get('subSubTitleInput').disable();
        }
      }
    });
    this.batchMapForm.get('neighboringSites').valueChanges.subscribe(val => {
      if (val === 'include') {
        this.batchMapForm.get('enableTradeAreaShading').enable();
      } else if (val === 'exclude') {
        this.batchMapForm.get('enableTradeAreaShading').disable();
      }
    });
    this.batchMapForm.get('sitesPerPage').valueChanges.subscribe(val => {
      if (val === 'sitesGroupedBy') {
        this.batchMapForm.get('sitesByGroup').enable();
      } else {
        this.batchMapForm.get('sitesByGroup').disable();
      }
    });

    this.showBatchMapDialog$ = this.store$.select(getBatchMapDialog);
    this.stateService.currentProject$.pipe(filter(p => p != null)).subscribe(p => {
      this.currentProjectId = p.projectId;
      this.currentProjectName = p.projectName;
      this.batchMapForm.patchValue({titleInput: this.currentProjectName});
      this.numSites = p.getImpGeofootprintLocations().length;
    });
    this.appLocationService.siteLabelOptions$.subscribe( (list: SelectItem[]) => {
      const customList: SelectItem[] = [];
      customList.push({ label: '<user defined>', value: 'user-defined' });
      list.forEach((listEntry) => {
        customList.push(listEntry);
      });
      this.siteByGroupList = list;
      this.siteLabels = customList;
    });
    /*this.tradeAreaService.storeObservable.subscribe((tas) => {
      if (tas.length > 0 && tas.filter(ta => ta.taType === 'RADIUS').length > 0) {
        this.batchMapForm.patchValue({ fitTo: FitToPageOptions.ta});
        this.disableTradeArea = false;
      } else {
        this.batchMapForm.patchValue({ fitTo: FitToPageOptions.geos});
        this.disableTradeArea = true;
      }
    });*/
  }

  onSubmit(dialogFields: any) {
    this.input['title'] = (dialogFields['titleInput'] === null) ? this.currentProjectName : dialogFields['titleInput'];
    this.input['subTitle'] = dialogFields['subTitleInput'];
    this.input['subSubTitle'] = dialogFields['subSubTitleInput'];
    const siteIds: string[] = this.getSiteIds();
    const titles: Array<TitlePayload> = this.getTitles(siteIds);
    const result = this.getTitlesByGroup(siteIds);
    const siteIdsByGroup: string[] = result[0];
    const titlesByGroup: Array<TitlePayload> = result[1];
    const size: BatchMapSizes = <BatchMapSizes> dialogFields.pageSettingsControl;
    const fitTo: FitToPageOptions = <FitToPageOptions> dialogFields.fitTo;
    this.store$.dispatch(new CreateMapExportUsageMetric('batch~map', 'deduped-shading' , dialogFields.deduplicated, dialogFields.deduplicated ? 1 : 0));
    this.store$.dispatch(new CreateMapExportUsageMetric('batch~map', 'neighbor-sites' , dialogFields.neighboringSites, null));
    this.store$.dispatch(new CreateMapExportUsageMetric('batch~map', 'fit-to' , fitTo, null));
    this.store$.dispatch(new CreateMapExportUsageMetric('batch~map', 'buffer' , 'percent', dialogFields.buffer));
    this.store$.dispatch(new CreateMapExportUsageMetric('batch~map', 'page-size' , dialogFields.pageSettingsControl, null));
    this.store$.dispatch(new CreateMapExportUsageMetric('batch~map', 'page-orientation' , dialogFields.layout, null));
    this.store$.dispatch(new CreateMapExportUsageMetric('batch~map', 'neighboring-sites-shading' , dialogFields.enableTradeAreaShading, dialogFields.enableTradeAreaShading ? 1 : 0));
    const sitesPerPage = dialogFields.sitesPerPage === 'sitesGroupedBy' ? `${dialogFields.sitesPerPage}=${dialogFields.sitesByGroup}` : dialogFields.sitesPerPage;
    this.store$.dispatch(new CreateMapExportUsageMetric('batch~map', 'sites-per-page' , sitesPerPage, null));
    this.store$.dispatch(new CreateMapExportUsageMetric('batch~map', 'total-pages' , siteIds.length.toString(), null));

    if (dialogFields.sitesPerPage === 'allSitesOnOnePage') {
      const formData: SinglePageBatchMapPayload = this.getSinglePageMapPayload(size, dialogFields['layout'], this.getSiteIds().sort()[0], fitTo, dialogFields.buffer);
      this.store$.dispatch(new CreateBatchMap({ templateFields: formData}));
    } else if (dialogFields.sitesPerPage === 'oneSitePerPage') {
      const formData: BatchMapPayload = {
        calls: [
          {
            service: 'ImpowerPdf',
            function: 'printMaps',
            args: {
              printJobConfiguration: {
                email: `${this.userService.getUser().username}@valassis.com`,
                titles: titles,
                projectId: this.currentProjectId,
                size: size,
                pageSettings: dialogFields.pageSettingsControl,
                layout: dialogFields.layout,
                siteIds: siteIds,
                hideNeighboringSites: !(dialogFields.neighboringSites === 'include'),
                shadeNeighboringSites: ((dialogFields.enableTradeAreaShading !== undefined) ? dialogFields.enableTradeAreaShading : false),
                fitTo: fitTo,
                duplicated: !(dialogFields.deduplicated),
                buffer: dialogFields.buffer
              }
            }
          }
        ]
      };
      if (this.getActiveSites().length > 600){
         this.store$.dispatch(new ErrorNotification({notificationTitle: 'Batch Map Limit', message: 'PDF map outputs may not exceed 600 pages. Please set up your maps accordingly.'}));
      }
      else
        this.store$.dispatch(new CreateBatchMap({ templateFields: formData}));
    } else if (dialogFields.sitesPerPage === 'sitesGroupedBy') {
      //print maps by site Attributes
      const formData: BatchMapPayload = {
        calls: [
          {
            service: 'ImpowerPdf',
            function: 'printMaps',
            args: {
              printJobConfiguration: {
                email: `${this.userService.getUser().username}@valassis.com`,
                titles: titlesByGroup,
                projectId: this.currentProjectId,
                size: size,
                pageSettings: dialogFields.pageSettingsControl,
                layout: dialogFields.layout,
                siteIds: siteIdsByGroup,
                hideNeighboringSites: !(dialogFields.neighboringSites === 'include'),
                shadeNeighboringSites: (dialogFields.enableTradeAreaShading !== undefined) ? dialogFields.enableTradeAreaShading : false,
                fitTo: fitTo,
                duplicated: !(dialogFields.deduplicated),
                buffer: dialogFields.buffer,
                groupByAttribute: dialogFields.sitesByGroup
              }
            }
          }
        ]
      };
      if (groupByExtended(this.getActiveSites(), l => l[dialogFields.sitesByGroup]).size > 600){
        this.store$.dispatch(new ErrorNotification({notificationTitle: 'Batch Map Limit', message: 'PDF map outputs may not exceed 600 pages. Please set up your maps accordingly.'}));
      }else
         this.store$.dispatch(new CreateBatchMap({ templateFields: formData}));
    }
    this.closeDialog();
  }

  private getSiteIds() : Array<string> {
    const siteIds: Array<string> = [];
    this.stateService.currentProject$.getValue().impGeofootprintMasters[0].impGeofootprintLocations.forEach(s => {
      if (s.clientLocationTypeCode === ImpClientLocationTypeCodes.Site){
        siteIds.push(s.locationNumber);
      }
    });
    return siteIds;
  }

  private getActiveSites(){
    //const t =  this.stateService.activeClientLocations$.pipe(map(sites => sites.length > 600));
     return this.stateService.currentProject$.getValue().getImpGeofootprintLocations()
     .filter(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Site && loc.isActive);
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.batchMapForm.get(controlKey);
    return (control.dirty || control.untouched || control.value == null) && (control.errors != null);
  }

  closeDialog(){
    const data = JSON.stringify(this.batchMapForm.value);
    this.appProjectPrefService.createPref('createsites', 'batchMapPayload', data, 'string');
    this.store$.dispatch(new CloseBatchMapDialog());
  }

  getSinglePageMapPayload(size: BatchMapSizes, layout: string, siteId: string, fitTo: FitToPageOptions, buffer: number) : SinglePageBatchMapPayload{
    const location = this.stateService.currentProject$.getValue().impGeofootprintMasters[0].impGeofootprintLocations.filter(loc => loc.locationNumber === siteId);
    const title = this.batchMapForm.get('title').value;
    const subTitle = this.batchMapForm.get('subTitle').value;
    const subSubTitle = this.batchMapForm.get('subSubTitle').value;
    const formData: SinglePageBatchMapPayload = {
      calls: [
        {
          service: 'ImpowerPdf',
          function: 'printSinglePage',
          args: {
            singlePageConfiguration: {
              email: `${this.userService.getUser().username}@valassis.com`,
              projectId: this.currentProjectId,
              size: size,
              layout: layout,
              title: this.getAttrValueByCode(location[0], title, 'title'),
              subTitle: this.getAttrValueByCode(location[0], subTitle, 'subTitle'),
              subSubTitle: this.getAttrValueByCode(location[0], subSubTitle, 'subSubTitle'),
              fitTo: fitTo,
              buffer: buffer
            }
          }
        }]
    };
    return formData;
  }

  getTheSiteAttributeValue(siteAttribute: string, location: ImpGeofootprintLocation) {
    if (location[siteAttribute] === undefined) {
      const tempLoc = location.impGeofootprintLocAttribs;
      const filtered = tempLoc.filter(loc => loc.attributeCode === siteAttribute);
      if (filtered.length > 0){
        return (filtered[0].attributeValue === null ? '' : filtered[0].attributeValue);
      }
    }
    return location[siteAttribute];
  }

  getAttrValueByCode(location: ImpGeofootprintLocation, title: string, inputField: string){
    if (title === 'user-defined') {
     return (this.input[inputField] === null ? '' : this.input[inputField]);
    }
    if (title === 'totalHHC' || title === 'totalAllocatedHHC') {
      return '';
    }
    if (location[title] === undefined){
      const tempLoc = location.impGeofootprintLocAttribs;
      const filtered = tempLoc.filter(loc => loc.attributeCode === title);
      if (filtered.length > 0){
        return (filtered[0].attributeValue === null ? '' : filtered[0].attributeValue);
      }
      else return '' ;
    }
    return (location[title] === null ? '' : location[title]);
  }

  getTitles(siteIds: string[]) : Array<TitlePayload> {
    siteIds.sort();
    const locations = this.stateService.currentProject$.getValue().impGeofootprintMasters[0].impGeofootprintLocations;
    const titlePayload: Array<TitlePayload> = [];
    const title = this.batchMapForm.get('title').value;
    const subTitle = this.batchMapForm.get('subTitle').value;
    const subSubTitle = this.batchMapForm.get('subSubTitle').value;

    //Map Siteid with location
    siteIds.forEach((siteId) => {
      const filteredLocations = locations.filter(loc => loc.locationNumber === siteId);
      if (filteredLocations.length > 0){
        const payload: TitlePayload = {
          siteId: siteId,
          title: this.getAttrValueByCode(filteredLocations[0], title, 'title'),
          subTitle: this.getAttrValueByCode(filteredLocations[0], subTitle, 'subTitle'),
          subSubTitle: this.getAttrValueByCode(filteredLocations[0], subSubTitle, 'subSubTitle'),
          taName: this.batchMapForm.get('taTitle').value || ''
        };
        titlePayload.push(payload);
      }
    });
    return titlePayload;
  }

  getTitlesByGroup(siteIds: string[]) : any {
    const locations = this.stateService.currentProject$.getValue().impGeofootprintMasters[0].impGeofootprintLocations;
    const siteAttribute = this.batchMapForm.get('sitesByGroup').value;
    const locationArray = [];
    const divisionArr = [];
    const titlePayload: Array<TitlePayload> = [];
    const title = this.batchMapForm.get('title').value;
    const subTitle = this.batchMapForm.get('subTitle').value;
    const subSubTitle = this.batchMapForm.get('subSubTitle').value;
    const bufferArray: Map<string, ImpGeofootprintLocation> = new Map<string, ImpGeofootprintLocation>();

    siteIds.forEach((siteId) => {
      const filteredLocations = locations.filter(loc => loc.locationNumber === siteId);
      const divisionVal: string = this.getTheSiteAttributeValue(siteAttribute, filteredLocations[0]);
      if (!divisionArr.includes(divisionVal)){
        divisionArr.push(divisionVal);
        bufferArray.set(divisionVal, filteredLocations[0]);
      }
    });
    divisionArr.sort();
    // sorting
    divisionArr.forEach(divisonVal => locationArray.push(bufferArray.get(divisonVal)));
    locationArray.forEach((location, index) => {
      const payload: TitlePayload = {
        siteId: index.toString(),
        title: this.getAttrValueByCode(location, title, 'title'),
        subTitle: this.getAttrValueByCode(location, subTitle, 'subTitle'),
        subSubTitle: this.getAttrValueByCode(location, subSubTitle, 'subSubTitle'),
        taName: this.batchMapForm.get('taTitle').value || ''
      };
      titlePayload.push(payload);
    });
    const Ids = Array.from(Array(divisionArr.length).keys());
    return [Ids, titlePayload];
  }
}
