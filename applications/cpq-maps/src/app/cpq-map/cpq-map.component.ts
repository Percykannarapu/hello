import { Component, OnInit } from '@angular/core';
import { merge, Observable } from 'rxjs';
import { EsriApi, EsriLayerService, EsriMapService, LayerDefinition, selectors } from '@val/esri';
import { filter, take, tap } from 'rxjs/operators';
import { ConfigService } from './services/config.service';
import { select, Store } from '@ngrx/store';
import { FullState } from './state';
import { SetGroupId } from './state/shared/shared.actions';

@Component({
  selector: 'cpq-map',
  templateUrl: './cpq-map.component.html',
  styleUrls: ['./cpq-map.component.css']
})
export class CpqMapComponent implements OnInit {

  constructor(private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private config: ConfigService,
              private store$: Store<FullState>) { }

  ngOnInit() {
    this.store$.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => this.setupApplication());
  }

  private setupApplication() {
    const homeView = this.mapService.mapView.viewpoint;
    // Create the layer groups and load the portal items
    this.initializeLayers().subscribe (
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

  public initializeLayers() : Observable<__esri.FeatureLayer> {
    const layerGroups = new Map<string, LayerDefinition[]>();
    for (const layerGroup of Object.values(this.config.layers)) {
      layerGroups.set(layerGroup.group.name, [layerGroup.centroids, layerGroup.boundaries]);
      this.setupPortalGroup(layerGroup.group.name);
    }
    const results: Observable<__esri.FeatureLayer>[] = [];
    layerGroups.forEach((value, key) => {
      const layerObservables = this.setupLayerGroup(key, value.filter(l => l != null));
      results.push(...layerObservables);
    });
    return merge(...results, 2);
  }

  private setupPortalGroup(groupName: string) : void {
    this.layerService.createPortalGroup(groupName, false);
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
}
