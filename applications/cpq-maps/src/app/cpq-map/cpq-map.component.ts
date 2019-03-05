import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { mapByExtended, mapToEntity, simpleFlatten } from '@val/common';
import { merge, Observable } from 'rxjs';
import { EsriApi, EsriLayerService, EsriMapService, LayerDefinition, selectors, SetLayerLabelExpressions } from '@val/esri';
import { distinctUntilChanged, filter, finalize, map, take, tap, withLatestFrom } from 'rxjs/operators';
import { ConfigService } from './services/config.service';
import { select, Store } from '@ngrx/store';
import { FullState } from './state';



@Component({
  selector: 'cpq-map',
  templateUrl: './cpq-map.component.html',
  styleUrls: ['./cpq-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CpqMapComponent implements OnInit {

  private layersWithPOBs = new Set(['ZIP Boundaries', 'ATZ Boundaries', 'Digital ATZ Boundaries', 'PCR Boundaries']);
  public panelSize = 'small';

  constructor(private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private config: ConfigService,
              private store$: Store<FullState>) { }

  ngOnInit() {
    this.store$.pipe(
      select(selectors.getMapReady),
      withLatestFrom(this.store$.select(state => state)),
      filter(([ready, state]) => ready),
      take(1)
    ).subscribe(([ready, state]) => this.setupApplication(state));
  }

  private setupApplication(state: FullState) {
    const homeView = this.mapService.mapView.viewpoint;
    // Create the layer groups and load the portal items
    this.initializeLayers(state).subscribe (
      null,
      null,
      () => {
        // setup the map widgets
        this.mapService.createBasicWidget(EsriApi.widgets.Home, { viewpoint: homeView });
        this.mapService.createHiddenWidget(EsriApi.widgets.Search, {}, { expandIconClass: 'esri-icon-search', expandTooltip: 'Search'});
        this.mapService.createHiddenWidget(EsriApi.widgets.LayerList, {}, { expandIconClass: 'esri-icon-layer-list', expandTooltip: 'Layer List'});
        this.mapService.createHiddenWidget(EsriApi.widgets.BaseMapGallery, {}, { expandIconClass: 'esri-icon-basemap', expandTooltip: 'Basemap Gallery'});
        this.mapService.createBasicWidget(EsriApi.widgets.ScaleBar, { unit: 'dual' }, 'bottom-left');

        const popup = this.mapService.mapView.popup;
        popup.highlightEnabled = false;
      });
  }

  public initializeLayers(state: FullState) : Observable<__esri.FeatureLayer> {
    const layerGroups = new Map<string, LayerDefinition[]>();
    for (const layerGroup of Object.values(this.config.layers)) {
      layerGroups.set(layerGroup.group.name, [layerGroup.centroids, layerGroup.boundaries]);
      this.setupPortalGroup(layerGroup.group.name, layerGroup.group.analysisLevelName, state);
    }
    const results: Observable<__esri.FeatureLayer>[] = [];
    layerGroups.forEach((value, key) => {
      const layerObservables = this.setupLayerGroup(key, value.filter(l => l != null));
      results.push(...layerObservables);
    });
    return merge(...results, 2).pipe(
      finalize(() => {
        this.updateLabelExpressions(false);
        // set up sub for future label expression changes
        this.store$.pipe(
          select(selectors.getEsriLabelConfiguration),
          map(config => config.pobEnabled),
          distinctUntilChanged()
        ).subscribe(showPOBs => this.updateLabelExpressions(showPOBs));
      })
    );
  }

  private updateLabelExpressions(showPOBs: boolean) : void {
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

  private setupPortalGroup(groupName: string, analysisLevelName: string, state: FullState) : void {
    let visible = false;
    if (analysisLevelName === state.shared.analysisLevel) {
      visible = true;
    }
    if (state.shared.analysisLevel === 'atz' && analysisLevelName === 'zip') {
      visible = true;
    }
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
          group.add(newLayer);
        })
      );
      layerObservables.push(current);
    });
    return layerObservables;
  }

  public onPanelChange(event: any) {
    this.panelSize = event;
  }
}
