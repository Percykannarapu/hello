import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { getUuid, mapByExtended } from '@val/common';
import { BasicLayerSetup, BoundaryConfiguration, EsriBoundaryService } from '@val/esri';
import { distinctUntilChanged, filter, take, withLatestFrom } from 'rxjs/operators';
import { updateBoundaries } from '../../../../modules/esri/src/state/boundary/esri.boundary.actions';
import { EnvironmentData } from '../../environments/environment';
import { AppConfig } from '../app.config';
import { FullAppState } from '../state/app.interfaces';
import { getBatchMode } from '../state/batch-map/batch-map.selectors';
import { projectIsReady } from '../state/data-shim/data-shim.selectors';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppComponentGeneratorService } from './app-component-generator.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService } from './app-state.service';

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
    });
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
      this.store$.dispatch(updateBoundaries({ boundaries: [ ...adds, ...removes ] }));
    });
  }

  public getDataKeyByBoundaryLayerId(layerId: string) : string {
    const dataKey = Object.keys(EnvironmentData.layerIds).filter(key => EnvironmentData.layerIds[key].boundary === layerId);
    if (dataKey != null && dataKey.length > 0) {
      return dataKey[0];
    } else {
      throw new Error(`Boundary layer '${layerId}' could not be found in the Environment Settings`);
    }
  }

  public getLayerSetupInfo(key: string) : BasicLayerSetup {
    const scales = {
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
        minScale: 4622342,
        batchMinScale: 9244684,
        defaultFontSize: 12
      },
      zip: {
        minScale: 1155600,
        batchMinScale: 2311200,
        defaultFontSize: 12
      },
      atz: {
        minScale: 1155600,
        batchMinScale: 2311200,
        defaultFontSize: 10
      },
      dtz: {
        minScale: 577790,
        batchMinScale: 1155580,
        defaultFontSize: 10
      },
      pcr: {
        minScale: 577790,
        batchMinScale: 1155580,
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
    if (project != null) {
      const newPref = this.appPrefService.getPrefVal('map-boundary-defs');
      if (newPref) {
        existingSetup = JSON.parse(newPref);
      }
      analysisLevel = project.methAnalysis;
    }
    const defaultSetup = this.createDefaultConfigurations(analysisLevel);

    if (existingSetup == null) {
      result = defaultSetup;
    } else {
      const defaultMap = mapByExtended(defaultSetup, b => b.dataKey);
      // here we are fixing up any saved data with internal values that the users will never really modify
      // (arcade strings, popup definitions, etc...)
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
        }
      });
      result = existingSetup;
    }
    this.appPrefService.createPref('esri', 'map-boundary-defs', JSON.stringify(result), 'STRING', true);
    this.esriBoundaryService.setDynamicPopupFactory(this.generator.geographyPopupFactory, this.generator);
    return result;
  }

  public createDefaultConfigurations(analysisLevel: string) : BoundaryConfiguration[] {
    const legacyLabelExpression = 'iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), " ")';
    const newLabelExpression = 'replace($feature.geocode, $feature.zip, "")';
    const labelExpression = legacyLabelExpression;
    const hhExpr = BoundaryRenderingService.isSummer() ? 'hhld_s' : 'hhld_w';
    return [
      {
        ...this.createBasicBoundaryDefinition('dma', analysisLevel),
        sortOrder: 0,
        hasPOBs: false,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [139, 76, 178, 1], outlineWidth: 2.5 },
        labelDefinition: {
          haloColor: [255, 255, 255, 1], isBold: true, featureAttribute: 'dma_display_name', color: [139, 76, 178, 1],
          size: this.getLayerSetupInfo('dma').defaultFontSize
        },
        popupDefinition: {
          titleExpression: 'DMA: {DMA_CODE}&nbsp;&nbsp;&nbsp;&nbsp;{DMA_NAME}',
          useCustomPopup: false,
          popupFields: ['dma_name', 'dma_area', 'cent_lat', 'cent_long'],
          secondaryPopupFields: []
        },
      },
      {
        ...this.createBasicBoundaryDefinition('counties', analysisLevel),
        sortOrder: 1,
        hasPOBs: false,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [0, 0, 0, 1], outlineWidth: 3 },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [0, 0, 0, 1], size: this.getLayerSetupInfo('counties').defaultFontSize,
          customExpression: 'TEXT($feature.state_fips, "00") + TEXT($feature.county_fip, "000") + TextFormatting.NewLine + $feature.county_nam' },
        popupDefinition: {
          titleExpression: 'County: {COUNTY_NAM}, {STATE_ABBR}',
          useCustomPopup: false,
          popupFields: ['gdt_id', 'county_nam', 'state_fips', 'county_fip', 'county_are', 'cent_lat', 'cent_long'],
          secondaryPopupFields: []
        },
      },
      {
        ...this.createBasicBoundaryDefinition('wrap', analysisLevel),
        sortOrder: 2,
        hasPOBs: false,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [0, 100, 0, 1], outlineWidth: 3 },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [0, 100, 0, 1], size: this.getLayerSetupInfo('wrap').defaultFontSize, featureAttribute: 'wrap_name' },
        hhcLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [0, 100, 0, 1], size: this.getLayerSetupInfo('wrap').defaultFontSize,
          customExpression: `$feature.wrap_name + TextFormatting.NewLine + "(" + Text($feature.${hhExpr}, "#,###") + ")"` },
        popupDefinition: {
          titleExpression: 'Wrap: {GEOCODE}<br>{WRAP_NAME}',
          useCustomPopup: false,
          popupFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00'],
          secondaryPopupFields: []
        },
      },
      {
        ...this.createBasicBoundaryDefinition('zip', analysisLevel),
        sortOrder: 3,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [51, 59, 103, 1], outlineWidth: 2 },
        pobLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('zip').defaultFontSize, featureAttribute: 'geocode' },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('zip').defaultFontSize, featureAttribute: 'geocode' },
        hhcLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('zip').defaultFontSize,
          customExpression: `$feature.geocode + TextFormatting.NewLine + "(" + Text($feature.${hhExpr}, "#,###") + ")"` },
        popupDefinition: {
          titleExpression: 'ZIP: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
          useCustomPopup: true,
          popupFields: ['dma_name', 'county_name', 'Investment'],
          secondaryPopupFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language'],
          hiddenPopupFields: ['latitude', 'longitude']
        },
      },
      {
        ...this.createBasicBoundaryDefinition('atz', analysisLevel),
        sortOrder: 4,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [68, 79, 137, 1], outlineWidth: 0.75 },
        pobLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('atz').defaultFontSize,
          customExpression: labelExpression },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('atz').defaultFontSize,
          customExpression: labelExpression },
        hhcLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('atz').defaultFontSize,
          customExpression: `${labelExpression} + TextFormatting.NewLine + "(" + Text($feature.${hhExpr}, "#,###") + ")"` },
        popupDefinition: {
          titleExpression: 'ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
          useCustomPopup: true,
          popupFields: ['dma_name', 'county_name', 'Investment'],
          secondaryPopupFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language'],
          hiddenPopupFields: ['latitude', 'longitude']
        },
      },
      {
        ...this.createBasicBoundaryDefinition('dtz', analysisLevel),
        sortOrder: 5,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [68, 79, 137, 1], outlineWidth: 0.75 },
        pobLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('dtz').defaultFontSize,
          customExpression: labelExpression },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('dtz').defaultFontSize,
          customExpression: labelExpression },
        hhcLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('dtz').defaultFontSize,
          customExpression: `${labelExpression} + TextFormatting.NewLine + "(" + Text($feature.${hhExpr}, "#,###") + ")"` },
        popupDefinition: {
          titleExpression: 'Digital ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
          useCustomPopup: true,
          popupFields: ['dma_name', 'county_name', 'Investment'],
          secondaryPopupFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00'],
          hiddenPopupFields: ['latitude', 'longitude']
        },
      },
      {
        ...this.createBasicBoundaryDefinition('pcr', analysisLevel),
        sortOrder: 6,
        symbolDefinition: { fillColor: [0, 0, 0, 0], fillType: 'solid', outlineColor: [131, 134, 150, 1], outlineWidth: 0.5 },
        pobLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('pcr').defaultFontSize,
          customExpression: labelExpression },
        labelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('pcr').defaultFontSize,
          customExpression: labelExpression },
        hhcLabelDefinition: { haloColor: [255, 255, 255, 1], isBold: true, color: [51, 59, 103, 1], size: this.getLayerSetupInfo('pcr').defaultFontSize,
          customExpression: `${labelExpression} + TextFormatting.NewLine + "(" + Text($feature.${hhExpr}, "#,###") + ")"` },
        popupDefinition: {
          titleExpression: 'PCR: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
          useCustomPopup: true,
          popupFields: ['dma_name', 'county_name', 'Investment'],
          secondaryPopupFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language'],
          hiddenPopupFields: ['latitude', 'longitude']
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
