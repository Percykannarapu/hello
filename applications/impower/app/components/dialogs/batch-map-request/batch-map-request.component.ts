import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { groupByExtended, isNotNil, mapBy, removeNonAsciiChars, removeTabAndNewLineRegx } from '@val/common';
import { ErrorNotification } from '@val/messaging';
import { AppLocationService } from 'app/services/app-location.service';
import { AppStateService } from 'app/services/app-state.service';
import {
  BatchMapPayload,
  BatchMapSizes,
  CurrentPageBatchMapPayload,
  FitToPageOptions,
  LocalAppState,
  SinglePageBatchMapPayload,
  TitlePayload
} from 'app/state/app.interfaces';
import { CreateBatchMap } from 'app/state/batch-map/batch-map.actions';
import { CreateMapExportUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeAreaService } from 'app/val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { SelectItem } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { filter } from 'rxjs/operators';
import { ImpClientLocationTypeCodes } from '../../../../worker-shared/data-model/impower.data-model.enums';
import { User } from '../../../models/User';

@Component({
  templateUrl: './batch-map-request.component.html',
  styleUrls: ['./batch-map-request.component.scss']
})
export class BatchMapRequestComponent implements OnInit {

  public get pageSettings() : SelectItem[] {
    return this.hasFullPdfGrant ? this.fullPageSettings : this.limitedPageSettings;
  }

  batchMapForm: FormGroup;
  currentProjectId: number;
  currentProjectName: string = '';
  numSites: number = 0;
  fullPageSettings: SelectItem[];
  limitedPageSettings: SelectItem[];
  hasFullPdfGrant: boolean;
  siteLabels: SelectItem[];
  siteByGroupList: SelectItem[];
  mapBufferOptions: SelectItem[];
  selectedVariable: string;
  totalSites: number;
  input = {
    'title': this.currentProjectName,
    'subTitle': '',
    'subSubTitle': ''
  };
  enableTradeAreaShading: boolean;
  disableTradeArea: boolean;
  sitesCount: number = 0;
  enableTradeAreaBoundaries: boolean;
  enableLabels: boolean;
  enableSymbols: boolean;
  private user: User;

  constructor(private store$: Store<LocalAppState>,
              private ddConfig: DynamicDialogConfig,
              private ddRef: DynamicDialogRef,
              private fb: FormBuilder,
              private appLocationService: AppLocationService,
              private stateService: AppStateService,
              private tradeAreaService: ImpGeofootprintTradeAreaService) {
    this.fullPageSettings = [
      { label: '8.5 x 11 (Letter)', value: BatchMapSizes.letter },
      { label: '8.5 x 14 (Legal)', value: BatchMapSizes.legal },
      { label: '11 x 17 (Tabloid)', value: BatchMapSizes.tabloid },
      { label: '24 x 36 (Arch-D)', value: BatchMapSizes.large },
      { label: '36 x 48 (Arch-E)', value: BatchMapSizes.jumbo }
    ];
    this.limitedPageSettings = [
      { label: '8.5 x 11 (Letter)', value: BatchMapSizes.letter },
      { label: '8.5 x 14 (Legal)', value: BatchMapSizes.legal },
      { label: '11 x 17 (Tabloid)', value: BatchMapSizes.tabloid },
    ];
    this.mapBufferOptions = [
      { label: '10%', value: 10 },
      { label: '15%', value: 15 },
      { label: '20%', value: 20 },
      { label: '25%', value: 25 },
      { label: '30%', value: 30 },
      { label: '35%', value: 35 },
      { label: '40%', value: 40 },
      { label: '45%', value: 45 },
      { label: '50%', value: 50 }
    ];
  }

  ngOnInit() {
    this.hasFullPdfGrant = this.ddConfig.data.userHasFullPDFGrant ?? false;
    this.user = this.ddConfig.data.user;

    this.initForm();
    this.populateFormData();
    this.watchFormChanges();

    const activeSites = this.getActiveSites();
    this.sitesCount = activeSites.length;
    this.totalSites = activeSites.length;
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
      fitTo: '',
      buffer: 10,
      pageSettingsControl: BatchMapSizes.letter,
      layout: 'landscape',
      titleInput: '',
      subTitleInput: '',
      subSubTitleInput: '',
      taTitle: '',
      enableTradeAreaShading: false,
      sitesToInclude: 'allActiveSites',
      enableLabels: true,
      enableSymbols: true,
      enableTradeAreaBoundaries: true
    });
    this.batchMapForm.get('sitesByGroup').disable();
  }

  populateFormData() {
    const savedFormData = this.ddConfig.data.batchMapPayload;
    if (isNotNil(savedFormData)) {
        this.batchMapForm.patchValue({
          title: savedFormData.title ?? '',
          subTitle: savedFormData.subTitle ?? '',
          subSubTitle: savedFormData.subSubTitle ?? '',
          deduplicated: savedFormData.deduplicated,
          sitesPerPage: savedFormData.sitesPerPage,
          sitesByGroup: savedFormData.sitesByGroup,
          neighboringSites: savedFormData.neighboringSites,
          fitTo: savedFormData.fitTo ?? '',
          buffer: savedFormData.buffer ?? 10,
          pageSettingsControl: savedFormData.pageSettingsControl,
          layout: savedFormData.layout,
          titleInput: savedFormData.titleInput ?? '',
          subTitleInput: savedFormData.subTitleInput ?? '',
          subSubTitleInput: savedFormData.subSubTitleInput ?? '',
          enableTradeAreaShading: savedFormData.enableTradeAreaShading,
          sitesToInclude: savedFormData.sitesToInclude ?? 'allActiveSites',
          taTitle: savedFormData.taTitle ?? '',
          enableLabels: savedFormData.enableLabels ?? true,
          enableSymbols: savedFormData.enableSymbols ?? true,
          enableTradeAreaBoundaries: savedFormData.enableTradeAreaBoundaries ?? false
        });

      if (savedFormData.fitTo == '' || savedFormData.fitTo == null) {
        this.tradeAreaService.storeObservable.subscribe((tas) => {
          const fitToFormControl = this.batchMapForm.get('fitTo');
          if (tas.length > 0 && tas.filter(ta => ta.taType === 'RADIUS' || ta.taType === 'CUSTOM' || ta.taType === 'MUSTCOVER').length > 0) {
            this.batchMapForm.patchValue({ fitTo: FitToPageOptions.ta });
            fitToFormControl.enable();
          } else {
            this.batchMapForm.patchValue({ fitTo: FitToPageOptions.geos });
            fitToFormControl.disable();
          }
        });
      }

      if (savedFormData.sitesPerPage === 'sitesGroupedBy')
         this.batchMapForm.get('sitesByGroup').enable();
      else    
         this.batchMapForm.get('sitesByGroup').disable();

      if (savedFormData.neighboringSites === 'exclude'){
        this.batchMapForm.get('enableTradeAreaShading').disable();
        this.batchMapForm.get('enableLabels').disable();
        this.batchMapForm.get('enableSymbols').disable();
        this.batchMapForm.get('enableTradeAreaBoundaries').disable();
      }else{
        this.batchMapForm.get('enableTradeAreaShading').enable();
        this.batchMapForm.get('enableLabels').enable();
        this.batchMapForm.get('enableSymbols').enable();
        this.batchMapForm.get('enableTradeAreaBoundaries').enable();
      }

    } else {
      this.batchMapForm.patchValue({
        title: 'user-defined',
        subTitle: 'user-defined',
        subSubTitle: 'user-defined',
        deduplicated: true,
        sitesPerPage: 'oneSitePerPage',
        sitesByGroup: 'locationNumber',
        neighboringSites: 'include',
        fitTo: '',
        buffer: 10,
        pageSettingsControl: BatchMapSizes.letter,
        layout: 'landscape',
        titleInput: '',
        subTitleInput: '',
        subSubTitleInput: '',
        enableTradeAreaShading: false,
        sitesToInclude: 'allActiveSites',
        taTitle: '',
        enableLabels: true,
        enableSymbols: true,
        enableTradeAreaBoundaries: false
      });
      this.tradeAreaService.storeObservable.subscribe((tas) => {
        const fitToFormControl = this.batchMapForm.get('fitTo');
        if (tas.length > 0 && tas.filter(ta => ta.taType === 'RADIUS' || ta.taType === 'CUSTOM' || ta.taType === 'MUSTCOVER').length > 0) {
          this.batchMapForm.patchValue({ fitTo: FitToPageOptions.ta});
          fitToFormControl.enable();
        } else {
          this.batchMapForm.patchValue({ fitTo: FitToPageOptions.geos});
          fitToFormControl.disable();
        }
      });
      this.stateService.currentProject$.pipe(filter(p => p != null)).subscribe(p => {
        this.currentProjectName = p.projectName;
        this.batchMapForm.patchValue({titleInput: this.currentProjectName});
      });
    }
  }

  watchFormChanges() {
    this.batchMapForm.get('title').valueChanges.subscribe(value => {
      if (value !== null) {
        if (value === 'user-defined') {
          this.batchMapForm.get('titleInput').enable();
        } else if (this.batchMapForm.get('sitesToInclude').value !== 'currentMap') {
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
        this.batchMapForm.get('enableLabels').enable();
        this.batchMapForm.get('enableSymbols').enable();
        this.batchMapForm.get('enableTradeAreaBoundaries').enable();
      } else if (val === 'exclude') {
        this.batchMapForm.get('enableTradeAreaShading').disable();
        this.batchMapForm.get('enableLabels').disable();
        this.batchMapForm.get('enableSymbols').disable();
        this.batchMapForm.get('enableTradeAreaBoundaries').disable();
      }
    });
    this.batchMapForm.get('sitesPerPage').valueChanges.subscribe(val => {
      if (val === 'sitesGroupedBy') {
        this.batchMapForm.get('sitesByGroup').enable();
      } else {
        this.batchMapForm.get('sitesByGroup').disable();
      }
    });

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
    this.tradeAreaService.storeObservable.subscribe((tas) => {
      const fitToFormControl = this.batchMapForm.get('fitTo');
      if (tas.length > 0 && tas.filter(ta => ta.taType === 'RADIUS' || ta.taType === 'CUSTOM' || ta.taType === 'MUSTCOVER').length > 0) {
        this.batchMapForm.patchValue({ fitTo: FitToPageOptions.ta});
        fitToFormControl.enable();
      } else {
        this.batchMapForm.patchValue({ fitTo: FitToPageOptions.geos});
        fitToFormControl.disable();
      }
    });
    this.batchMapForm.get('sitesToInclude').valueChanges.subscribe(val => {
      if (val === 'currentMap')
        this.currentViewSetting();
      else
        this.activeSitesSetting();
    });
    /*this.batchMapForm.get('enableSymbols').valueChanges.subscribe(val => {
      if (!val){
        this.batchMapForm.get('enableLabels').disable();
        }else{
        this.batchMapForm.get('enableLabels').enable();
       }
      });*/
  }

  onSubmit(dialogFields: any) {
    this.input['title'] = (dialogFields['titleInput'] == null) ? this.currentProjectName : removeNonAsciiChars(dialogFields['titleInput']);
    this.input['subTitle'] = dialogFields['subTitleInput'] == null ? '' : removeNonAsciiChars(dialogFields['subTitleInput']);
    this.input['subSubTitle'] = dialogFields['subSubTitleInput'] == null ? '' : removeNonAsciiChars(dialogFields['subSubTitleInput']);
    const siteIds: string[] = this.getSiteIds();
    const titles: Array<TitlePayload> = this.getTitles(siteIds);
    const result = this.getTitlesByGroup(siteIds);
    const siteIdsByGroup: string[] = result[0];
    const titlesByGroup: Array<TitlePayload> = result[1];
    const size: BatchMapSizes = <BatchMapSizes> dialogFields.pageSettingsControl;
    const fitTo: FitToPageOptions = <FitToPageOptions> dialogFields.fitTo;
    const activeSites: number = this.getActiveSites().length;
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

    if (dialogFields.sitesToInclude === 'currentMap'){
      let extent = (this.stateService.currentProject$.getValue().impProjectPrefs || []).filter(pref => pref.pref === 'extent')[0].largeVal;
      extent = JSON.parse(extent);
      const formData: CurrentPageBatchMapPayload = {
        calls: [
          {
            service: 'ImpowerPdf',
            function: 'printCurrentView',
            args: {
              currentPageConfiguration: {
                email: `${this.user.email}`,
                projectId: this.currentProjectId,
                size: size,
                layout: dialogFields.layout,
                title: dialogFields.titleInput,
                subTitle: dialogFields.subTitleInput,
                subSubTitle: dialogFields.subSubTitleInput,
                xmin: extent['xmin'].toString(),
                xmax: extent['xmax'].toString(),
                ymin: extent['ymin'].toString(),
                ymax: extent['ymax'].toString(),
                taName: removeNonAsciiChars(this.batchMapForm.get('taTitle').value || '') ,
                projectName: this.currentProjectName,
                jobType: 'Current Map'
              }
            }
          }
        ]
      };
      this.store$.dispatch(new CreateBatchMap({ templateFields: formData}));
    }
    else{
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
                  email: `${this.user.email}`,
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
                  buffer: dialogFields.buffer,
                  projectName: this.currentProjectName,
                  jobType: 'One Site per Page',
                  enableLabel: dialogFields.enableLabels,
                  enableSymbol: dialogFields.enableSymbols,
                  enableTaBoundaries: dialogFields.enableTradeAreaBoundaries
                }
              }
            }
          ]
        };
        if (activeSites > 600){
           this.store$.dispatch(ErrorNotification({notificationTitle: 'Batch Map Limit', message: 'PDF map outputs may not exceed 600 pages. Please set up your maps accordingly.'}));
        } else if (activeSites > 25 && !this.hasFullPdfGrant){
          this.store$.dispatch(ErrorNotification({notificationTitle: 'Batch Map Limit', message: 'You cannot print maps with more than 25 pages. Please adjust sites and try again.'}));
        } else
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
                  email: `${this.user.email}`,
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
                  groupByAttribute: dialogFields.sitesByGroup,
                  projectName: this.currentProjectName,
                  jobType: 'Sites Group By',
                  enableLabel: dialogFields.enableLabels,
                  enableSymbol: dialogFields.enableSymbols,
                  enableTaBoundaries: dialogFields.enableTradeAreaBoundaries

                }
              }
            }
          ]
        };
        if (groupByExtended(this.getActiveSites(), l => l[dialogFields.sitesByGroup]).size > 600){
          this.store$.dispatch(ErrorNotification({notificationTitle: 'Batch Map Limit', message: 'PDF map outputs may not exceed 600 pages. Please set up your maps accordingly.'}));
        }else if (siteIdsByGroup.length > 25 && !this.hasFullPdfGrant){
          this.store$.dispatch(ErrorNotification({notificationTitle: 'Batch Map Limit', message: 'You cannot print maps with more than 25 pages. Please adjust sites and try again.'}));
        } else
           this.store$.dispatch(new CreateBatchMap({ templateFields: formData}));
      }

    }

    this.ddRef.close(this.batchMapForm.value);
  }

  private getSiteIds() : Array<string> {
    const siteIds: Array<string> = [];
    this.stateService.currentProject$.getValue().getImpGeofootprintLocations().forEach(s => {
      if (ImpClientLocationTypeCodes.parse(s.clientLocationTypeCode) === ImpClientLocationTypeCodes.Site && s.isActive) {
        siteIds.push(s.locationNumber);
      }
    });
    return siteIds;
  }

  private getActiveSites() : ImpGeofootprintLocation[] {
     return this.stateService.currentProject$.getValue().getImpGeofootprintLocations()
     .filter(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Site && loc.isActive);
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.batchMapForm.get(controlKey);
    return (control.dirty || control.untouched || control.value == null) && (control.errors != null);
  }

  getSinglePageMapPayload(size: BatchMapSizes, layout: string, siteId: string, fitTo: FitToPageOptions, buffer: number) : SinglePageBatchMapPayload{
    const location = this.stateService.currentProject$.getValue().impGeofootprintMasters[0].impGeofootprintLocations.filter(loc => loc.locationNumber === siteId);
    const title = removeNonAsciiChars(this.batchMapForm.get('title').value);
    const subTitle = removeNonAsciiChars(this.batchMapForm.get('subTitle').value);
    const subSubTitle = removeNonAsciiChars(this.batchMapForm.get('subSubTitle').value);
    const formData: SinglePageBatchMapPayload = {
      calls: [
        {
          service: 'ImpowerPdf',
          function: 'printSinglePage',
          args: {
            singlePageConfiguration: {
              email: `${this.user.email}`,
              projectId: this.currentProjectId,
              size: size,
              layout: layout,
              title: this.getAttrValueByCode(location[0], title, 'title'),
              subTitle: this.getAttrValueByCode(location[0], subTitle, 'subTitle'),
              subSubTitle: this.getAttrValueByCode(location[0], subSubTitle, 'subSubTitle'),
              fitTo: fitTo,
              buffer: buffer,
              taName: this.batchMapForm.get('taTitle').value || '',
              projectName: this.currentProjectName,
              jobType: 'All Sites One Page'
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
     return (this.input[inputField] === null ? '' : removeTabAndNewLineRegx(this.input[inputField]));
    }
    if (title === 'totalHHC' || title === 'totalAllocatedHHC') {
      return '';
    }
    if (location[title] === undefined){
      const tempLoc = location.impGeofootprintLocAttribs;
      const filtered = tempLoc.filter(loc => loc.attributeCode === title);
      if (filtered.length > 0){
        return (filtered[0].attributeValue === null ? '' : removeTabAndNewLineRegx(filtered[0].attributeValue));
      }
      else return '' ;
    }
    return (location[title] === null ? '' : removeTabAndNewLineRegx(location[title]));
  }

  getTitles(siteIds: string[]) : Array<TitlePayload> {
    siteIds.sort();
    const locations = this.stateService.currentProject$.getValue().getImpGeofootprintLocations(true, ImpClientLocationTypeCodes.Site);
    const locsMap = mapBy(locations, 'locationNumber');
    const titlePayload: Array<TitlePayload> = [];
    const title = this.batchMapForm.get('title').value;
    const subTitle = this.batchMapForm.get('subTitle').value;
    const subSubTitle = this.batchMapForm.get('subSubTitle').value;

    //Map Siteid with location
    siteIds.forEach((siteId) => {
      const filteredLocation = locsMap.get(siteId);
      //const filteredLocations = locations.filter(loc => loc.locationNumber === siteId);
      if (filteredLocation != null){
        const payload: TitlePayload = {
          siteId: siteId,
          title: this.getAttrValueByCode(filteredLocation, title, 'title'),
          subTitle: this.getAttrValueByCode(filteredLocation, subTitle, 'subTitle'),
          subSubTitle: this.getAttrValueByCode(filteredLocation, subSubTitle, 'subSubTitle'),
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

  private activeSitesSetting(){
    this.batchMapForm.get('sitesByGroup').enable();
    this.batchMapForm.get('neighboringSites').enable();
    this.batchMapForm.get('sitesPerPage').enable();
    this.batchMapForm.get('deduplicated').enable();
    this.batchMapForm.get('enableTradeAreaShading').enable();
    this.batchMapForm.get('fitTo').enable();
    this.batchMapForm.get('buffer').enable();
    this.batchMapForm.get('title').enable();
    this.batchMapForm.get('subTitle').enable();
    this.batchMapForm.get('subSubTitle').enable();

    if (this.batchMapForm.get('title').value === 'user-defined') {
      this.batchMapForm.get('titleInput').enable();
    } else {
      this.batchMapForm.get('titleInput').disable();
    }

    if (this.batchMapForm.get('subTitle').value === 'user-defined') {
      this.batchMapForm.get('subTitleInput').enable();
    } else {
      this.batchMapForm.get('subTitleInput').disable();
    }

    if (this.batchMapForm.get('subSubTitle').value === 'user-defined') {
      this.batchMapForm.get('subSubTitleInput').enable();
    } else {
      this.batchMapForm.get('subSubTitleInput').disable();
    }
  }

  private currentViewSetting(){
        this.batchMapForm.get('sitesByGroup').disable();
        this.batchMapForm.get('neighboringSites').disable();
        this.batchMapForm.get('sitesPerPage').disable();
        this.batchMapForm.get('deduplicated').disable();
        this.batchMapForm.get('enableTradeAreaShading').disable();
        this.batchMapForm.get('fitTo').disable();
        this.batchMapForm.get('buffer').disable();
        this.batchMapForm.get('title').disable();
        this.batchMapForm.get('subTitle').disable();
        this.batchMapForm.get('subSubTitle').disable();

        this.batchMapForm.get('titleInput').enable();
        this.batchMapForm.get('subTitleInput').enable();
        this.batchMapForm.get('subSubTitleInput').enable();


  }

}
