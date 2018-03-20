import { Injectable } from '@angular/core';
import { EsriLayerService } from './esri-layer.service';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { EsriModules } from '../core/esri-modules.service';
import { map, merge, tap } from 'rxjs/operators';
import { AppConfig } from '../../app.config';

export interface LayerId {
  portalLayerId?: string;
  clientLayerName?: string;
}

interface Coordinates {
  xcoord: number;
  ycoord: number;
}

type txCallback<T> = (graphic: __esri.Graphic) => T;

@Injectable()
export class EsriQueryService {

  constructor(private layerService: EsriLayerService, private config: AppConfig) { }

  private static queryError(error: any) {
    console.error('There was an error executing the query: ', error);
  }

  public executeQuery(layer: __esri.FeatureLayer, query: __esri.Query) : Observable<__esri.FeatureSet> {
    const result = new Subject<__esri.FeatureSet>();
    this.paginateQuery(layer, query, result);
    return result.asObservable();
  }

  private paginateQuery(layer: __esri.FeatureLayer, query: __esri.Query, paginationSubject: Subject<__esri.FeatureSet>) : void {
    layer.queryFeatures(query).then(featureSet => {
      paginationSubject.next(featureSet);
      if (featureSet.exceededTransferLimit) {
        query.num = featureSet.features.length;
        query.start = (query.start || 0) + query.num;
        this.paginateQuery(layer, query, paginationSubject);
      } else {
        paginationSubject.complete();
      }
    }, err => EsriQueryService.queryError(err));
  }

  private getLayerByLayerId(layerId: LayerId) : __esri.FeatureLayer {
    let result: __esri.FeatureLayer = null;
    if (layerId.clientLayerName != null) {
      result = this.layerService.getClientLayerByName(layerId.clientLayerName);
    }
    if (layerId.portalLayerId != null) {
      result = this.layerService.getPortalLayerById(layerId.portalLayerId);
    }
    return result;
  }

  private transformFeatureSet<T>(featureSet: __esri.FeatureSet, transform: txCallback<T>) : T[] {
    if (featureSet == null || featureSet.features == null || featureSet.features.length == 0) return [];
    return featureSet.features.map(f => transform(f));
  }

  private createMultipoint(points: Coordinates[]) : __esri.Multipoint {
    const multiPointData: number[][] = points.map(p => [Number(p.xcoord), Number(p.ycoord)]);
    return new EsriModules.Multipoint({
      points: multiPointData,
      spatialReference: { wkid: this.config.val_spatialReference }
    });
  }

  private queryMultipointChunk(layer: __esri.FeatureLayer, queryParams: __esri.Query,
                               data: Coordinates[],
                               index: number, chunkSize: number, subject: Subject<__esri.FeatureSet>) : void {
    const currentPoints = data.slice(index, index + chunkSize);
    queryParams.geometry = this.createMultipoint(currentPoints);
    console.log('chunk data', currentPoints)
    const sub = this.executeQuery(layer, queryParams).subscribe(fs => subject.next(fs), null, () => {
      sub.unsubscribe();
      if ((index + chunkSize) < data.length) {
        console.log(`Preparing next chunk starting at index ${index}`);
        this.queryMultipointChunk(layer, queryParams, data, index + chunkSize, chunkSize, subject);
      } else {
        subject.complete();
      }
    });
  }

  private queryWhereChunk(layer: __esri.FeatureLayer, queryParams: __esri.Query,
                          data: string[]|number[], queryField: string,
                          index: number, chunkSize: number, subject: Subject<__esri.FeatureSet>) : void {
    const currentData = data.slice(index, index + chunkSize);
    let whereClause: string;
    if (typeof data[0] === 'number') {
      whereClause = `${queryField} IN (${currentData.join(',')})`;
    } else {
      whereClause = `${queryField} IN ('${currentData.join(`','`)}')`;
    }
    queryParams.where = whereClause;
    const sub = this.executeQuery(layer, queryParams).subscribe(fs => subject.next(fs), null, () => {
      sub.unsubscribe();
      if ((index + chunkSize) < data.length) {
        this.queryWhereChunk(layer, queryParams, data, queryField, index + chunkSize, chunkSize, subject);
      } else {
        subject.complete();
      }
    });
  }

  public queryPoint(layerId: LayerId, points: Coordinates | Coordinates[], returnGeometry?: boolean , outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryPoint<T>(layerId: LayerId, points: Coordinates | Coordinates[], returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryPoint<T>(layerId: LayerId, points: Coordinates | Coordinates[], returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    return this.queryPointWithBuffer(layerId, points, 0, returnGeometry, outFields, transform);
  }

  public queryPointWithBuffer(layerId: LayerId, points: Coordinates | Coordinates[], bufferInMiles: number, returnGeometry?: boolean, outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryPointWithBuffer<T>(layerId: LayerId, points: Coordinates | Coordinates[], bufferInMiles: number, returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryPointWithBuffer<T>(layerId: LayerId, points: Coordinates | Coordinates[], bufferInMiles: number, returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    const layer = this.getLayerByLayerId(layerId);
    const pointArray = (Array.isArray(points)) ? points : [points];
    let chunkSize: number;
    if (returnGeometry) {
      chunkSize = this.config.maxPointsPerBufferQuery;
    } else {
      chunkSize = pointArray.length;
    }
    const queryParams = new EsriModules.Query({
      returnGeometry: returnGeometry
    });
    if (bufferInMiles > 0) {
      queryParams.distance = bufferInMiles;
      queryParams.units = 'miles';
    }
    if (outFields != null) {
      queryParams.outFields = outFields;
    }

    const chunkedSubject = new Subject<__esri.FeatureSet>();
    this.queryMultipointChunk(layer, queryParams, pointArray, 0, chunkSize, chunkedSubject);
    const result$ = chunkedSubject.asObservable();

    if (transform == null) {
      return result$.pipe(map(fs => fs.features));
    } else {
      return result$.pipe(
        tap(fs => console.log('queryPointWithBuffer feature set result:', fs)),
        map(fs => this.transformFeatureSet(fs, transform))
      );
    }
  }

  public queryAttributeIn(layerId: LayerId, queryField: string, data: string[] | number[], returnGeometry?: boolean, outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryAttributeIn<T>(layerId: LayerId, queryField: string, data: string[] | number[], returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryAttributeIn<T>(layerId: LayerId, queryField: string, data: string[] | number[], returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    const layer = this.getLayerByLayerId(layerId);
    let chunkSize: number;
    if (returnGeometry) {
      chunkSize = this.config.maxPointsPerAttributeQuery;
    } else {
      chunkSize = data.length;
    }
    const queryParams = new EsriModules.Query({
      returnGeometry: returnGeometry
    });
    if (outFields != null) {
      queryParams.outFields = outFields;
    }
    const chunkSubject = new Subject<__esri.FeatureSet>();
    this.queryWhereChunk(layer, queryParams, data, queryField, 0, chunkSize, chunkSubject);
    const result$ = chunkSubject.asObservable();

    if (transform == null) {
      return result$.pipe(
        tap(fs => console.log('queryAttributeIn feature set result:', fs)),
        map(fs => fs.features)
      );
    } else {
      return result$.pipe(
        tap(fs => console.log('queryAttributeIn feature set result:', fs)),
        map(fs => this.transformFeatureSet(fs, transform))
      );
    }
  }
}
