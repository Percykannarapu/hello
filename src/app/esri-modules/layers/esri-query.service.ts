import { Injectable } from '@angular/core';
import { EsriLayerService } from './esri-layer.service';
import { Observable } from 'rxjs/Observable';
import { EsriModules } from '../core/esri-modules.service';
import { expand, map, retryWhen, scan } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import * as utils from '../../app.utils';
import { merge } from 'rxjs/observable/merge';
import { EsriUtils } from '../core/esri-utils.service';
import { empty } from 'rxjs/observable/empty';
import { EsriMapService } from '../core/esri-map.service';

export interface Coordinates {
  xcoord: number;
  ycoord: number;
}

type txCallback<T> = (graphic: __esri.Graphic) => T;

const SIMULTANEOUS_STREAMS = 3;

@Injectable()
export class EsriQueryService {

  constructor(private layerService: EsriLayerService, private config: AppConfig,
              private mapService: EsriMapService) { }

  private static createWhereClause(fieldName: string, data: string[]|number[]) : string {
    let whereClause: string;
    if (typeof data[0] === 'number') {
      whereClause = `${fieldName} IN (${data.join(',')})`;
    } else {
      whereClause = `${fieldName} IN ('${data.join(`','`)}')`;
    }
    return whereClause;
  }

  private static createQueryTemplate(returnGeometry: boolean, bufferInMiles: number, outFields: string[]) : __esri.Query {
    const result = new EsriModules.Query({
      returnGeometry: returnGeometry,
      orderByFields: ['geocode']
    });
    if (bufferInMiles > 0) {
      result.distance = bufferInMiles;
      result.units = 'miles';
    }
    if (outFields != null) {
      result.outFields = outFields;
    }
    return result;
  }

  private static getNextQuery(featureSet: __esri.FeatureSet, query: __esri.Query) : __esri.Query {
    if (featureSet.exceededTransferLimit) {
      const result = EsriUtils.clone(query);
      result.num = featureSet.features.length;
      result.start = (query.start || 0) + featureSet.features.length;
      return result;
    } else {
      return null;
    }
  }

  public executeQuery(layerId: string, query: __esri.Query) : Observable<__esri.FeatureSet> {
    return this.paginateEsriQuery(layerId, query);
  }

  private queryWithRetry(layerId: string, query: __esri.Query) : Observable<{ result: __esri.FeatureSet, next: __esri.Query }> {
    return Observable.create(observer => {
      this.mapService.onReady$.subscribe(ready => {
        if (ready) {
          try {
            const layer = this.layerService.getPortalLayerById(layerId);
            layer.queryFeatures(query).then(
              featureSet => {
                observer.next(featureSet);
                observer.complete();
              },
              errReason => observer.error(errReason));
          } catch (ex) {
            observer.error(ex);
          }
        }
      });
    }).pipe(
      map((featureSet: __esri.FeatureSet) => ({
        result: featureSet,
        next: EsriQueryService.getNextQuery(featureSet, query)
      })),
      retryWhen(errors => {
        return errors.pipe(
          scan<any, number>((errorCount, err) => {
            if (err && err.message && err.message.toLowerCase().includes('timeout') && errorCount < 5) {
              console.warn(`Retrying due to timeout. Attempt ${errorCount + 1}.`, err);
              return errorCount + 1;
            } else {
              throw err;
            }
          }, 0)
        );
      })
    );
  }

  private paginateEsriQuery(layerId: string, query: __esri.Query) : Observable<__esri.FeatureSet> {
    return this.queryWithRetry(layerId, query).pipe(
      expand(({result, next}) => {
        if (next) {
          return this.queryWithRetry(layerId, next);
        } else {
          return empty();
        }
      }),
      map(({ result }) => result)
    );
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

  private query<T>(layerId: string, queries: __esri.Query[], transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    const observables: Observable<__esri.FeatureSet>[] = [];
    for (const query of queries) {
      observables.push(this.executeQuery(layerId, query));
    }
    const result$: Observable<__esri.FeatureSet> = merge(...observables, SIMULTANEOUS_STREAMS);
    if (transform == null) {
      return result$.pipe(map(fs => fs.features));
    } else {
      return result$.pipe(map(fs => this.transformFeatureSet(fs, transform)));
    }
  }

  public queryPoint(layerId: string, points: Coordinates | Coordinates[], returnGeometry?: boolean , outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryPoint<T>(layerId: string, points: Coordinates | Coordinates[], returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryPoint<T>(layerId: string, points: Coordinates | Coordinates[], returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    return this.queryPointWithBuffer(layerId, points, 0, returnGeometry, outFields, transform);
  }

  public queryPointWithBuffer(layerId: string, points: Coordinates | Coordinates[], bufferInMiles: number, returnGeometry?: boolean, outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryPointWithBuffer<T>(layerId: string, points: Coordinates | Coordinates[], bufferInMiles: number, returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryPointWithBuffer<T>(layerId: string, points: Coordinates | Coordinates[], bufferInMiles: number, returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    const pointArray = (Array.isArray(points)) ? points : [points];
    const queryTemplate = EsriQueryService.createQueryTemplate(returnGeometry, bufferInMiles, outFields);
    const chunkSize = returnGeometry ? bufferInMiles > 0 ? this.config.maxPointsPerBufferQuery : this.config.maxPointsPerAttributeQuery : pointArray.length;
    const dataStreams: Coordinates[][] = utils.chunkArray(pointArray, chunkSize);
    const queries: __esri.Query[] = [];

    for (const dataStream of dataStreams) {
      const currentQuery = EsriUtils.clone(queryTemplate);
      currentQuery.geometry = this.createMultipoint(dataStream);
      queries.push(currentQuery);
    }
    return this.query<T>(layerId, queries, transform);
  }

  public queryAttributeIn(layerId: string, queryField: string, data: string[] | number[], returnGeometry?: boolean, outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryAttributeIn<T>(layerId: string, queryField: string, data: string[] | number[], returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryAttributeIn<T>(layerId: string, queryField: string, data: string[] | number[], returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    const queryTemplate = EsriQueryService.createQueryTemplate(returnGeometry, 0, outFields);
    const chunkSize = returnGeometry ? this.config.maxPointsPerAttributeQuery : data.length;
    const dataStreams = utils.chunkArray<string, number>(data, chunkSize);
    const queries: __esri.Query[] = [];

    for (const dataStream of dataStreams) {
      const currentQuery = EsriUtils.clone(queryTemplate);
      currentQuery.where = EsriQueryService.createWhereClause(queryField, dataStream);
      queries.push(currentQuery);
    }
    return this.query(layerId, queries, transform);
  }
}
