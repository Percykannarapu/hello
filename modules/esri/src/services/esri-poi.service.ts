import { Injectable } from '@angular/core';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take, withLatestFrom } from 'rxjs/operators';
import { EsriUtils } from '../core/esri-utils';
import { LabelDefinition, MarkerSymbolDefinition } from '../models/common-configuration';
import { MapSymbols } from '../models/esri-types';
import { PoiConfiguration, PoiConfigurationTypes, SimplePoiConfiguration, UniquePoiConfiguration } from '../models/poi-configuration';
import { AppState } from '../state/esri.reducers';
import { selectors } from '../state/esri.selectors';
import {
  addPoi,
  addPois,
  deletePoi,
  deletePois,
  loadPois,
  setPopupFields,
  updatePoi,
  updatePois,
  upsertPoi,
  upsertPois
} from '../state/poi/esri.poi.actions';
import { poiSelectors } from '../state/poi/esri.poi.selectors';
import { EsriDomainFactoryService } from './esri-domain-factory.service';
import { EsriLayerService } from './esri-layer.service';

@Injectable()
export class EsriPoiService {

  allPoiConfigurations$: Observable<PoiConfiguration[]> = new BehaviorSubject<PoiConfiguration[]>([]);

  constructor(private layerService: EsriLayerService,
              private store$: Store<AppState>,
              private domainFactory: EsriDomainFactoryService) {
    this.store$.select(selectors.getMapReady).pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.initializeSelectors();
      this.setUpPoiUpdateWatcher();
    });
  }

  private initializeSelectors() : void {
    this.store$.select(poiSelectors.allPoiDefs).subscribe(this.allPoiConfigurations$ as BehaviorSubject<PoiConfiguration[]>);
  }

  loadPoiConfig(pois: PoiConfiguration[]) : void {
    this.store$.dispatch(loadPois({ pois }));
  }

  addPoiConfig(poi: PoiConfiguration | PoiConfiguration[]) : void {
    if (Array.isArray(poi)) {
      this.store$.dispatch(addPois({ pois: poi }));
    } else {
      this.store$.dispatch(addPoi({ poi }));
    }
  }

  upsertPoiConfig(poi: PoiConfiguration | PoiConfiguration[]) : void {
    if (Array.isArray(poi)) {
      this.store$.dispatch(upsertPois({ pois: poi }));
    } else {
      this.store$.dispatch(upsertPoi({ poi }));
    }
  }

  updatePoiConfig(poi: Update<PoiConfiguration> | Update<PoiConfiguration>[]) : void {
    if (Array.isArray(poi)) {
      this.store$.dispatch(updatePois({ pois: poi }));
    } else {
      this.store$.dispatch(updatePoi({ poi }));
    }
  }

  deletePoiConfig(poi: PoiConfiguration | PoiConfiguration[]) : void {
    if (Array.isArray(poi)) {
      this.store$.dispatch(deletePois({ ids: poi.map(p => p.id) }));
    } else {
      this.store$.dispatch(deletePoi({ id: poi.id }));
    }
  }

  setPopupFields(fieldNames: string[]) : void {
    this.store$.dispatch(setPopupFields({ fieldNames: [...fieldNames]}));
  }

  private setUpPoiUpdateWatcher() : void {
    this.store$.select(poiSelectors.poiDefsForUpdate).pipe(
      filter(configs => configs != null && configs.length > 0),
      withLatestFrom(this.store$.select(poiSelectors.popupFields)),
    ).subscribe(([configs, popupFields]) => {
      configs.forEach(config => this.updatePoiLayer(config, popupFields));
    });
  }

  private updatePoiLayer(config: PoiConfiguration, popupFields: string[]) : void {
    const layer = this.layerService.getLayerByUniqueId(config.featureLayerId);
    const visibleFieldSet = new Set(popupFields);
    if (EsriUtils.layerIsFeature(layer)) {
      layer.when(() => {
        const popupTemplate = layer.createPopupTemplate();
        popupTemplate.title = `${config.dataKey}: {locationName}`;
        popupTemplate.fieldInfos = popupTemplate.fieldInfos.filter(fi => visibleFieldSet.has(fi.fieldName));
        popupTemplate.fieldInfos.sort((a, b) => {
          return popupFields.indexOf(a.fieldName) - popupFields.indexOf(b.fieldName);
        });
        const props: __esri.FeatureLayerProperties = {
          renderer: this.createGeneralizedRenderer(config),
          visible: config.visible,
          opacity: config.opacity,
          title: config.layerName,
          minScale: config.minScale,
          popupEnabled: true,
          popupTemplate,
          labelsVisible: config.showLabels,
          labelingInfo: this.createLabelFromDefinition(config)
        };
        layer.set(props);
        this.layerService.addLayerToLegend(layer.id, null);
      });
    }
  }

  private createGeneralizedRenderer(config: PoiConfiguration) : __esri.Renderer {
    switch (config.poiType) {
      case PoiConfigurationTypes.Simple:
        const simpleSymbol = this.createSymbolFromDefinition(config.symbolDefinition);
        const simpleRenderer = this.domainFactory.createSimpleRenderer(simpleSymbol);
        simpleRenderer.label = config.symbolDefinition.legendName || config.layerName || config.groupName;
        return simpleRenderer;
      case PoiConfigurationTypes.Unique:
        const uniqueValues: __esri.UniqueValueInfoProperties[] = config.breakDefinitions.map(u => ({ label: u.legendName, value: u.value, symbol: this.createSymbolFromDefinition(u) }));
        const uniqueRenderer = this.domainFactory.createUniqueValueRenderer(null, uniqueValues);
        uniqueRenderer.valueExpression = `$feature.${config.featureAttribute}`;
        return uniqueRenderer;
    }
  }

  private createSymbolFromDefinition(currentDef: MarkerSymbolDefinition) : __esri.symbols.SimpleMarkerSymbol {
    let outlineColor = currentDef.outlineColor || [0, 0, 0, 0];
    let outlineSize = 1;
    if (currentDef.markerType === 'cross' || currentDef.markerType === 'x') {
      outlineColor = currentDef.color;
      outlineSize = 2;
    }
    const outline = this.domainFactory.createSimpleLineSymbol(outlineColor, outlineSize);
    const path = currentDef.markerType === 'path' ? MapSymbols.STAR : undefined;
    const sizeMultiple = currentDef.markerType === 'path' ? 1.4 : 1;
    const markerSize = (currentDef.size || 10) * sizeMultiple;
    return this.domainFactory.createSimpleMarkerSymbol(currentDef.color, outline, currentDef.markerType, path, markerSize);
  }

  private createLabelFromDefinition(config: PoiConfiguration) : __esri.LabelClass[] {
    switch (config.poiType) {
      case PoiConfigurationTypes.Simple:
        return [ this.createSimpleLabel(config) ];
      case PoiConfigurationTypes.Unique:
        return this.createMultiLabel(config);
    }
  }

  private createSimpleLabel(config: SimplePoiConfiguration) : __esri.LabelClass {
    const currentDef = config.labelDefinition;
    const font = this.createLabelFont(currentDef);
    const arcade = currentDef.customExpression || `$feature.${currentDef.featureAttribute}`;
    const color = !currentDef.usesStaticColor ? config.symbolDefinition.color : currentDef.color;
    const haloColor = !currentDef.usesStaticColor ? config.symbolDefinition.outlineColor : currentDef.haloColor;
    return this.domainFactory.createExtendedLabelClass(color, haloColor, arcade, font);
  }

  private createMultiLabel(config: UniquePoiConfiguration) : __esri.LabelClass[] {
    const result: __esri.LabelClass[] = [];
    const currentDef = config.labelDefinition;
    const font = this.createLabelFont(currentDef);
    const arcade = currentDef.customExpression || `$feature.${currentDef.featureAttribute}`;
    config.breakDefinitions.forEach(bd => {
      const where = `${config.featureAttribute} = '${bd.value}'`;
      const color = !currentDef.usesStaticColor ? bd.color : currentDef.color;
      const haloColor = !currentDef.usesStaticColor ? bd.outlineColor : currentDef.haloColor;
      result.push(this.domainFactory.createExtendedLabelClass(color, haloColor, arcade, font, 'below-center', { where }));
    });
    return result;
  }

  private createLabelFont(currentDef: LabelDefinition) : __esri.Font {
    const weight = currentDef.isBold ? 'bold' : 'normal';
    const style = currentDef.isItalic ? 'italic' : 'normal';
    return this.domainFactory.createFont(currentDef.size, weight, style, currentDef.family);
  }
}
