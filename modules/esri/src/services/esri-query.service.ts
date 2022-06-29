import { Inject, Injectable } from '@angular/core';
import Multipoint from '@arcgis/core/geometry/Multipoint';
import Point from '@arcgis/core/geometry/Point';
import Query from '@arcgis/core/rest/support/Query';
import { chunkArray, getUuid, isEmpty, isNil, isNumberArray, isStringArray } from '@val/common';
import { EMPTY, from, merge, Observable } from 'rxjs';
import { expand, filter, finalize, map, reduce, retry, switchMap, take, tap } from 'rxjs/operators';
import { EsriAppSettings, EsriAppSettingsToken } from '../configuration';
import { EsriUtils } from '../core/esri-utils';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapService } from './esri-map.service';
import { LoggingService } from './logging.service';

type pointInputs = __esri.PointProperties | __esri.PointProperties[];
const SIMULTANEOUS_STREAMS = 3;

@Injectable()
export class EsriQueryService {

  private static config: EsriAppSettings;
  private currentExtentLayerId: string;

  constructor(@Inject(EsriAppSettingsToken) config: EsriAppSettings,
              private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private logger: LoggingService) {
    EsriQueryService.config = config;
  }

  private static calculateChunkSize(dataLength: number, returnGeometry: boolean, bufferInMiles: number = 0) : number {
    if (!returnGeometry) return Math.min(dataLength, this.config.maxPointsPerQuery);
    if (bufferInMiles === 0) return this.config.maxPointsPerAttributeQuery;
    return this.config.maxPointsPerBufferQuery;
  }

  private static createQuery(returnGeometry: boolean, outFields: string[], data: __esri.PointProperties[], bufferInMiles: number) : __esri.Query;
  private static createQuery(returnGeometry: boolean, outFields: string[], data: string[] | number[], queryField: string) : __esri.Query;
  private static createQuery(returnGeometry: boolean, outFields: string[], data: string[] | number[] | __esri.PointProperties[], queryField: string | number) : __esri.Query {
    const result = new Query({
      returnGeometry: returnGeometry,
      orderByFields: ['geocode']
    });
    if (typeof queryField === 'number' && queryField > 0) {
      result.distance = queryField;
      result.units = 'miles';
    }
    if (queryField === 'dma_code') {
      result.orderByFields = [];
    }
    if (outFields != null) {
      result.outFields = outFields;
    }
    if (isNumberArray(data)) {
      const condition = data.length === 1 ? `= ${data[0]}` : `IN (${data.join(',')})`;
      result.where = `${queryField} ${condition}`;
    } else if (isStringArray(data)) {
      const condition = data.length === 1 ? `= '${data[0]}'` : `IN ('${data.join(`','`)}')`;
      result.where = `${queryField} ${condition}`;
    } else {
      result.geometry = data.length === 1
        ? new Point(data[0])
        : new Multipoint({
          points: data.map(p => [Number(p.x), Number(p.y)]),
          spatialReference: { wkid: this.config.defaultSpatialRef }
      });
    }
    return result;
  }

  private static getNextQuery(featureSet: __esri.FeatureSet, prevQuery: __esri.Query) : { result: __esri.FeatureSet, next: __esri.Query } {
    const result = {
      result: featureSet,
      next: null
    };
    if (featureSet.exceededTransferLimit) {
      const recordOffset = featureSet.features.length - 1;
      const fetchCount = isNil(prevQuery.num) ? null : prevQuery.num - recordOffset;
      if (fetchCount > 0) {
        const nextQuery = prevQuery.clone();
        nextQuery.num = fetchCount;
        nextQuery.start = (prevQuery.start ?? 0) + recordOffset;
        result.next = nextQuery;
      } else {
        console.warn('Exceeded transfer limit, but fetch count was 0');
      }
    }
    return result;
  }

  public queryLayerView(layer: __esri.FeatureLayer, extent: __esri.Extent, returnGeometry: boolean = false) : Observable<__esri.Graphic[]> {
    return new Observable<__esri.Graphic[]>(observer => {
      this.mapService.mapView.whenLayerView(layer).then((layerView: __esri.FeatureLayerView) => {
        const query = extent == null ? undefined : new Query({
          geometry: extent,
          returnGeometry: returnGeometry,
        });
        if (layerView.updating) {
          setTimeout(() => {
            EsriUtils.setupWatch(layerView, 'updating').pipe(
              filter(u => !u.newValue),
              take(1)
            ).subscribe(() => {
              layerView.queryFeatures(query).then(results => {
                observer.next(results.features);
                observer.complete();
              });
            });
          }, 0);
        } else {
          layerView.queryFeatures(query).then(results => {
            observer.next(results.features);
            observer.complete();
          });
        }
      });
    });
  }

  public queryPoint(layerUrl: string, points: pointInputs, returnGeometry?: boolean , outFields?: string[], alternateTxId?: string) : Observable<__esri.Graphic[]> {
    return this.queryPointWithBuffer(layerUrl, points, 0, returnGeometry, outFields, alternateTxId);
  }

  public queryPointWithBuffer(layerUrl: string, points: pointInputs, bufferInMiles: number, returnGeometry?: boolean, outFields?: string[], alternateTxId?: string) : Observable<__esri.Graphic[]> {
    const pointArray = Array.isArray(points) ? points : [points];
    const chunkSize = EsriQueryService.calculateChunkSize(pointArray.length, returnGeometry, bufferInMiles);
    const dataStreams: __esri.PointProperties[][] = chunkArray(pointArray, chunkSize);
    const queries: __esri.Query[] = dataStreams.map(data => EsriQueryService.createQuery(returnGeometry, outFields, data, bufferInMiles));
    const transactionId = alternateTxId || getUuid();
    return this.query(layerUrl, queries, transactionId).pipe(
      finalize(() => {
        if (alternateTxId == null) this.finalizeQuery(transactionId);
      })
    );
  }

  public queryAttributeIn(layerUrl: string, queryField: string, queryData: string[] | number[], returnGeometry?: boolean, outFields?: string[], alternateTxId?: string) : Observable<__esri.Graphic[]> {
    const chunkSize = EsriQueryService.calculateChunkSize(queryData.length, returnGeometry);
    const dataStreams = chunkArray<string, number>(queryData, chunkSize);
    return this.queryAttributeChunksIn(layerUrl, queryField, dataStreams, returnGeometry, outFields, alternateTxId);
  }

  public queryAttributeChunksIn(layerUrl: string, queryField: string, queryData: (string[] | number[])[], returnGeometry?: boolean, outFields?: string[], alternateTxId?: string) : Observable<__esri.Graphic[]> {
    const queries: __esri.Query[] = queryData.map(data => EsriQueryService.createQuery(returnGeometry, outFields, data, queryField));
    const transactionId = alternateTxId || getUuid();
    return this.query(layerUrl, queries, transactionId).pipe(
      finalize(() => {
        if (alternateTxId == null) this.finalizeQuery(transactionId);
      })
    );
  }

  public queryExtent(layerUrl: string, returnGeometry: boolean, extent?: __esri.Geometry, outFields: string[] = ['geocode', 'latitude', 'longitude', 'hhld_s', 'hhld_w']) : Observable<__esri.Graphic[]> {
    const specialTxId = 'primary-extent-id';
    if (this.currentExtentLayerId !== layerUrl) {
      if (this.currentExtentLayerId != null) this.finalizeQuery(specialTxId);
      this.currentExtentLayerId = layerUrl;
    }
    const query = new Query({
      geometry: extent ?? this.mapService.mapView.extent,
      returnGeometry,
      outFields
    });
    return this.query(layerUrl, [query], specialTxId, true).pipe(
      reduce((acc, result) => acc.concat(result), [] as __esri.Graphic[])
    );
  }

  public executeNativeQuery(layerUrl: string, query: __esri.Query, returnGeometry: boolean = false, outFields?: string[], alternateTxId?: string) : Observable<__esri.FeatureSet> {
    if (returnGeometry) query.returnGeometry = true;
    if (outFields != null) query.outFields = outFields;
    const transactionId = alternateTxId || getUuid();
    return this.paginateEsriQuery(layerUrl, query, transactionId, false).pipe(
      finalize(() => {
        if (alternateTxId == null) this.finalizeQuery(transactionId);
      })
    );
  }

  public executeParallelQuery(layerUrl: string, baseQuery: __esri.Query, pageSize: number = 5000, streams: number = 5) : Observable<__esri.FeatureSet> {
    const txId = getUuid();
    const count$ = from(this.mapService.mapView.when()).pipe(
      map(() => this.layerService.getQueryLayer(layerUrl, txId, true)),
      switchMap(layer => layer == null ? EMPTY : layer.when() as Promise<__esri.FeatureLayer>),
      switchMap(layer => layer.queryFeatureCount({ where: '1 = 1' })),
    );
    return count$.pipe(
      map(count => this.createParallelQueries(baseQuery, pageSize, count)),
      tap((q) => this.logger.debug.log(`Starting ${q.length} parallel queries`)),
      switchMap(queries => merge(...(queries.map(q => this.executeFeatureQuery(layerUrl, q, txId, true))), streams)),
      finalize(() => this.finalizeQuery(txId))
    );
  }

  private createParallelQueries(baseQuery: __esri.Query, pageSize: number, maxLayerCount: number) : __esri.Query[] {
    const streamCount = Math.ceil(maxLayerCount / pageSize);
    const streamMap: number[] = [...Array(streamCount)].map((_, i) => i);
    return streamMap.map(stream => {
      const currentQuery = baseQuery.clone();
      currentQuery.num = pageSize;
      currentQuery.start = stream * pageSize;
      return currentQuery;
    });
  }

  private query(layerUrl: string, queries: __esri.Query[], transactionId: string, isLongLivedQueryLayer: boolean = false) : Observable<__esri.Graphic[]> {
    const observables: Observable<__esri.FeatureSet>[] = [];
    for (const query of queries) {
      observables.push(this.paginateEsriQuery(layerUrl, query, transactionId, isLongLivedQueryLayer));
    }
    const result$: Observable<__esri.FeatureSet> = merge(...observables, SIMULTANEOUS_STREAMS);
    return result$.pipe(map(fs => fs.features));
  }

  private paginateEsriQuery(layerUrl: string, query: __esri.Query, transactionId: string, isLongLivedQueryLayer: boolean) : Observable<__esri.FeatureSet> {
    const usableQuery = query.clone();
    usableQuery.returnExceededLimitFeatures = false;
    if (isEmpty(usableQuery.orderByFields)) usableQuery.orderByFields = [ usableQuery.outFields[0] ?? 'geocode' ];
    const recursiveQuery$ = (url: string, q: __esri.Query) =>
      this.executeFeatureQuery(url, q, transactionId, isLongLivedQueryLayer).pipe(map(r => EsriQueryService.getNextQuery(r, q)));

    return recursiveQuery$(layerUrl, usableQuery).pipe(
      expand(({result, next}) => next ? recursiveQuery$(layerUrl, next) : EMPTY),
      map(({ result }) => result),
      tap(result => this.logger.debug.log(`Feature Query Complete with ${result.features.length} features returned.`))
    );
  }

  private executeFeatureQuery(layerUrl: string, query: __esri.Query, transactionId: string, isLongLivedQueryLayer: boolean) : Observable<__esri.FeatureSet> {
    return from(this.mapService.mapView.when()).pipe(
      map(() => this.layerService.getQueryLayer(layerUrl, transactionId, isLongLivedQueryLayer)),
      switchMap(layer => layer == null ? EMPTY : layer.when() as Promise<__esri.FeatureLayer>),
      switchMap(layer => from(layer.queryFeatures(query)).pipe(retry(3))),
    );
  }

  public finalizeQuery(transactionId: string) : void {
    this.layerService.removeQueryLayer(transactionId);
  }
}
