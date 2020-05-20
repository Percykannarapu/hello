import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import Graphic from 'esri/Graphic';
import { EMPTY, from, Observable } from 'rxjs';
import { finalize, map, reduce } from 'rxjs/operators';
import { EsriGraphicTypeCodes } from '../core/esri.enums';
import { AppState } from '../state/esri.reducers';
import { StartSketchView } from '../state/map/esri.map-button.actions';
import { EsriDomainFactoryService } from './esri-domain-factory.service';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapService } from './esri-map.service';
import { EsriQueryService } from './esri-query.service';

@Injectable()
export class EsriMapInteractionService {

  constructor(private mapService: EsriMapService,
              private domainFactory: EsriDomainFactoryService,
              private queryService: EsriQueryService,
              private layerService: EsriLayerService,
              private store$: Store<AppState>) {}

  processClick(event: __esri.MapViewImmediateClickEvent) : Observable<__esri.Graphic[]> {
    return from(this.mapService.mapView.hitTest(event)).pipe(
      map(hitTestResult => hitTestResult.results.map(result => result.graphic))
    );
  }

  startSketchModel(graphicType: EsriGraphicTypeCodes) : Observable<__esri.Geometry> {
    const model = this.domainFactory.createSketchViewModel(this.mapService.mapView);
    const result: Observable<__esri.Geometry> = new Observable(observer => {
      const drawingHandler = model.on('create', event => {
        if (event.state === 'complete') {
          this.stopSketchModel(model, event);
          observer.next(event.graphic.geometry);
          observer.complete();
          drawingHandler.remove();
        }
      });
    });
    model.create(graphicType);
    this.store$.dispatch(new StartSketchView({ model }));
    return result;
  }

  abortSketchModel(model: __esri.SketchViewModel) : void {
    if (model) model.cancel();
    this.mapService.clearGraphics();
  }

  private stopSketchModel(model: __esri.SketchViewModel, event: __esri.SketchViewModelCreateEvent) : void {
    let symbol: __esri.Symbol;
    switch (event.tool) {
      case EsriGraphicTypeCodes.Point:
      case EsriGraphicTypeCodes.Multipoint:
        symbol = model.pointSymbol;
        break;
      case EsriGraphicTypeCodes.Polyline:
        symbol = model.polylineSymbol;
        break;
      case EsriGraphicTypeCodes.Polygon:
      case EsriGraphicTypeCodes.Rectangle:
      case EsriGraphicTypeCodes.Circle:
        symbol = model.polygonSymbol;
        break;
      default:
        throw new Error('Unknown SketchViewModel tool option selected.');
    }
    const sketchGraphic = new Graphic({
      geometry: event.graphic.geometry,
      symbol: symbol
    });
    this.mapService.mapView.graphics.add(sketchGraphic);
  }

  selectFeatures(geometry: __esri.Geometry, portalId: string) : Observable<__esri.Graphic[]> {
    const layer = this.layerService.getPortalLayerById(portalId);
    if (layer == null) return EMPTY;

    return this.queryService.queryLayerView(layer, geometry.extent).pipe(
      reduce((a, c) => [...a, ...c], [] as __esri.Graphic[]),
      finalize(() => this.mapService.mapView.graphics.removeAll())
    );
  }
}
