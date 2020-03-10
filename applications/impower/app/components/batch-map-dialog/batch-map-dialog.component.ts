import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppLocationService } from 'app/services/app-location.service';
import { AppStateService } from 'app/services/app-state.service';
import { UserService } from 'app/services/user.service';
import { BatchMapPayload, BatchMapSizes, LocalAppState, SinglePageBatchMapPayload, TitlePayload, FitToPageOptions } from 'app/state/app.interfaces';
import { CloseBatchMapDialog, CreateBatchMap } from 'app/state/batch-map/batch-map.actions';
import { getBatchMapDialog } from 'app/state/batch-map/batch-map.selectors';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ImpGeofootprintTradeAreaService } from 'app/val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpClientLocationTypeCodes } from 'app/val-modules/targeting/targeting.enums';

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
    private appLocationService: AppLocationService,
    private stateService: AppStateService,
    private tradeAreaService: ImpGeofootprintTradeAreaService,
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
    }

  initForm() {
    this.batchMapForm = this.fb.group({
      title: ['user-defined', Validators.required],
      subTitle: 'user-defined',
      subSubTitle: 'user-defined',
      deduplicated: true,
      sitesPerPage: 'oneSitePerPage',
      // sitesByGroup: '',
      neighboringSites: 'include',
      fitTo: '',
      buffer: 10,
      pageSettingsControl: BatchMapSizes.letter,
      layout: 'landscape',
      titleInput: '',
      subTitleInput: '',
      subSubTitleInput: '',
      enableTradeAreaShading: false,
    });   
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

    this.showBatchMapDialog$ = this.store$.select(getBatchMapDialog);
    this.showBatchMapDialog$.subscribe(() => {
      this.batchMapForm.patchValue({titleInput: this.currentProjectName});
    });
    this.stateService.currentProject$.pipe(filter(p => p != null)).subscribe(p => {
      this.currentProjectId = p.projectId;
      this.currentProjectName = p.projectName;
      this.batchMapForm.patchValue({titleInput: this.currentProjectName});
      this.numSites = p.getImpGeofootprintLocations().length;
    });
    this.appLocationService.listTypeBS$.subscribe( (list: SelectItem[]) => {
      const customList: SelectItem[] = [];
      customList.push({ label: '<user defined>', value: 'user-defined' });
      list.forEach((listEntry) => {
        customList.push(listEntry);
      });
      this.siteByGroupList = list;
      this.siteLabels = customList;
    });
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

  onSubmit(dialogFields: any) {
    this.input['title'] = (dialogFields['titleInput'] === null) ? this.currentProjectName : dialogFields['titleInput'];
    this.input['subTitle'] = dialogFields['subTitleInput'];
    this.input['subSubTitle'] = dialogFields['subSubTitleInput'];
    const siteIds: string[] = this.getSiteIds();
    const titles: Array<TitlePayload> = this.getTitles(siteIds);
    const size: BatchMapSizes = <BatchMapSizes> dialogFields.pageSettingsControl;
    const fitTo: FitToPageOptions = <FitToPageOptions> dialogFields.fitTo;
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
      this.store$.dispatch(new CreateBatchMap({ templateFields: formData}));
    } else if (dialogFields.sitesPerPage === 'sitesGroupedBy') {
      //print maps by site Attributes
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

  hasErrors(controlKey: string) : boolean {
    const control = this.batchMapForm.get(controlKey);
    return (control.dirty || control.untouched || control.value == null) && (control.errors != null);
  }

  closeDialog(){
    this.batchMapForm.controls['title'].reset('user-defined');
    this.batchMapForm.controls['subTitle'].reset('user-defined');
    this.batchMapForm.controls['subSubTitle'].reset('user-defined');
    this.batchMapForm.controls['sitesPerPage'].reset('oneSitePerPage');
    this.batchMapForm.controls['neighboringSites'].reset('include');
    this.batchMapForm.controls['pageSettingsControl'].reset(BatchMapSizes.letter);
    this.batchMapForm.controls['layout'].reset('landscape');
    this.batchMapForm.controls['titleInput'].reset('');
    this.batchMapForm.controls['subTitleInput'].reset('');
    this.batchMapForm.controls['subSubTitleInput'].reset('');
    this.batchMapForm.controls['enableTradeAreaShading'].reset(false);
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
          subSubTitle: this.getAttrValueByCode(filteredLocations[0], subSubTitle, 'subSubTitle')
        };
        titlePayload.push(payload);
      }
    });
    return titlePayload;
  }
}
