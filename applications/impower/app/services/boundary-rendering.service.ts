import { Injectable } from '@angular/core';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { getUuid, mapByExtended } from '@val/common';
import { BasicLayerSetup, BoundaryConfiguration, duplicateLabel, EsriBoundaryService, updateBoundaries } from '@val/esri';
import { EnvironmentData } from 'environments/environment';
import { distinctUntilChanged, filter, take, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { FullAppState } from '../state/app.interfaces';
import { getBatchMode } from '../state/batch-map/batch-map.selectors';
import { projectIsReady } from '../state/data-shim/data-shim.selectors';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppComponentGeneratorService } from './app-component-generator.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService, Season } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class BoundaryRenderingService {

  constructor(private appConfig: AppConfig,
              private appStateService: AppStateService,
              private appPrefService: AppProjectPrefService,
              private generator: AppComponentGeneratorService,
              private esriBoundaryService: EsriBoundaryService,
              private store$: Store<FullAppState>) {
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.setupProjectPrefsWatcher();
      this.setupAnalysisLevelWatcher();
      this.setupSeasonWatcher();
    });
  }

  private static getHHCLabelExpression(featureExpression: string, isSummer: boolean) : string {
    const hhExpr = isSummer ? 'hhld_s' : 'hhld_w';
    return `${featureExpression} + TextFormatting.NewLine + "(" + Text($feature.${hhExpr}, "#,###") + ")"`;
  }

  private static isSummer() : boolean {
    const today: Date = new Date();
    today.setDate(today.getDate() + 28);
    return today.getMonth() >= 4 && today.getMonth() <= 8;
  }

  private setupProjectPrefsWatcher() : void {
    this.esriBoundaryService.allBoundaryConfigurations$.pipe(
      withLatestFrom(this.store$.select(projectIsReady), this.store$.select(getBatchMode)),
      filter(([, ready, isBatchMode]) => ready && !isBatchMode)
    ).subscribe(([boundary]) => {
      const newDefs: BoundaryConfiguration[] = JSON.parse(JSON.stringify(boundary));
      newDefs.forEach(s => {
        s.destinationBoundaryId = undefined;
        s.destinationCentroidId = undefined;
      });
      this.appPrefService.deletePref('esri', 'map-boundary-defs');
      this.appPrefService.createPref('esri', 'map-boundary-defs', JSON.stringify(newDefs), 'STRING', true);
    });
  }

  private setupAnalysisLevelWatcher() : void {
    this.appStateService.analysisLevel$.pipe(
      distinctUntilChanged(),
      withLatestFrom(this.store$.select(getBatchMode)),
      filter(([al, isBatch]) => al != null && al.length > 0 && !isBatch),
      withLatestFrom(this.esriBoundaryService.allBoundaryConfigurations$)
    ).subscribe(([[analysis], configs]) => {
      const analysisLevelLayers = new Set(['zip', 'atz', 'dtz', 'pcr']);
      const idsToAdd = configs.filter(c => this.isLayerVisible(c.dataKey, analysis)).map(c => c.id);
      const idsToRemove = configs.filter(c => analysisLevelLayers.has(c.dataKey) && c.visible).map(c => c.id);
      const primaryMap = mapByExtended(configs, c => c.id, c => this.appConfig.analysisLevelToLayerKey(analysis) === c.dataKey);
      const addSet = new Set(idsToAdd);
      const removeSet = new Set(idsToRemove);
      const adds = idsToAdd.filter(id => !removeSet.has(id)).map(id => ({ id, changes: { visible: true, alwaysLoad: false, isPrimarySelectableLayer: primaryMap.get(id) } }));
      const removes = idsToRemove.filter(id => !addSet.has(id)).map(id => ({ id, changes: { visible: false, alwaysLoad: false, isPrimarySelectableLayer: false } }));
      if (adds.length > 0 || removes.length > 0) {
        this.store$.dispatch(updateBoundaries({ boundaries: [ ...adds, ...removes ] }));
      }
    });
  }

  private setupSeasonWatcher() : void {
    this.appStateService.season$.pipe(
      withLatestFrom(this.store$.select(getBatchMode)),
      filter(([season, isBatch]) => season != null && !isBatch),
      withLatestFrom(this.esriBoundaryService.allBoundaryConfigurations$)
    ).subscribe(([[season], configs]) => {
      const newHhldField = season === Season.Summer ? 'hhld_s' : 'hhld_w';
      const oldHhldField = season !== Season.Summer ? 'hhld_s' : 'hhld_w';
      const edits: Update<BoundaryConfiguration>[] = [];
      configs.forEach(c => {
        if (c.hhcLabelDefinition != null) {
          const newLabel = duplicateLabel(c.hhcLabelDefinition);
          newLabel.customExpression = newLabel.customExpression.replace(oldHhldField, newHhldField);
          edits.push({ id: c.id, changes: { hhcLabelDefinition: newLabel }});
        }
      });
      if (edits.length > 0) {
        this.store$.dispatch(updateBoundaries({ boundaries: edits }));
      }
    });
  }

  public getDataKeyByBoundaryLayerId(layerId: string) : string {
    const dataKey = Object.keys(EnvironmentData.layerIds).filter(key => EnvironmentData.layerIds[key].boundary === layerId || EnvironmentData.layerIds[key].simplifiedBoundary === layerId);
    if (dataKey != null && dataKey.length > 0) {
      return dataKey[0];
    } else {
      throw new Error(`Boundary layer '${layerId}' could not be found in the Environment Settings`);
    }
  }

  public getLayerSetupInfo(key: string) : BasicLayerSetup {
    const scales = {
      state: {
        minScale: undefined,
        batchMinScale: undefined,
        defaultFontSize: 12
      },
      dma: {
        minScale: undefined,
        batchMinScale: undefined,
        defaultFontSize: 16
      },
      counties: {
        minScale: undefined,
        batchMinScale: undefined,
        defaultFontSize: 14
      },
      wrap: {
        minScale: undefined,
        batchMinScale: undefined,
        defaultFontSize: 12
      },
      zip: {
        minScale: undefined,
        batchMinScale: undefined,
        defaultFontSize: 12
      },
      atz: {
        minScale: 6933600,
        batchMinScale: undefined,
        defaultFontSize: 10
      },
      dtz: {
        minScale: 4622342,
        batchMinScale: 6933600,
        defaultFontSize: 10
      },
      pcr: {
        minScale: 4622342,
        batchMinScale: 6933600,
        defaultFontSize: 10
      },
    };
    return {
      ...scales[key],
      ...EnvironmentData.layerIds[key]
    };
  }

  public getConfigurations(project?: ImpProject) : BoundaryConfiguration[] {
    let analysisLevel = null;
    let existingSetup: BoundaryConfiguration[] = null;
    let result: BoundaryConfiguration[];
    let isSummer = BoundaryRenderingService.isSummer();
    if (project != null) {
      const newPref = this.appPrefService.getPrefVal('map-boundary-defs');
      if (newPref) {
        existingSetup = JSON.parse(newPref);
      }
      analysisLevel = project.methAnalysis;
      isSummer = project.impGeofootprintMasters[0].methSeason.toUpperCase() === 'S';
    }
    const defaultSetup = this.createDefaultConfigurations(analysisLevel, isSummer);

    if (existingSetup == null) {
      result = defaultSetup;
    } else {
      const defaultMap = mapByExtended(defaultSetup, b => b.dataKey);
      // here we are fixing up any saved data with internal values that the users will never really modify
      // (arcade strings, popup definitions, etc...)
      const existingIds = new Set<string>(existingSetup.map(b => b.dataKey));
      const newConfigs = defaultSetup.filter(db => !existingIds.has(db.dataKey));
      existingSetup.forEach(b => {
        if (defaultMap.has(b.dataKey)) {
          const currentDefaults = defaultMap.get(b.dataKey);
          if (b.pobLabelDefinition != null && currentDefaults.pobLabelDefinition != null) {
            b.pobLabelDefinition.featureAttribute = currentDefaults.pobLabelDefinition.featureAttribute;
            b.pobLabelDefinition.customExpression = currentDefaults.pobLabelDefinition.customExpression;
            b.pobLabelDefinition.where = currentDefaults.pobLabelDefinition.where;
          }
          if (b.labelDefinition != null && currentDefaults.labelDefinition != null) {
            b.labelDefinition.featureAttribute = currentDefaults.labelDefinition.featureAttribute;
            b.labelDefinition.customExpression = currentDefaults.labelDefinition.customExpression;
            b.labelDefinition.where = currentDefaults.labelDefinition.where;
          }
          if (b.hhcLabelDefinition != null && currentDefaults.hhcLabelDefinition != null) {
            b.hhcLabelDefinition.featureAttribute = currentDefaults.hhcLabelDefinition.featureAttribute;
            b.hhcLabelDefinition.customExpression = currentDefaults.hhcLabelDefinition.customExpression;
            b.hhcLabelDefinition.where = currentDefaults.hhcLabelDefinition.where;
          }
          b.popupDefinition = currentDefaults.popupDefinition;
          b.isPrimarySelectableLayer = currentDefaults.isPrimarySelectableLayer;
          b.sortOrder = currentDefaults.sortOrder;
        }
      });
      existingSetup.push(...newConfigs);
      result = existingSetup;
    }

    this.esriBoundaryService.setDynamicPopupFactory(this.generator.geographyPopupFactory, this.generator);
    this.appPrefService.createPref('esri', 'map-boundary-defs', JSON.stringify(result), 'STRING', true);
    return result;
  }

  private createDefaultConfigurations(analysisLevel: string, isSummer: boolean) : BoundaryConfiguration[] {
    const labelExpression = 'iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), " ")';
    // const labelExpression = 'replace($feature.geocode, $feature.zip, "")'; new label - requires layer changes to work
    return [
      {
        ...this.createBasicBoundaryDefinition('state', analysisLevel),
        sortOrder: 0,
        hasPOBs: false,
        groupName: 'States',
        layerName: 'State Boundaries',
        showLabels: false,
        showPopups: false,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [80, 80, 80, 1], outlineWidth: 1 },
        labelDefinition: {
          haloColor: [255, 255, 255, 1], isBold: true, featureAttribute: 'STATE_ABBR', color: [80, 80, 80, 1],
          size: this.getLayerSetupInfo('state').defaultFontSize
        },
        popupDefinition: null
      },
      {
        ...this.createBasicBoundaryDefinition('dma', analysisLevel),
        sortOrder: 1,
        hasPOBs: false,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [139, 76, 178, 1], outlineWidth: 2.5 },
        labelDefinition: {
          haloColor: [255, 255, 255, 1], isBold: true, featureAttribute: 'dma_display_name', color: [139, 76, 178, 1],
          size: this.getLayerSetupInfo('dma').defaultFontSize
        },
        popupDefinition: {
          titleExpression: 'DMA: {DMA_CODE}&nbsp;&nbsp;&nbsp;&nbsp;{DMA_NAME}',
          useCustomPopup: false,
          includeInvestment: false,
          popupFields: ['dma_name', 'dma_area', 'cent_lat', 'cent_long'],
        },
      },
      {
        ...this.createBasicBoundaryDefinition('counties', analysisLevel),
        sortOrder: 2,
        hasPOBs: false,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [0, 0, 0, 1], outlineWidth: 3 },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [0, 0, 0, 1], size: this.getLayerSetupInfo('counties').defaultFontSize,
          customExpression: 'TEXT($feature.state_fips, "00") + TEXT($feature.county_fip, "000") + TextFormatting.NewLine + $feature.county_nam' },
        popupDefinition: {
          titleExpression: 'County: {COUNTY_NAM}, {STATE_ABBR}',
          useCustomPopup: false,
          includeInvestment: false,
          popupFields: ['gdt_id', 'county_nam', 'state_fips', 'county_fip', 'county_are', 'cent_lat', 'cent_long'],
        },
      },
      {
        ...this.createBasicBoundaryDefinition('wrap', analysisLevel),
        sortOrder: 3,
        hasPOBs: false,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [0, 100, 0, 1], outlineWidth: 3 },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [0, 100, 0, 1], size: this.getLayerSetupInfo('wrap').defaultFontSize, featureAttribute: 'wrap_name' },
        hhcLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [0, 100, 0, 1], size: this.getLayerSetupInfo('wrap').defaultFontSize,
          customExpression: BoundaryRenderingService.getHHCLabelExpression('$feature.wrap_name', isSummer) },
        popupDefinition: {
          titleExpression: 'Wrap: {GEOCODE}<br>{WRAP_NAME}',
          useCustomPopup: true,
          includeInvestment: false,
          customPopupPks: [40690, 40691],
          customSecondaryPopupPks: [14031, 14032, 9103, 14001, 33024, 33043, 33041, 1001, 5017, 1057, 1048, 1083, 4062, 5020, 40746]
        },
      },
      {
        ...this.createBasicBoundaryDefinition('zip', analysisLevel),
        sortOrder: 4,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [51, 59, 103, 1], outlineWidth: 2 },
        pobLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('zip').defaultFontSize, featureAttribute: 'geocode' },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('zip').defaultFontSize, featureAttribute: 'geocode' },
        hhcLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('zip').defaultFontSize,
          customExpression: BoundaryRenderingService.getHHCLabelExpression('$feature.geocode', isSummer) },
        popupDefinition: {
          titleExpression: 'ZIP: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
          useCustomPopup: true,
          includeInvestment: true,
          customPopupPks: [40690, 40691],
          customSecondaryPopupPks: [14031, 14032, 9103, 14001, 33024, 33043, 33041, 1001, 5017, 1057, 1048, 1083, 4062, 5020, 40746]
        },
      },
      {
        ...this.createBasicBoundaryDefinition('atz', analysisLevel),
        sortOrder: 5,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [68, 79, 137, 1], outlineWidth: 0.75 },
        pobLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('atz').defaultFontSize,
          customExpression: labelExpression },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('atz').defaultFontSize,
          customExpression: labelExpression },
        hhcLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('atz').defaultFontSize,
          customExpression: BoundaryRenderingService.getHHCLabelExpression(labelExpression, isSummer) },
        popupDefinition: {
          titleExpression: 'ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
          useCustomPopup: true,
          includeInvestment: true,
          customPopupPks: [40690, 40691],
          customSecondaryPopupPks: [14031, 14032, 9103, 14001, 33024, 33043, 33041, 1001, 5017, 1057, 1048, 1083, 4062, 5020, 40746]
        },
      },
      {
        ...this.createBasicBoundaryDefinition('dtz', analysisLevel),
        sortOrder: 6,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [68, 79, 137, 1], outlineWidth: 0.75 },
        pobLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('dtz').defaultFontSize,
          customExpression: labelExpression },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('dtz').defaultFontSize,
          customExpression: labelExpression },
        hhcLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('dtz').defaultFontSize,
          customExpression: BoundaryRenderingService.getHHCLabelExpression(labelExpression, isSummer) },
        popupDefinition: {
          titleExpression: 'Digital ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
          useCustomPopup: true,
          includeInvestment: true,
          customPopupPks: [40690, 40691],
          customSecondaryPopupPks: [14031, 14032, 9103, 14001, 33024, 33043, 33041, 1001, 5017, 1057, 1048, 1083, 4062, 5020, 40746]
        },
      },
      {
        ...this.createBasicBoundaryDefinition('pcr', analysisLevel),
        sortOrder: 7,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [131, 134, 150, 1], outlineWidth: 0.5 },
        pobLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('pcr').defaultFontSize,
          customExpression: labelExpression },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('pcr').defaultFontSize,
          customExpression: labelExpression },
        hhcLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('pcr').defaultFontSize,
          customExpression: BoundaryRenderingService.getHHCLabelExpression(labelExpression, isSummer) },
        popupDefinition: {
          titleExpression: 'PCR: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
          useCustomPopup: true,
          includeInvestment: true,
          customPopupPks: [40690, 40691],
          customSecondaryPopupPks: [14031, 14032, 9103, 14001, 33024, 33043, 33041, 1001, 5017, 1057, 1048, 1083, 4062, 5020, 40746]
        },
      }
    ];
  }

  private createBasicBoundaryDefinition(key: string, analysisLevel: string) : BoundaryConfiguration {
    const basicInfo = this.getLayerSetupInfo(key);
    return {
      id: getUuid(),
      dataKey: key,
      groupName: `Valassis ${key.toUpperCase()}`,
      centroidPortalId: basicInfo.centroid,
      portalId: basicInfo.boundary,
      simplifiedPortalId: basicInfo.simplifiedBoundary,
      minScale: basicInfo.minScale,
      simplifiedMinScale: basicInfo.batchMinScale,
      layerName: `${key.toUpperCase()} Boundaries`,
      opacity: 1,
      visible: this.isLayerVisible(key, analysisLevel),
      showCentroids: false,
      useSimplifiedInfo: this.appConfig.isBatchMode,
      showLabels: true,
      showPOBs: false,
      hasPOBs: true,
      showPopups: true,
      showHouseholdCounts: false,
      isPrimarySelectableLayer: analysisLevel == null ? false : this.appConfig.analysisLevelToLayerKey(analysisLevel) === key,
    } as BoundaryConfiguration;
  }

  private isLayerVisible(layerId: string, analysisLevel: string) : boolean {
    if (analysisLevel != null && analysisLevel.length > 0) {
      const key = this.appConfig.analysisLevelToLayerKey(analysisLevel);
      return layerId === 'zip' || layerId === key;
    }
    return false;
  }
}
