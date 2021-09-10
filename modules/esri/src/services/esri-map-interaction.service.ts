import { Injectable } from '@angular/core';
import Graphic from '@arcgis/core/Graphic';
import { Store } from '@ngrx/store';
import { isNil } from '@val/common';
import { from, Observable } from 'rxjs';
import { map, reduce } from 'rxjs/operators';
import { EsriDomainFactory } from '../core/esri-domain.factory';
import { EsriGraphicTypeCodes } from '../core/esri.enums';
import { AppState } from '../state/esri.reducers';
import { StartSketchView } from '../state/map/esri.map-button.actions';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapService } from './esri-map.service';
import { EsriQueryService } from './esri-query.service';

@Injectable()
export class EsriMapInteractionService {

  constructor(private mapService: EsriMapService,
              private queryService: EsriQueryService,
              private layerService: EsriLayerService,
              private store$: Store<AppState>) {}

  startSketchModel(graphicType: EsriGraphicTypeCodes) : Observable<__esri.Geometry> {
    const model = EsriDomainFactory.createSketchViewModel(this.mapService.mapView);
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

  processClick(event: __esri.MapViewImmediateClickEvent, portalId: string) : Observable<__esri.Graphic[]> {
    const analysisLayer = this.layerService.getPortalLayerById(portalId);
    const options = isNil(analysisLayer) ? undefined : { include: analysisLayer };
    return from(this.mapService.mapView.hitTest(event, options)).pipe(
      map(hitTestResult => hitTestResult.results.map(result => result.graphic))
    );
  }

  selectFeatures(geometry: __esri.Geometry, portalId: string) : Observable<__esri.Graphic[]> {
    return this.queryService.queryExtent(portalId, true, geometry).pipe(
      reduce((a, c) => a.concat(c), [] as __esri.Graphic[]),
    );
  }
}
