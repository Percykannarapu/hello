import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { isNumber } from '@val/common';
import { filter, takeUntil, map, tap, withLatestFrom } from 'rxjs/operators';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { localSelectors } from '../../state/app.selectors';
import { FullState } from '../../state';
import { Observable, Subject } from 'rxjs';
import { NavigateToReviewPage, SaveMediaPlan, GeneratePdf } from '../../state/shared/shared.actions';
import { VarDefinition, ShadingType } from '../../state/shading/shading.reducer';
import { MediaPlanPrefPayload } from '../../state/payload-models/MediaPlanPref';
import { MediaPlanPref } from 'src/app/val-modules/mediaexpress/models/MediaPlanPref';
import { NumericVariableShadingMethod } from '../shading-config/shading-config.component';
import { DAOBaseStatus } from 'src/app/val-modules/api/models/BaseModel';

export class MapConfig {
  showDist: boolean;
  gridDisplay: 'small' | 'large' | 'none' = 'small';
  shadeBy: string;
  variable: VarDefinition;
  method: NumericVariableShadingMethod;
  classes: number;
  classBreakValues: number[];
}

@Component({
  selector: 'cpq-header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.css']
})
export class HeaderBarComponent implements OnInit, OnDestroy {

  private updateIds: number[] = [];
  private addIds: number[] = [];
  private componentDestroyed$ = new Subject();

  mapConfig: MapConfig = new MapConfig;

  mediaplanPref: MediaPlanPref;
  
  appReady$: Observable<boolean>;
  isSaving$: Observable<boolean>;
  generateDisabled$: Observable<boolean>;

  totalDistribution: number;
  totalInvestment: number;
  mediaPlanId: number;
  mediaPlanGroupNumber: number;
  rfpNumber: string;
  rfpName: string;
  productName: string;
  rfpId: string;
  get hasAdditions() { return this.addIds.length > 0; }

  get isClean() {
    return this.updateIds.length === 0 && this.addIds.length === 0;
  }

  constructor(private store$: Store<FullState>) { }

  ngOnInit() {
    this.store$.pipe(
      select(localSelectors.getRfpUiEditDetailEntities),
      takeUntil(this.componentDestroyed$)
    ).subscribe(state => {
      this.calcMetrics(state);
    });

    this.store$.pipe(
      select(localSelectors.getHeaderInfo),
      filter(header => header != null),
      takeUntil(this.componentDestroyed$)
    ).subscribe(headers => {
      this.mediaPlanId = headers.mediaPlanId;
      this.rfpNumber = headers.rfpNumber;
      this.rfpName = headers.rfpName;
      this.productName = headers.productName;
      this.mediaPlanGroupNumber = headers.mediaPlanGroup;
      this.rfpId = headers.rfpId;
      this.addIds = headers.addIds;
      this.updateIds = headers.updateIds;
    });

    

    this.appReady$ = this.store$.pipe(
      select(localSelectors.getAppReady)
    );
    this.isSaving$ = this.store$.pipe(
      select(localSelectors.getIsSaving)
    );
    
    this.generateDisabled$ = this.store$.pipe(select(localSelectors.getFilteredGeos));
    
    this.store$.pipe(
      withLatestFrom(this.store$.select(localSelectors.getSharedState), this.store$.select(localSelectors.getShadingState))
    ).subscribe( ([,  shared, shading]) => {
         this.mapConfig.classes = shading.selectedClassBreaks != null ? shading.selectedClassBreaks : 0;
         this.mapConfig.gridDisplay = shared.grisSize;
         this.mapConfig.method = shading.selectedNumericMethod;
         this.mapConfig.shadeBy = ShadingType[shading.shadeBy];
         this.mapConfig.showDist = shared.isDistrQtyEnabled; 
         this.mapConfig.variable = shading.selectedVar;
         this.mapConfig.classBreakValues = shading.classBreakValues;
    });

    this.store$.pipe(
      select(localSelectors.getAppReady),
      withLatestFrom(this.store$.select(localSelectors.getMediaPlanPrefEntities)),
      filter(([ready]) => ready)).subscribe(([, mediaPlanPrefs]) => {
        mediaPlanPrefs.forEach(mediaplanPref => {
            if (mediaplanPref.prefGroup === 'CPQ MAPS')
                this.mediaplanPref = mediaplanPref;
        });
      });

  }

  ngOnDestroy() : void {
    this.componentDestroyed$.next();
  }

  onCancel() : void {
    this.store$.dispatch(new NavigateToReviewPage({ rfpId: this.rfpId, mediaPlanGroupNumber: this.mediaPlanGroupNumber }));
  }

  onSave() {
    console.log('mapConfig payload:::', JSON.stringify(this.mapConfig));
    const mediaplanPrefPayload = this.createPayload(JSON.stringify(this.mapConfig));
    this.store$.dispatch(new SaveMediaPlan({ addIds: this.addIds, updateIds: this.updateIds, mapConfig: mediaplanPrefPayload}));
  }

  createPayload(mapConfigPayload: string){
    const mediaplanPrefPayload: MediaPlanPref = {
      prefId: this.mediaplanPref.prefId,
      mediaPlanId: this.mediaPlanId,
      prefGroup: 'CPQ MAPS',
      prefType: 'STRING',
      pref: 'settings',
      val: mapConfigPayload,
      largeVal: null,
      isActive: true,
      dirty: true,
      baseStatus: this.mediaplanPref.mediaPlanId == null ? DAOBaseStatus.INSERT : DAOBaseStatus.UPDATE,
      mediaPlan: null, setTreeProperty: null, removeTreeProperty: null, convertToModel: null
   };
   return mediaplanPrefPayload;
  }

  

  exportMaps(){
    this.store$.dispatch(new GeneratePdf());
  }

  private calcMetrics(entities: RfpUiEditDetail[]) {
    this.totalInvestment = 0;
    this.totalDistribution = 0;
    for (const entity of entities) {
      if (entity.isSelected && isNumber(entity.distribution) && isNumber(entity.investment)) {
        this.totalDistribution += entity.distribution;
        this.totalInvestment += entity.investment;
      }
    }
  }
}
