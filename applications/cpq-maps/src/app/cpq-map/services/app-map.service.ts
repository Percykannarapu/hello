import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { mapByExtended, mapToEntity, simpleFlatten } from '@val/common';
import { EsriApi, EsriLayerService, EsriMapService, EsriUtils, LayerDefinition, SetLayerLabelExpressions } from '@val/esri';
import { merge, Observable } from 'rxjs';
import { tap, reduce, finalize } from 'rxjs/operators';
import { FullState } from '../state';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AppMapService {

  private layersWithPOBs = new Set(['ZIP Boundaries', 'ATZ Boundaries', 'Digital ATZ Boundaries', 'PCR Boundaries']);

  constructor(private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private config: ConfigService,
              private store$: Store<FullState>) { }

  public setupApplication(selectedAnalysisLevel: string) : Observable<void> {
    const homeView = this.mapService.mapView.viewpoint;

    return this.initializeLayers(selectedAnalysisLevel).pipe(
      reduce(() => null, null), // reduce is just used here to "wait" until all the layers are done
      finalize(() => {
        // setup the map widgets
        this.mapService.createBasicWidget(EsriApi.widgets.Home, { viewpoint: homeView });
        this.mapService.createHiddenWidget(EsriApi.widgets.Search, {}, { expandIconClass: 'esri-icon-search', expandTooltip: 'Search'});
        this.mapService.createHiddenWidget(EsriApi.widgets.LayerList, {}, { expandIconClass: 'esri-icon-layer-list', expandTooltip: 'Layer List'});
        this.mapService.createHiddenWidget(EsriApi.widgets.BaseMapGallery, {}, { expandIconClass: 'esri-icon-basemap', expandTooltip: 'Basemap Gallery'});
        this.mapService.createBasicWidget(EsriApi.widgets.ScaleBar, { unit: 'dual' }, 'bottom-left');

        const popup = this.mapService.mapView.popup;
        popup.highlightEnabled = false;
        EsriApi.projection.load();
      })
    );
  }

  private initializeLayers(selectedAnalysisLevel: string) : Observable<__esri.FeatureLayer> {
    const layerGroups = new Map<string, LayerDefinition[]>();
    for (const layerGroup of Object.values(this.config.layers)) {
      layerGroups.set(layerGroup.group.name, [layerGroup.centroids, layerGroup.boundaries]);
      this.setupPortalGroup(layerGroup.group.name, layerGroup.group.analysisLevelName, selectedAnalysisLevel);
    }
    const results: Observable<__esri.FeatureLayer>[] = [];
    layerGroups.forEach((value, key) => {
      const layerObservables = this.setupLayerGroup(key, value.filter(l => l != null));
      results.push(...layerObservables);
    });
    return merge(...results, 2);
  }

  private setupPortalGroup(groupName: string, layerAnalysisLevel: string, selectedAnalysisLevel: string) : void {
    const visible = (layerAnalysisLevel === selectedAnalysisLevel || (selectedAnalysisLevel === 'atz' && layerAnalysisLevel === 'zip'));
    this.layerService.createPortalGroup(groupName, visible);
    const group = this.layerService.getPortalGroup(groupName);
    if (group == null) throw new Error(`Invalid Group Name: '${groupName}'`);
  }

  private setupLayerGroup(groupName: string, layerDefinitions: LayerDefinition[]) : Observable<__esri.FeatureLayer>[]{
    const group = this.layerService.getPortalGroup(groupName);
    const layerObservables: Observable<__esri.FeatureLayer>[] = [];
    layerDefinitions.forEach(layerDef => {
      const current = this.layerService.createPortalLayer(layerDef.id, layerDef.name, layerDef.minScale, layerDef.defaultVisibility).pipe(
        tap(newLayer => {
          newLayer.popupEnabled = false;
          newLayer.when(() => {
            if (EsriUtils.rendererIsSimple(newLayer.renderer)) {
              const renderer: __esri.SimpleRenderer = newLayer.renderer.clone();
              renderer.symbol.color = new EsriApi.Color([128, 128, 128, 0.01]);
              newLayer.renderer = renderer;
            }
          });
          group.add(newLayer);
        })
      );
      layerObservables.push(current);
    });
    return layerObservables;
  }

  public updateLabelExpressions(showPOBs: boolean) : void {
    const groupDefs = Object.values(this.config.layers);
    const allLayers = simpleFlatten(groupDefs.map(g => [g.centroids, g.boundaries])).filter(l => l != null);
    const labelLayerMap = mapByExtended(allLayers, l => l.id, l => ({ expression: this.getLabelExpression(l, showPOBs), fontSizeOffset: l.labelFontSizeOffset }));
    this.store$.dispatch(new SetLayerLabelExpressions({ expressions: mapToEntity(labelLayerMap) }));
  }

  private getLabelExpression(l: LayerDefinition, showPOBs: boolean) : string {
    if (this.layersWithPOBs.has(l.name)) {
      if (showPOBs) {
        return l.labelExpression;
      } else {
        return `IIF($feature.pob == "B", "", ${l.labelExpression})`;
      }
    } else {
      return l.labelExpression;
    }
  }
}