import { Inject, Injectable } from '@angular/core';
import { EsriLayerService } from './esri-layer.service';
import { Observable, merge, EMPTY } from 'rxjs';
import { EsriModules } from '../core/esri-modules.service';
import { expand, filter, map, retryWhen, scan, take } from 'rxjs/operators';
import * as utils from '../../app.utils';
import { EsriUtils } from '../core/esri-utils.service';
import { EsriMapService } from '../core/esri-map.service';
import { EsriConfigOptions, EsriLoaderConfig, EsriLoaderToken } from '../configuration';

type txCallback<T> = (graphic: __esri.Graphic) => T;
type compositeData = string[] | number[] | __esri.PointProperties[];
type pointInputs = __esri.PointProperties | __esri.PointProperties[];
const SIMULTANEOUS_STREAMS = 3;

@Injectable()
export class EsriQueryService {

  private static config: EsriConfigOptions;

  constructor(@Inject(EsriLoaderToken) config: EsriLoaderConfig,
              private layerService: EsriLayerService,
              private mapService: EsriMapService) {
    EsriQueryService.config = config.esriConfig;
  }

  private static dataIsString(d: compositeData) : d is string[] {
    return d != null && typeof d[0] === 'string';
  }

  private static dataIsNumber(d: compositeData) : d is number[] {
    return d != null && typeof d[0] === 'number';
  }

  private static calculateChunkSize(dataLength: number, returnGeometry: boolean, bufferInMiles: number = 0) : number {
    if (!returnGeometry) return dataLength;
    if (bufferInMiles === 0) return this.config.maxPointsPerAttributeQuery;
    return this.config.maxPointsPerBufferQuery;
  }

  private static createQuery(returnGeometry: boolean, outFields: string[], data: __esri.PointProperties[], bufferInMiles: number) : __esri.Query;
  private static createQuery(returnGeometry: boolean, outFields: string[], data: string[] | number[], queryField: string) : __esri.Query;
  private static createQuery(returnGeometry: boolean, outFields: string[], data: string[] | number[] | __esri.PointProperties[], queryField: string | number) : __esri.Query {
    const result = new EsriModules.Query({
      returnGeometry: returnGeometry,
      orderByFields: ['geocode']
    });
    if (typeof queryField === 'number' && queryField > 0) {
      result.distance = queryField;
      result.units = 'miles';
    }
    if (outFields != null) {
      result.outFields = outFields;
    }
    if (this.dataIsNumber(data)) {
      result.where = `${queryField} IN (${data.join(',')})`;
    } else if (this.dataIsString(data)) {
      result.where = `${queryField} IN ('${data.join(`','`)}')`;
    } else if (data.length === 1) {
      result.geometry = new EsriModules.Point(data[0]);
    } else {
      const multiPointData: number[][] = data.map(p => [Number(p.x), Number(p.y)]);
      result.geometry = new EsriModules.Multipoint({
        points: multiPointData,
        spatialReference: { wkid: this.config.defaultSpatialRef }
      });
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

  private static transformFeatureSet<T>(featureSet: __esri.FeatureSet, transform: txCallback<T>) : T[] {
    if (featureSet == null || featureSet.features == null || featureSet.features.length == 0) return [];
    return featureSet.features.map(f => transform(f));
  }

  public executeQuery(layerId: string, query: __esri.Query) : Observable<__esri.FeatureSet> {
    return this.paginateEsriQuery(layerId, query);
  }

  public executeObjectIdQuery(layerId: string, query: __esri.Query) : Observable<number[]> {
    return Observable.create(observer => {
      this.mapService.onReady$.pipe(
        filter(ready => ready),
        take(1)
      ).subscribe(() => {
        try {
          const layer = this.layerService.getPortalLayerById(layerId);
          layer.queryObjectIds(query).then(
            ids => {
              observer.next(ids);
              observer.complete();
            },
            err => observer.error(err)
          );
        } catch (ex) {
          observer.error(ex);
        }
      });
    });
  }

  private queryWithRetry(layerId: string, query: __esri.Query) : Observable<{ result: __esri.FeatureSet, next: __esri.Query }> {
    return Observable.create(observer => {
      const sub = this.mapService.onReady$.subscribe(ready => {
        if (ready) {
          try {
            this.mapService.mapView.when(() => {
              const layer = this.layerService.getPortalLayerById(layerId);
              layer.when(() => {
                layer.queryFeatures(query).then(
                  featureSet => {
                    observer.next(featureSet);
                    observer.complete();
                  },
                  errReason => observer.error(errReason));
              }, err => {
                observer.error(err);
              });
            }, err => {
              observer.error(err);
            });
          } catch (ex) {
            observer.error(ex);
          }
        }
      });
      return () => sub.unsubscribe();
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
          return EMPTY;
        }
      }),
      map(({ result }) => result)
    );
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
      return result$.pipe(map(fs => EsriQueryService.transformFeatureSet(fs, transform)));
    }
  }

  public queryPoint(layerId: string, points: pointInputs, returnGeometry?: boolean , outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryPoint<T>(layerId: string, points: pointInputs, returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryPoint<T>(layerId: string, points: pointInputs, returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    return this.queryPointWithBuffer(layerId, points, 0, returnGeometry, outFields, transform);
  }

  public queryPointWithBuffer(layerId: string, points: pointInputs, bufferInMiles: number, returnGeometry?: boolean, outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryPointWithBuffer<T>(layerId: string, points: pointInputs, bufferInMiles: number, returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryPointWithBuffer<T>(layerId: string, points: pointInputs, bufferInMiles: number, returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    const pointArray = Array.isArray(points) ? points : [points];
    const chunkSize = EsriQueryService.calculateChunkSize(pointArray.length, returnGeometry, bufferInMiles);
    const dataStreams: __esri.PointProperties[][] = utils.chunkArray(pointArray, chunkSize);
    const queries: __esri.Query[] = dataStreams.map(data => EsriQueryService.createQuery(returnGeometry, outFields, data, bufferInMiles));
    return this.query(layerId, queries, transform);
  }

  public queryAttributeIn(layerId: string, queryField: string, queryData: string[] | number[], returnGeometry?: boolean, outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryAttributeIn<T>(layerId: string, queryField: string, queryData: string[] | number[], returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryAttributeIn<T>(layerId: string, queryField: string, queryData: string[] | number[], returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    const chunkSize = EsriQueryService.calculateChunkSize(queryData.length, returnGeometry);
    const dataStreams = utils.chunkArray<string, number>(queryData, chunkSize);
    const queries: __esri.Query[] = dataStreams.map(data => EsriQueryService.createQuery(returnGeometry, outFields, data, queryField));
    return this.query(layerId, queries, transform);
  }

  public queryLayerView(layerId: string, returnGeometry: boolean = false, extent: __esri.Extent) : Observable<__esri.Graphic[]> {
    return Observable.create(observer => {
      const layer = this.layerService.getPortalLayerById(layerId);
      this.mapService.mapView.whenLayerView(layer).then((layerView: __esri.FeatureLayerView) => {
        const query = new EsriModules.Query({
          geometry: extent,
          returnGeometry: returnGeometry
        });
        const queryCall = () => {
          layerView.queryFeatures(query).then(results => {
            observer.next(results.features);
            observer.complete();
          });
        };

        if (layerView.updating) {
          layerView.watch('updating', updating => {
            if (!updating) {
              queryCall();
            }
          });
        } else {
          queryCall();
        }
      });
    });
  }
}
