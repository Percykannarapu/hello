import { Injectable } from '@angular/core';
import Color from '@arcgis/core/Color';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import PortalBasemapsSource from '@arcgis/core/widgets/BasemapGallery/support/PortalBasemapsSource';
import Home from '@arcgis/core/widgets/Home';
import LayerList from '@arcgis/core/widgets/LayerList';
import ScaleBar from '@arcgis/core/widgets/ScaleBar';
import Search from '@arcgis/core/widgets/Search';
import { select, Store } from '@ngrx/store';
import { simpleFlatten } from '@val/common';
import { EsriLabelLayerOptions, EsriLayerService, EsriMapService, EsriService, EsriUtils, LayerDefinition, selectors } from '@val/esri';
import { merge, Observable } from 'rxjs';
import { distinctUntilChanged, finalize, map, reduce, tap } from 'rxjs/operators';
import { FullState } from '../state';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AppMapService {

  private layersWithPOBs = new Set(['ZIP Boundaries', 'ATZ Boundaries', 'Digital ATZ Boundaries', 'PCR Boundaries']);

  constructor(private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private esri: EsriService,
              private config: ConfigService,
              private store$: Store<FullState>) { }

  public setupApplication(selectedAnalysisLevel: string) : Observable<void> {
    const homeView = this.mapService.mapView.viewpoint;

    return this.initializeLayers(selectedAnalysisLevel).pipe(
      reduce(() => null, null), // reduce is just used here to "wait" until all the layers are done
      finalize(() => {
        // setup the map widgets
        this.mapService.createBasicWidget(Home, { viewpoint: homeView });
        this.mapService.createHiddenWidget(Search, {}, { expandIconClass: 'esri-icon-search', expandTooltip: 'Search', group: 'map-ui'});
        this.mapService.createHiddenWidget(LayerList, {}, { expandIconClass: 'esri-icon-layer-list', expandTooltip: 'Layer List', group: 'map-ui'});
        const source = new PortalBasemapsSource({
          filterFunction: (b: __esri.Basemap) => this.config.portalBaseMapNames.filter(pb => pb.originalName === b.portalItem.title).length > 0,
          updateBasemapsCallback: (allBaseMaps: __esri.Basemap[]) => {
            const baseMapSortOrder = this.config.portalBaseMapNames.map(n => n.originalName);
            allBaseMaps.sort((a, b) => {
              return baseMapSortOrder.indexOf(a.portalItem.title) - baseMapSortOrder.indexOf(b.portalItem.title);
            });
            allBaseMaps.forEach(basemap => {
              const currentConfig = this.config.portalBaseMapNames.filter(n => n.originalName === basemap.portalItem.title)[0];
              if (currentConfig != null && currentConfig.newName !== currentConfig.originalName) {
                const handle = basemap.watch('loaded', (newValue, oldValue, propertyName, target) => {
                  if (newValue) {
                    (target as __esri.Basemap).title = currentConfig.newName;
                    handle.remove();
                  }
                });
              }
            });
            return allBaseMaps;
          }
        });
        this.mapService.createHiddenWidget(BasemapGallery, { source }, { expandIconClass: 'esri-icon-basemap', expandTooltip: 'Basemap Gallery', group: 'map-ui'}, 'bottom-left');
        this.mapService.createBasicWidget(ScaleBar, { unit: 'dual' }, 'bottom-left');

        const popup: __esri.Popup = this.mapService.mapView.popup;
        popup.highlightEnabled = false;
        popup.maxInlineActions = 2;
        this.esri.setPopupVisibility(true);
      })
    );
  }

  public setMapWatches() : void {
    this.store$.pipe(
      select(selectors.getEsriLabelConfiguration),
      map(config => config.pobEnabled),
      distinctUntilChanged(),
    ).subscribe(showPOBs => this.updateLabelExpressions(showPOBs));
  }

  private initializeLayers(selectedAnalysisLevel: string) : Observable<__esri.FeatureLayer> {
    const layerGroups = new Map<string, LayerDefinition[]>();
    let i = 0;
    for (const layerGroup of Object.values(this.config.layers)) {
      layerGroups.set(layerGroup.group.name, [layerGroup.centroids, layerGroup.boundaries]);
      this.setupPortalGroup(layerGroup.group.name, layerGroup.group.analysisLevelName, selectedAnalysisLevel, i++);
    }
    const results: Observable<__esri.FeatureLayer>[] = [];
    layerGroups.forEach((value, key) => {
      const layerObservables = this.setupLayerGroup(key, value.filter(l => l != null));
      results.push(...layerObservables);
    });
    return merge(...results, 2);
  }

  private setupPortalGroup(groupName: string, layerAnalysisLevel: string, selectedAnalysisLevel: string, sortOrder: number) : void {
    const visible = (layerAnalysisLevel === selectedAnalysisLevel || (selectedAnalysisLevel === 'atz' && layerAnalysisLevel === 'zip'));
    this.layerService.createPortalGroup(groupName, visible, sortOrder);
    const group = this.layerService.getPortalGroup(groupName);
    if (group == null) throw new Error(`Invalid Group Name: '${groupName}'`);
  }

  private setupLayerGroup(groupName: string, layerDefinitions: LayerDefinition[]) : Observable<__esri.FeatureLayer>[]{
    const group = this.layerService.getPortalGroup(groupName);
    const layerObservables: Observable<__esri.FeatureLayer>[] = [];
    layerDefinitions.forEach(layerDef => {
      const attributes: __esri.FeatureLayerProperties = {
        popupEnabled: false,
        labelingInfo: []
      };
      const current = this.layerService.createPortalLayer(layerDef.id, layerDef.name, layerDef.minScale, layerDef.defaultVisibility, attributes).pipe(
        tap(newLayer => {
          if (EsriUtils.rendererIsSimple(newLayer.renderer)) {
            const renderer: __esri.SimpleRenderer = newLayer.renderer.clone();
            renderer.symbol.color = new Color([128, 128, 128, 0.01]);
            newLayer.renderer = renderer;
          }
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
    const newExpressions: { [layerId: string] : EsriLabelLayerOptions } = {};
    allLayers.forEach(l => {
      newExpressions[l.id] = {
        expression: this.getLabelExpression(l, showPOBs),
        fontSizeOffset: l.labelFontSizeOffset
      };
    });
    this.esri.setLayerLabelExpressions(newExpressions);
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
