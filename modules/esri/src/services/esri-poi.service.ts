import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { EsriUtils } from '../core/esri-utils';
import { LabelDefinition, MarkerSymbolDefinition } from '../models/common-configuration';
import { MapSymbols } from '../models/esri-types';
import { PoiConfiguration, PoiConfigurationTypes } from '../models/poi-configuration';
import { AppState } from '../state/esri.reducers';
import { selectors } from '../state/esri.selectors';
import { addPoi, addPois, deletePoi, deletePois, loadPois, upsertPoi, upsertPois } from '../state/poi/esri.poi.actions';
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

  updatePoiConfig(poi: PoiConfiguration | PoiConfiguration[]) : void {
    if (Array.isArray(poi)) {
      this.store$.dispatch(upsertPois({ pois: poi }));
    } else {
      this.store$.dispatch(upsertPoi({ poi }));
    }
  }

  deletePoiConfig(poi: PoiConfiguration | PoiConfiguration[]) : void {
    if (Array.isArray(poi)) {
      this.store$.dispatch(deletePois({ ids: poi.map(p => p.id) }));
    } else {
      this.store$.dispatch(deletePoi({ id: poi.id }));
    }
  }

  private setUpPoiUpdateWatcher() : void {
    this.store$.select(poiSelectors.poiDefsForUpdate).pipe(
      filter(configs => configs != null && configs.length > 0)
    ).subscribe(configs => {
      configs.forEach(config => this.updatePoiLayer(config));
    });
  }

  private updatePoiLayer(config: PoiConfiguration) : void {
    const layer = this.layerService.getLayerByUniqueId(config.featureLayerId);
    if (EsriUtils.layerIsFeature(layer)) {
      layer.when(() => {
        const props: Partial<__esri.FeatureLayer> = {
          renderer: this.createGeneralizedRenderer(config),
          visible: config.visible,
          opacity: config.opacity,
          title: config.layerName,
          minScale: config.minScale,
          labelsVisible: config.showLabels,
          labelingInfo: [ this.createLabelFromDefinition(config.labelDefinition) ]
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
        break;
    }
  }

  private createSymbolFromDefinition(currentDef: MarkerSymbolDefinition) : __esri.symbols.SimpleMarkerSymbol {
    const outline = this.domainFactory.createSimpleLineSymbol(currentDef.outlineColor || [0, 0, 0, 0]);
    // const path = currentDef.markerType === 'path' ? MapSymbols.STAR : undefined;
    return this.domainFactory.createSimpleMarkerSymbol(currentDef.color, outline, 'path', MapSymbols.STAR);
  }

  private createLabelFromDefinition(currentDef: LabelDefinition) : __esri.LabelClass {
    const font = this.domainFactory.createFont(currentDef.size, currentDef.isBold ? 'bold' : 'normal');
    const arcade = `$feature.${currentDef.featureAttribute}`;
    return this.domainFactory.createExtendedLabelClass(currentDef.color, currentDef.haloColor, arcade, font);
  }
}
