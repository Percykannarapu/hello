import { Injectable } from '@angular/core';
import FieldInfo from '@arcgis/core/popup/FieldInfo';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import ActionButton from '@arcgis/core/support/actions/ActionButton';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { isNil, isNotNil, mergeEntityUpdatesById } from '@val/common';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { filter, map, reduce, switchMap, take, tap } from 'rxjs/operators';
import { EsriDomainFactory } from '../core/esri-domain.factory';
import { LayerTypes } from '../core/esri.enums';
import { BoundaryConfiguration, PopupDefinition } from '../models/boundary-configuration';
import { FillSymbolDefinition, LabelDefinition } from '../models/common-configuration';
import { RgbTuple } from '../models/esri-types';
import { loadBoundaries, updateBoundaries, updateBoundary, upsertBoundaries, upsertBoundary } from '../state/boundary/esri.boundary.actions';
import { boundarySelectors } from '../state/boundary/esri.boundary.selectors';
import { AppState } from '../state/esri.reducers';
import { selectors } from '../state/esri.selectors';
import { EsriConfigService } from './esri-config.service';
import { EsriLayerService } from './esri-layer.service';

@Injectable()
export class EsriBoundaryService {

  allBoundaryConfigurations$: Observable<BoundaryConfiguration[]> = new BehaviorSubject<BoundaryConfiguration[]>([]);
  allVisibleBoundaryConfigs$: Observable<BoundaryConfiguration[]> = new BehaviorSubject<BoundaryConfiguration[]>([]);
  allLoadedBoundaryConfigs$: Observable<BoundaryConfiguration[]> = new BehaviorSubject<BoundaryConfiguration[]>([]);

  private _popupFactory: (feature: __esri.Feature, layerId: string, popupDefinition: PopupDefinition) => HTMLElement = null;
  private _popupThisContext: any = null;

  constructor(private esriConfig: EsriConfigService,
              private layerService: EsriLayerService,
              private store$: Store<AppState>) {
    this.store$.select(selectors.getMapReady).pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.initializeSelectors();
      this.setupWatchers();
    });
  }

  private static createLabelFromDefinition(currentDef: LabelDefinition, layerOpacity: number) : __esri.LabelClass {
    const weight = currentDef.isBold ? 'bold' : 'normal';
    const style = currentDef.isItalic ? 'italic' : 'normal';
    const font = EsriDomainFactory.createFont(currentDef.size, weight, style, currentDef.family);
    const arcade = currentDef.customExpression || `$feature.${currentDef.featureAttribute}`;
    const attributes = {};
    if (currentDef.where != null) {
      attributes['where'] = currentDef.where;
    }
    const color = RgbTuple.withAlpha(currentDef.color, layerOpacity);
    const haloColor = RgbTuple.withAlpha(currentDef.haloColor, layerOpacity);
    return EsriDomainFactory.createExtendedLabelClass(color, haloColor, arcade, currentDef.forceLabelsVisible ?? false, font, 'always-horizontal', attributes);
  }

  private static createSymbolFromDefinition(def: FillSymbolDefinition) : __esri.SimpleFillSymbol {
    const currentDef = def || { fillColor: [0, 0, 0, 0], fillType: 'solid' };
    const outline = EsriDomainFactory.createSimpleLineSymbol(currentDef.outlineColor || [0, 0, 0, 0], currentDef.outlineWidth);
    return EsriDomainFactory.createSimpleFillSymbol(currentDef.fillColor, outline, currentDef.fillType);
  }

  private initializeSelectors() : void {
    this.store$.select(boundarySelectors.allBoundaryDefs).subscribe(this.allBoundaryConfigurations$ as BehaviorSubject<BoundaryConfiguration[]>);
    this.store$.select(boundarySelectors.visibleBoundaryDefs).subscribe(this.allVisibleBoundaryConfigs$ as BehaviorSubject<BoundaryConfiguration[]>);
    this.store$.select(boundarySelectors.loadedBoundaryDefs).subscribe(this.allLoadedBoundaryConfigs$ as BehaviorSubject<BoundaryConfiguration[]>);
  }

  private setupWatchers() : void {
    this.store$.select(boundarySelectors.boundariesReadyToCreate).pipe(
      filter(configs => configs != null && configs.length > 0),
      switchMap(configs => this.createBoundaryLayers(configs))
    ).subscribe(updates => this.store$.dispatch(updateBoundaries({ boundaries: updates })));

    this.store$.select(boundarySelectors.boundariesReadyToUpdate).pipe(
      filter(configs => configs != null && configs.length > 0)
    ).subscribe(configs => {
      this.routeLayerUpdates(configs);
    });

    this.store$.select(boundarySelectors.boundariesReadyToDelete).pipe(
      filter(configs => configs != null && configs.length > 0)
    ).subscribe(configs => {
      this.removeGroups(configs);
    });
  }

  loadBoundaryConfig(boundaries: BoundaryConfiguration[]) : void {
    this.store$.dispatch(loadBoundaries({ boundaries }));
  }

  upsertBoundaryConfig(boundary: BoundaryConfiguration | BoundaryConfiguration[]) : void {
    if (Array.isArray(boundary)) {
      this.store$.dispatch(upsertBoundaries({ boundaries: boundary }));
    } else {
      this.store$.dispatch(upsertBoundary({ boundary }));
    }
  }

  updateBoundaryConfig(boundary: Update<BoundaryConfiguration> | Update<BoundaryConfiguration>[]) : void {
    if (Array.isArray(boundary)) {
      this.store$.dispatch(updateBoundaries({ boundaries: boundary }));
    } else {
      this.store$.dispatch(updateBoundary({ boundary }));
    }
  }

  setDynamicPopupFactory(factory: (feature: __esri.Feature, layerId: string, popupDefinition: PopupDefinition) => HTMLElement, thisContext: any) {
    this._popupFactory = factory;
    this._popupThisContext = thisContext;
  }

  private createBoundaryLayers(configurations: BoundaryConfiguration[]) : Observable<Update<BoundaryConfiguration>[]> {
    const allObservables: Observable<Update<BoundaryConfiguration>>[] = [];
    configurations.forEach(config => {
      const group = this.layerService.createPortalGroup(config.groupName, true, config.sortOrder);
      const layerUrl = this.esriConfig.getLayerUrl(config.layerKey, LayerTypes.Polygon, config.useSimplifiedInfo);
      const minScale = config.useSimplifiedInfo && config.simplifiedMinScale != null ? config.simplifiedMinScale : config.minScale;

      const layerPipeline = this.layerService.createPortalLayer(layerUrl, config.layerName, minScale, false, { legendEnabled: false }).pipe(
        tap(layer => group.add(layer)),
        map(layer => ({ id: config.id, changes: { destinationBoundaryId: layer.id } }))
      );
      allObservables.push(layerPipeline);
    });
    return merge(...allObservables).pipe(
      reduce((acc, result) => [...acc, result], [] as Update<BoundaryConfiguration>[]),
      map(allUpdates => mergeEntityUpdatesById(allUpdates)),
    );
  }

  private removeGroups(configurations: BoundaryConfiguration[]) : void {
    const updatesForDispatch: Update<BoundaryConfiguration>[] = [];
    configurations.forEach(config => {
      this.layerService.removeGroup(config.groupName);
      updatesForDispatch.push({ id: config.id, changes: { destinationBoundaryId: undefined, destinationCentroidId: undefined, destinationPOBId: undefined }});
    });
    if (updatesForDispatch.length > 0) this.store$.dispatch(updateBoundaries({ boundaries: updatesForDispatch }));
  }

  private routeLayerUpdates(configurations: BoundaryConfiguration[]) : void {
    const boundaryUpdates: BoundaryConfiguration[] = [];
    const pointCreates: BoundaryConfiguration[] = [];
    const pointRemovals: BoundaryConfiguration[] = [];
    configurations.forEach(config => {
      if ((isNil(config.destinationCentroidId) && config.showCentroids) ||
          (isNil(config.destinationPOBId) && config.showPOBs)) {
        pointCreates.push(config);
      }
      if ((isNotNil(config.destinationCentroidId) && config.showCentroids === false) ||
          (isNotNil(config.destinationPOBId) && config.showPOBs === false)) {
        pointRemovals.push(config);
      }
      boundaryUpdates.push(config);
    });

    if (pointCreates.length > 0) this.createPointLayers(pointCreates);
    if (pointRemovals.length > 0) this.removePointLayers(pointRemovals);
    if (boundaryUpdates.length > 0) this.updateLayers(boundaryUpdates);
  }

  private updateLayers(configurations: BoundaryConfiguration[]) : void {
    configurations.forEach(config => {
      const currentLayer = this.layerService.getLayerByUniqueId(config.destinationBoundaryId) as __esri.FeatureLayer;
      const currentCentroid = config.destinationCentroidId != null ? this.layerService.getLayerByUniqueId(config.destinationCentroidId) as __esri.FeatureLayer : null;
      const currentPob = isNotNil(config.destinationPOBId) ? this.layerService.getLayerByUniqueId(config.destinationPOBId) as __esri.FeatureLayer : null;
      currentLayer.when(() => {
        const minScale = config.useSimplifiedInfo && config.simplifiedMinScale != null ? config.simplifiedMinScale : config.minScale;
        const defaultSymbol = EsriBoundaryService.createSymbolFromDefinition(config.symbolDefinition);
        const labels = [
          config.showHouseholdCounts && config.hhcLabelDefinition != null
            ? EsriBoundaryService.createLabelFromDefinition(config.hhcLabelDefinition, config.opacity)
            : EsriBoundaryService.createLabelFromDefinition(config.labelDefinition, config.opacity)
        ];
        let popupDef = null;
        if (config.showPopups && config.popupDefinition != null) {
          popupDef = this.createPopupTemplate(currentLayer, config);
        }
        const additionalAttributes: Partial<__esri.FeatureLayer> = {
          minScale: minScale,
          labelsVisible: config.showLabels,
          labelingInfo: labels,
          renderer: EsriDomainFactory.createSimpleRenderer(defaultSymbol),
          opacity: config.opacity,
          visible: config.visible,
          popupEnabled: config.showPopups && !config.useSimplifiedInfo,
          popupTemplate: popupDef,
          outFields: null
        };
        if (config.isPrimarySelectableLayer) additionalAttributes.outFields = ['*'];
        currentLayer.set(additionalAttributes);
        if (isNotNil(currentCentroid)) {
          currentCentroid.when(() => {
            const centroidAttributes: Partial<__esri.FeatureLayer> = {
              opacity: config.opacity,
            };
            currentCentroid.set(centroidAttributes);
          });
        }
        if (isNotNil(currentPob)) {
          currentPob.when(() => {
            let pobPopup = null;
            if (config.showPopups && config.popupDefinition != null) {
              pobPopup = this.createPopupTemplate(currentPob, config);
            }
            const pobAttributes: Partial<__esri.FeatureLayer> = {
              opacity: config.opacity,
              popupEnabled: config.showPopups && !config.useSimplifiedInfo,
              popupTemplate: pobPopup,
            };
            currentPob.set(pobAttributes);
          });
        }
      });
    });
  }

  private createPointLayers(configurations: BoundaryConfiguration[]) : void {
    const allObservables: Observable<Update<BoundaryConfiguration>>[] = [];
    configurations.forEach(config => {
      if (isNil(config.destinationCentroidId) && config.showCentroids) {
        allObservables.push(this.generatePointLayer(config, false));
      }
      if (isNil(config.destinationPOBId) && config.showPOBs) {
        allObservables.push(this.generatePointLayer(config, true));
      }
    });
    merge(...allObservables).pipe(
      reduce((acc, result) => [...acc, result], [] as Update<BoundaryConfiguration>[]),
      map(allUpdates => mergeEntityUpdatesById(allUpdates)),
      take(1)
    ).subscribe(updates => this.store$.dispatch(updateBoundaries({ boundaries: updates })));
  }

  private generatePointLayer(config: BoundaryConfiguration, isPob: boolean) : Observable<Update<BoundaryConfiguration>> {
    const group = this.layerService.createPortalGroup(config.groupName, true, config.sortOrder);
    const minScale = config.useSimplifiedInfo && config.simplifiedMinScale != null ? config.simplifiedMinScale : config.minScale;
    const layerName = `${config.layerKey.toUpperCase()} ${isPob ? 'POBs' : 'Centroids'}`;
    const layerUrl = this.esriConfig.getLayerUrl(config.layerKey, LayerTypes.Point, isPob);
    const additionalAttributes: Partial<__esri.FeatureLayer> = {
      legendEnabled: false,
      popupEnabled: isPob ? config.showPopups && ! config.useSimplifiedInfo : false,
    };
    return this.layerService.createPortalLayer(layerUrl, layerName, minScale, true, additionalAttributes).pipe(
      tap(layer => group.add(layer)),
      map(layer => ({ id: config.id, changes: isPob ? { destinationPOBId: layer.id } : { destinationCentroidId: layer.id } }))
    );
  }

  private removePointLayers(configurations: BoundaryConfiguration[]) : void {
    const updatesForDispatch: Update<BoundaryConfiguration>[] = [];
    configurations.forEach(config => {
      const changes: Partial<BoundaryConfiguration>[] = [];
      if (isNotNil(config.destinationCentroidId) && config.showCentroids === false) {
        const centroidLayer = this.layerService.getLayerByUniqueId(config.destinationCentroidId);
        this.layerService.removeLayer(centroidLayer);
        changes.push({ destinationCentroidId: undefined });
      }
      if (isNotNil(config.destinationPOBId) && config.showPOBs === false) {
        const pobLayer = this.layerService.getLayerByUniqueId(config.destinationPOBId);
        this.layerService.removeLayer(pobLayer);
        changes.push({ destinationPOBId: undefined });
      }
      if (changes.length > 0) updatesForDispatch.push({ id: config.id, changes: Object.assign({}, ...changes)});
    });
    if (updatesForDispatch.length > 0) this.store$.dispatch(updateBoundaries({ boundaries: updatesForDispatch }));
  }

  private createPopupTemplate(target: __esri.FeatureLayer, config: BoundaryConfiguration) : __esri.PopupTemplate {
    const selectThisAction = new ActionButton({
      title: 'Add/Remove Geo',
      id: 'select-this',
      className: 'esri-icon-plus-circled'
    });
    const definedFields = isNil(config.popupDefinition.popupFields) ? ['latitude', 'longitude'] : ['latitude', 'longitude'].concat(config.popupDefinition.popupFields);
    const hiddenFields = new Set<string>(['latitude', 'longitude']);
    const fieldsToUse = new Set<string>(definedFields);
    const byDefinedFieldIndex = (f1, f2) => definedFields.indexOf(f1.fieldName) - definedFields.indexOf(f2.fieldName);
    const fieldInfos = target.fields.filter(f => fieldsToUse.has(f.name)).map(f => new FieldInfo({ fieldName: f.name, label: f.alias, visible: !hiddenFields.has(f.name) }));
    fieldInfos.sort(byDefinedFieldIndex);
    const result: __esri.PopupTemplateProperties = { title: config.popupDefinition.titleExpression };
    if (config.isPrimarySelectableLayer) {
      result.actions = [selectThisAction];
    } else {
      result.actions = [];
    }
    if (config.popupDefinition.useCustomPopup && this._popupFactory != null) {
      result.content = (feature: __esri.Feature) => this._popupFactory.call(this._popupThisContext, feature, config.layerKey, config.popupDefinition);
    } else {
      result.content = [{ type: 'fields', fieldInfos: fieldInfos }];
    }
    result.outFields = Array.from(fieldsToUse);
    result.overwriteActions = true;
    return new PopupTemplate(result);
  }
}
