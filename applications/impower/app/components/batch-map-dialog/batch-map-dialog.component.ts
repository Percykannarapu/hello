import { Component, OnInit, OnChanges } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { LocalAppState, BatchMapPayload, BatchMapSizes, TitlePayload } from 'app/state/app.interfaces';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppConfig } from 'app/app.config';
import { AppStateService } from 'app/services/app-state.service';
import { Observable } from 'rxjs';
import { getBatchMapDialog } from 'app/state/batch-map/batch-map.selectors';
import { CreateBatchMap, CloseBatchMapDialog } from 'app/state/batch-map/batch-map.actions';
import { UserService } from 'app/services/user.service';
import { filter } from 'rxjs/operators';
import { SelectItem } from 'primeng/api';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { AppLocationService } from 'app/services/app-location.service';

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
  variableOptions: SelectItem[];
  selectedVariable: string;
  input = {
    'title': this.currentProjectName,
    'subTitle': '',
    'subSubTitle': ''
  };

  constructor(private store$: Store<LocalAppState>,
    private fb: FormBuilder,
    private appLocationService: AppLocationService,
    private stateService: AppStateService,
    private userService: UserService) {
      this.pageSettings = [
        {label: '8.5 x 11 (Letter)', value: BatchMapSizes.letter},
        {label: '8.5 x 14 (Legal)', value: BatchMapSizes.legal},
        {label: '11 x 17 (Tabloid)', value: BatchMapSizes.tabloid},
        {label: '24 x 36 (Arch-D)', value: BatchMapSizes.large},
        {label: '36 x 48 (Arch-E)', value: BatchMapSizes.jumbo}
      ];
    }

  initForm() {
    this.batchMapForm = this.fb.group({
      title: ['user-defined', Validators.required],
      subTitle: 'user-defined',
      subSubTitle: 'user-defined',
      neighboringSites: 'true',
      pageSettingsControl: BatchMapSizes.letter,
      layout: 'landscape',
      titleInput: this.currentProjectName,
      subTitleInput: '',
      subSubTitleInput: '',
    });
  }

  ngOnInit() {
    this.initForm();
    this.showBatchMapDialog$ = this.store$.select(getBatchMapDialog);
    this.stateService.currentProject$.pipe(filter(p => p != null)).subscribe(p => {
      this.currentProjectId = p.projectId;
      this.currentProjectName = p.projectName;
      this.numSites = p.getImpGeofootprintLocations().length;
    });
    this.appLocationService.listTypeBS$.subscribe( (list: SelectItem[]) => {
      const customList: SelectItem[] = [];
      customList.push({ label: '<user defined>', value: 'user-defined' });
      list.forEach((listEntry) => {
        customList.push(listEntry);
      });
      this.siteLabels = customList;
    });
  }

  onSubmit(dialogFields: any) {
    this.input['title'] = (dialogFields['titleInput'] === null) ? this.currentProjectName : dialogFields['titleInput'];
    this.input['subTitle'] = dialogFields['subTitleInput'];
    this.input['subSubTitle'] = dialogFields['subSubTitleInput'];
    const siteIds: string[] = this.getSiteIds();
    const titles: Array<TitlePayload> = this.getTitles(siteIds);
    const size: BatchMapSizes = <BatchMapSizes> dialogFields.pageSettingsControl;
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
              hideNeighboringSites: !(dialogFields.neighboringSites == 'true'),
              shadeNeighboringSites: false
            }
          }
        }
      ]
    };

    this.store$.dispatch(new CreateBatchMap({ templateFields: formData}));
    this.closeDialog();
  }

  private getSiteIds() : Array<string> {
    const siteIds: Array<string> = [];
    this.stateService.currentProject$.getValue().impGeofootprintMasters[0].impGeofootprintLocations.forEach(s => siteIds.push(s.locationNumber));
    return siteIds;
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.batchMapForm.get(controlKey);
    return (control.dirty || control.untouched || control.value == null) && (control.errors != null);
  }

  closeDialog(){
      this.batchMapForm.reset();
      this.store$.dispatch(new CloseBatchMapDialog());
      this.initForm();
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
