import { Injectable } from '@angular/core';
import FieldInfo from '@arcgis/core/popup/FieldInfo';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import ActionButton from '@arcgis/core/support/actions/ActionButton';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { filter, map, reduce, switchMap, take, tap } from 'rxjs/operators';
import { BoundaryConfiguration, PopupDefinition } from '../models/boundary-configuration';
import { FillSymbolDefinition, LabelDefinition } from '../models/common-configuration';
import { RgbTuple } from '../models/esri-types';
import { loadBoundaries, updateBoundaries, updateBoundary, upsertBoundaries, upsertBoundary } from '../state/boundary/esri.boundary.actions';
import { boundarySelectors } from '../state/boundary/esri.boundary.selectors';
import { AppState } from '../state/esri.reducers';
import { selectors } from '../state/esri.selectors';
import { EsriDomainFactoryService } from './esri-domain-factory.service';
import { EsriLayerService } from './esri-layer.service';

@Injectable()
export class EsriBoundaryService {

  allBoundaryConfigurations$: Observable<BoundaryConfiguration[]> = new BehaviorSubject<BoundaryConfiguration[]>([]);
  allVisibleBoundaryConfigs$: Observable<BoundaryConfiguration[]> = new BehaviorSubject<BoundaryConfiguration[]>([]);
  allLoadedBoundaryConfigs$: Observable<BoundaryConfiguration[]> = new BehaviorSubject<BoundaryConfiguration[]>([]);

  private _popupFactory: (feature: __esri.Feature, fields: __esri.FieldInfo[], layerId: string, popupDefinition: PopupDefinition) => HTMLElement = null;
  private _popupThisContext: any = null;

  constructor(private layerService: EsriLayerService,
              private store$: Store<AppState>,
              private domainFactory: EsriDomainFactoryService) {
    this.store$.select(selectors.getMapReady).pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.initializeSelectors();
      this.setupWatchers();
    });
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

  setDynamicPopupFactory(factory: (feature: __esri.Feature, fields: __esri.FieldInfo[], layerId: string, popupDefinition: PopupDefinition) => HTMLElement, thisContext: any) {
    this._popupFactory = factory;
    this._popupThisContext = thisContext;
  }

  private createBoundaryLayers(configurations: BoundaryConfiguration[]) : Observable<Update<BoundaryConfiguration>[]> {
    const allObservables: Observable<Update<BoundaryConfiguration>>[] = [];
    configurations.forEach(config => {
      const group = this.layerService.createPortalGroup(config.groupName, true, config.sortOrder);
      const layerId = config.useSimplifiedInfo && config.simplifiedPortalId != null ? config.simplifiedPortalId : config.portalId;
      const minScale = config.useSimplifiedInfo && config.simplifiedMinScale != null ? config.simplifiedMinScale : config.minScale;

      const layerPipeline = this.layerService.createPortalLayer(layerId, config.layerName, minScale, false, { legendEnabled: false }).pipe(
        tap(layer => group.add(layer)),
        map(layer => ({ id: config.id, changes: { destinationBoundaryId: layer.id } }))
      );
      allObservables.push(layerPipeline);
    });
    return merge(...allObservables).pipe(
      reduce((acc, result) => [...acc, result], [] as Update<BoundaryConfiguration>[])
    );
  }

  private removeGroups(configurations: BoundaryConfiguration[]) : void {
    const updatesForDispatch: Update<BoundaryConfiguration>[] = [];
    configurations.forEach(config => {
      this.layerService.removeGroup(config.groupName);
      updatesForDispatch.push({ id: config.id, changes: { destinationBoundaryId: undefined, destinationCentroidId: undefined }});
    });
    if (updatesForDispatch.length > 0) this.store$.dispatch(updateBoundaries({ boundaries: updatesForDispatch }));
  }

  private routeLayerUpdates(configurations: BoundaryConfiguration[]) : void {
    const boundaryUpdates: BoundaryConfiguration[] = [];
    const centroidCreates: BoundaryConfiguration[] = [];
    const centroidRemovals: BoundaryConfiguration[] = [];
    configurations.forEach(config => {
      if (config.destinationCentroidId == null && config.showCentroids) {
        centroidCreates.push(config);
      } else {
        if (config.destinationCentroidId != null && config.showCentroids === false) {
          centroidRemovals.push(config);
        }
        boundaryUpdates.push(config);
      }
    });

    if (centroidCreates.length > 0) this.createCentroids(centroidCreates);
    if (centroidRemovals.length > 0) this.removeCentroids(centroidRemovals);
    if (boundaryUpdates.length > 0) this.updateLayers(boundaryUpdates);
  }

  private updateLayers(configurations: BoundaryConfiguration[]) : void {
    configurations.forEach(config => {
      const currentLayer = this.layerService.getLayerByUniqueId(config.destinationBoundaryId) as __esri.FeatureLayer;
      const currentCentroid = config.destinationCentroidId != null ? this.layerService.getLayerByUniqueId(config.destinationCentroidId) as __esri.FeatureLayer : null;
      currentLayer.when(() => {
        const minScale = config.useSimplifiedInfo && config.simplifiedMinScale != null ? config.simplifiedMinScale : config.minScale;
        const defaultSymbol = this.createSymbolFromDefinition(config.symbolDefinition);
        const labels = [
          config.showHouseholdCounts && config.hhcLabelDefinition != null
            ? this.createLabelFromDefinition(config.hhcLabelDefinition, config.opacity)
            : this.createLabelFromDefinition(config.labelDefinition, config.opacity)
        ];
        // if (config.showPOBs && config.pobLabelDefinition != null) {
        //   labels.push(this.createLabelFromDefinition(config.pobLabelDefinition));
        // }
        let layerQuery = null;
        if (config.hasPOBs) {
          layerQuery = config.showPOBs ? null : `COALESCE(pob, '') <> 'B'`;
        }
        let popupDef = null;
        if (config.showPopups && config.popupDefinition != null) {
          popupDef = this.createPopupTemplate(currentLayer, config);
        }
        const additionalAttributes: Partial<__esri.FeatureLayer> = {
          minScale: minScale,
          labelsVisible: config.showLabels,
          labelingInfo: labels,
          renderer: this.domainFactory.createSimpleRenderer(defaultSymbol),
          opacity: config.opacity,
          definitionExpression: layerQuery,
          visible: config.visible,
          popupEnabled: config.showPopups && !config.useSimplifiedInfo,
          popupTemplate: popupDef,
        };
        currentLayer.set(additionalAttributes);
        if (currentCentroid != null) {
          currentCentroid.when(() => {
            let centroidQuery = null;
            if (config.hasPOBs && !config.useSimplifiedInfo) {
              centroidQuery = config.showPOBs ? null : `is_pob_only = 0`;
            }
            const centroidAttributes: Partial<__esri.FeatureLayer> = {
              opacity: config.opacity,
              definitionExpression: centroidQuery
            };
            currentCentroid.set(centroidAttributes);
          });
        }
      });
    });
  }

  private createCentroids(configurations: BoundaryConfiguration[]) : void {
    const allObservables: Observable<Update<BoundaryConfiguration>>[] = [];
    configurations.forEach(config => {
      const group = this.layerService.createPortalGroup(config.groupName, true, config.sortOrder);
      const minScale = config.useSimplifiedInfo && config.simplifiedMinScale != null ? config.simplifiedMinScale : config.minScale;
      const layerName = `${config.dataKey.toUpperCase()} Centroids`;
      const additionalAttributes: Partial<__esri.FeatureLayer> = {
        legendEnabled: false,
        popupEnabled: false,
      };
      const layerPipeline = this.layerService.createPortalLayer(config.centroidPortalId, layerName, minScale, true, additionalAttributes).pipe(
        tap(layer => group.add(layer, 1)),
        map(layer => ({ id: config.id, changes: { destinationCentroidId: layer.id } }))
      );
      allObservables.push(layerPipeline);
    });
    merge(...allObservables).pipe(
      reduce((acc, result) => [...acc, result], [] as Update<BoundaryConfiguration>[]),
      take(1)
    ).subscribe(updates => this.store$.dispatch(updateBoundaries({ boundaries: updates })));
  }

  private removeCentroids(configurations: BoundaryConfiguration[]) : void {
    const updatesForDispatch: Update<BoundaryConfiguration>[] = [];
    configurations.forEach(config => {
      const centroid = this.layerService.getLayerByUniqueId(config.destinationCentroidId);
      this.layerService.removeLayer(centroid);
      updatesForDispatch.push({ id: config.id, changes: { destinationCentroidId: undefined }});
    });
    if (updatesForDispatch.length > 0) this.store$.dispatch(updateBoundaries({ boundaries: updatesForDispatch }));
  }

  private createLabelFromDefinition(currentDef: LabelDefinition, layerOpacity: number) : __esri.LabelClass {
    const weight = currentDef.isBold ? 'bold' : 'normal';
    const style = currentDef.isItalic ? 'italic' : 'normal';
    const font = this.domainFactory.createFont(currentDef.size, weight, style, currentDef.family);
    const arcade = currentDef.customExpression || `$feature.${currentDef.featureAttribute}`;
    const attributes = {};
    if (currentDef.where != null) {
      attributes['where'] = currentDef.where;
    }
    const color = RgbTuple.withAlpha(currentDef.color, layerOpacity);
    const haloColor = RgbTuple.withAlpha(currentDef.haloColor, layerOpacity);
    return this.domainFactory.createExtendedLabelClass(color, haloColor, arcade, font, 'always-horizontal', attributes);
  }

  private createSymbolFromDefinition(def: FillSymbolDefinition) : __esri.SimpleFillSymbol {
    const currentDef = def || { fillColor: [0, 0, 0, 0], fillType: 'solid' };
    const outline = this.domainFactory.createSimpleLineSymbol(currentDef.outlineColor || [0, 0, 0, 0], currentDef.outlineWidth);
    return this.domainFactory.createSimpleFillSymbol(currentDef.fillColor, outline, currentDef.fillType);
  }

  private createPopupTemplate(target: __esri.FeatureLayer, config: BoundaryConfiguration) : __esri.PopupTemplate {
    const selectThisAction = new ActionButton({
      title: 'Add/Remove Geo',
      id: 'select-this',
      className: 'esri-icon-plus-circled'
    });
    const definedFields = [...config.popupDefinition.popupFields, ...(config.popupDefinition.secondaryPopupFields || []), ...(config.popupDefinition.hiddenPopupFields || ['latitude', 'longitude'])];
    const hiddenFields = new Set<string>(config.popupDefinition.hiddenPopupFields || ['latitude', 'longitude']);
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
      result.content = (feature: __esri.Feature) => this._popupFactory.call(this._popupThisContext, feature, fieldInfos, config.portalId, config.popupDefinition);
    } else {
      result.content = [{ type: 'fields', fieldInfos: fieldInfos }];
    }
    result.outFields = Array.from(fieldsToUse);
    result.overwriteActions = true;
    return new PopupTemplate(result);
  }
}
