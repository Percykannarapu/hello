import { Injectable, NgZone } from '@angular/core';
import { geodesicArea, geodesicLength } from '@arcgis/core/geometry/geometryEngine';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import Home from '@arcgis/core/widgets/Home';
import Legend from '@arcgis/core/widgets/Legend';
import ScaleBar from '@arcgis/core/widgets/ScaleBar';
import Search from '@arcgis/core/widgets/Search';
import { EsriDomainFactory, EsriLayerService, EsriMapService, EsriUtils } from '@val/esri';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { AppComponentGeneratorService } from './app-component-generator.service';
import { AppLoggingService } from './app-logging.service';
import { AppProjectPrefService } from './app-project-pref.service';

@Injectable({ providedIn: 'root' })
export class AppMapService {

  public popupSelection$ = new Subject<__esri.Graphic[]>();
  public showLayerProgress$: Observable<boolean> = this.layerService.longLayerLoadInProgress$.asObservable();

  constructor(private componentGenerator: AppComponentGeneratorService,
              private appProjectPrefService: AppProjectPrefService,
              private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private logger: AppLoggingService,
              private config: AppConfig,
              private zone: NgZone) {}

  public setupMap(isBatchMapping: boolean = false) : void {
    const homeView = this.mapService.mapView.viewpoint;
    // Create the layer groups and load the portal items

    this.mapService.createBasicWidget(Legend, { hideLayersNotInCurrentView: true }, 'top-right');
    // keep this here to aid in troubleshooting layer-related issues
    // this.mapService.createHiddenWidget(LayerList, {}, { expandIconClass: 'esri-icon-layer-list', expandTooltip: 'Layer List', group: 'map-ui' });
    if (isBatchMapping) {
      // if we're batch mapping, we want no widgets on the UI except for a custom legend
      this.mapService.mapView.ui.remove('zoom');
      return;
    }
    // set up the map widgets
    this.mapService.createBasicWidget(Home, { viewpoint: homeView });
    this.mapService.createHiddenWidget(Search, {}, { expandIconClass: 'esri-icon-search', expandTooltip: 'Search', group: 'map-ui' });
    const source = EsriDomainFactory.createPortalBasemapSource(this.config.portalBaseMapNames);
    this.mapService.createHiddenWidget(BasemapGallery, { source }, { expandIconClass: 'esri-icon-basemap', expandTooltip: 'Basemap Gallery', group: 'map-ui' }, 'bottom-left');
    this.mapService.createBasicWidget(ScaleBar, { unit: 'dual' }, 'bottom-left');

    EsriUtils.setupWatch(this.mapService.map, 'basemap').subscribe(val => this.zone.run(() => {
      this.appProjectPrefService.createPref('esri', 'basemap',  JSON.stringify(val.newValue.toJSON()), 'string');
    }));
    EsriUtils.setupWatch(this.mapService.mapView, 'extent').subscribe(extent => this.zone.run(() => {
      this.appProjectPrefService.createPref('esri', 'extent',  JSON.stringify(extent.newValue.toJSON()), 'string');
    }));

    const popup: __esri.Popup = this.mapService.mapView.popup;
    popup.highlightEnabled = false;
    popup.maxInlineActions = 2;
    popup.defaultPopupTemplateEnabled = false;

    // Event handler that fires each time a popup action is clicked.
    popup.on('trigger-action', (event) => {
      if (event.action.id === 'select-this') {
        this.zone.run(() => {
          this.popupSelection$.next([this.mapService.mapView.popup.selectedFeature]);
        });
      }
    });

    EsriUtils.setupWatch(popup, 'visible').pipe(
      filter(result => result.newValue === false && result.oldValue != null)
    ).subscribe(() => this.componentGenerator.cleanUpGeoPopup());
  }

  public setViewpoint(view: __esri.Viewpoint) : void {
    this.mapService.mapView.viewpoint = view;
  }
}
