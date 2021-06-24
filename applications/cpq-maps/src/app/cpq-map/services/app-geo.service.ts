import { Injectable } from '@angular/core';
import { geodesicLength } from '@arcgis/core/geometry/geometryEngine';
import Polyline from '@arcgis/core/geometry/Polyline';
import Query from '@arcgis/core/tasks/support/Query';
import { Store } from '@ngrx/store';
import { groupBy, mapBy } from '@val/common';
import { EsriLayerService, EsriQueryService, EsriUtils, isPoint } from '@val/esri';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RfpUiEditDetail } from '../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { RfpUiEditWrap } from '../../val-modules/mediaexpress/models/RfpUiEditWrap';
import { RfpUiReview } from '../../val-modules/mediaexpress/models/RfpUiReview';
import { AvailabilityDetailResponse } from '../models/availability-detail-response';
import { FullState } from '../state/index';
import { VarDefinition } from '../state/app.interfaces';
import { UpdateRfpUiEditDetails, UpsertRfpUiEditDetails } from '../state/rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { UpdateRfpUiEditWraps, UpsertRfpUiEditWraps } from '../state/rfpUiEditWrap/rfp-ui-edit-wrap.actions';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AppGeoService {

  private newGeoId: number = 500000;

  constructor(private store$: Store<FullState>,
              private configService: ConfigService,
              private esriLayerService: EsriLayerService,
              private queryService: EsriQueryService) { }

  public toggleGeoSelection(geo: RfpUiEditDetail[], wrap: RfpUiEditWrap[]) {
    const geoChanges = geo.map(d => ({ id: d['@ref'], changes: { isSelected: !d.isSelected }}));
    const wrapChanges = wrap.map(w => ({ id: w['@ref'], changes: { isSelected: !w.isSelected }}));
    if (geoChanges.length > 0) {
      this.store$.dispatch(new UpdateRfpUiEditDetails({ rfpUiEditDetails: geoChanges }));
    }
    if (wrapChanges.length > 0) {
      this.store$.dispatch(new UpdateRfpUiEditWraps({ rfpUiEditWraps: wrapChanges }));
    }
  }

  public addNewGeo(geocode: string, wrapName: string, availsInfo: AvailabilityDetailResponse[], arbitraryReviewDetail: RfpUiReview,
                   availableVars: VarDefinition[], isWrap: boolean, analysisLevel: string) {
    const query: __esri.Query = new Query();
    query.outFields = ['geocode'];
    if (isWrap) {
      query.where = `wrap_name = '${wrapName}'`;
      this.queryAndCreateDetails(query, 'zip', arbitraryReviewDetail, availsInfo, availableVars, wrapName).subscribe(results => {
        const newWrapDetails = [];
        groupBy(results, 'fkSite').forEach((details) => {
          newWrapDetails.push(this.createNewRfpUiEditWrap(details));
        });
        if (newWrapDetails.length > 0) {
          this.store$.dispatch(new UpsertRfpUiEditWraps({ rfpUiEditWraps: newWrapDetails }));
        }
        if (results.length > 0) {
          this.store$.dispatch(new UpsertRfpUiEditDetails({ rfpUiEditDetails: results }));
        }
      });
    } else {
      query.where = `geocode = '${geocode}'`;
      this.queryAndCreateDetails(query, analysisLevel, arbitraryReviewDetail, availsInfo, availableVars).subscribe(details => {
        this.store$.dispatch(new UpsertRfpUiEditDetails({ rfpUiEditDetails: details }));
      });
    }
  }

  private queryAndCreateDetails(query: __esri.Query, analysisLevel: string, review: RfpUiReview, availsInfo: AvailabilityDetailResponse[],
                                availableVars: VarDefinition[], wrapName?: string) : Observable<RfpUiEditDetail[]> {
    return this.queryService.executeNativeQuery(this.configService.layers[analysisLevel].centroids.id, query, true).pipe(
      map(pointRes => {
        const editDetailsInput = pointRes.features.map(f => ({
          geocode: f.getAttribute('geocode'),
          point: f.geometry as __esri.Point,
          wrapZone: wrapName,
          zip: f.getAttribute('geocode').substr(0, 5)
        }));
        return this.createNewRfpUiEditDetails(editDetailsInput, review, availableVars, availsInfo);
      })
    );
  }

  private createNewRfpUiEditDetails(editDetailInput: { geocode: string, point: __esri.Point, wrapZone?: string, zip?: string }[],
                                    arbitraryReviewDetail: RfpUiReview, availableVars: VarDefinition[], availsInfo?: AvailabilityDetailResponse[]) : RfpUiEditDetail[] {
    const availsByGeocode = mapBy(availsInfo, 'geocode');
    const newDetails: Array<RfpUiEditDetail> = [];
    editDetailInput.forEach(edi => {
      const newDetail: RfpUiEditDetail = new RfpUiEditDetail();
      const closestSite: __esri.Graphic = this.findClosestSite(edi.point);
      const siteFk = Number(closestSite.getAttribute('siteFk'));
      const currentAvailsData = availsByGeocode.get(edi.geocode);
      const ownerGroup = currentAvailsData
        ? currentAvailsData.ownerGroup.toLowerCase() === 'advo'
          ? 'Valassis'
          : currentAvailsData.ownerGroup
        : '';
      let distance = 0;
      if (isPoint(closestSite.geometry)) {
        const line = new Polyline({
          paths: [[[edi.point.x, edi.point.y], [closestSite.geometry.x, closestSite.geometry.y]]]
        });
        distance = geodesicLength(line, 'miles');
      }
      newDetail.distance = distance;
      newDetail.geocode = edi.geocode;
      newDetail.isSelected = true;
      newDetail.fkSite = siteFk;
      newDetail.siteName = closestSite.getAttribute('siteName');
      newDetail.mediaPlanId = arbitraryReviewDetail.mediaPlanId;
      newDetail.productName = arbitraryReviewDetail.sfdcProductName;
      newDetail.investment = 0;
      newDetail.ownerGroup = ownerGroup;
      newDetail.distribution = currentAvailsData ? Number(currentAvailsData.sharedHhcScheduled) : 0;
      if (edi.wrapZone != null)
        newDetail.wrapZone = edi.wrapZone;
      if (edi.zip != null)
        newDetail.zip = edi.zip;
      for (let i = 0; i < availableVars.length; ++i) {
        const varName = `var${i + 1}Name`;
        const varFlag = `var${i + 1}IsNumber`;
        const varValue = `var${i + 1}Value`;
        newDetail[varName] = availableVars[i].name;
        newDetail[varFlag] = availableVars[i].isNumber;
        newDetail[varValue] = null;
      }
      newDetail['@ref'] = this.newGeoId++;
      newDetails.push(newDetail);
    });
    return newDetails;
  }

  private createNewRfpUiEditWrap(siteDetails: RfpUiEditDetail[]) : RfpUiEditWrap {
    const newWrap = new RfpUiEditWrap();
    newWrap.wrapZone = siteDetails[0].wrapZone;
    newWrap.investment = 0;
    newWrap.siteId = siteDetails[0].fkSite;
    newWrap.siteName = siteDetails[0].siteName;
    newWrap.ownerGroup = siteDetails[0].ownerGroup;
    newWrap['@ref'] = this.newGeoId++;
    newWrap.isSelected = true;
    newWrap.distribution = siteDetails.reduce((p, c) => p + Number(c.distribution), 0);
    return newWrap;
  }

  /*private findClosestSite(point: __esri.Point) : __esri.Graphic {
    const geometry: __esri.Multipoint = new EsriApi.Multipoint();
    const layer: __esri.FeatureLayer = this.esriLayerService.getFeatureLayer('Project Sites');
    if (layer != null) {
      layer.source.forEach(g => {
        const p: __esri.Point = g.geometry as __esri.Point;
        geometry.addPoint([p.x, p.y]);
      });
    }
    const nearestPoint = EsriApi.geometryEngine.nearestCoordinate(geometry, point);
    const sitesGraphic: __esri.Collection<__esri.Graphic> = layer.source.filter(gr => {
      const p: __esri.Point = <__esri.Point> gr.geometry;
      return p.x === nearestPoint.coordinate.x && p.y === nearestPoint.coordinate.y;
    });
    return sitesGraphic.getItemAt(0);
  }*/

  private findClosestSite(point: __esri.Point) : __esri.Graphic {
    const siteGrahics: Array<__esri.Graphic> = [];
    const layer: __esri.FeatureLayer = this.esriLayerService.getFeatureLayer('Project Sites');
    if (layer != null) {
      layer.source.forEach(g => siteGrahics.push(g));
    }
    if (siteGrahics.length === 0)
      console.error('No sites found when calculating nearest site');
    if (siteGrahics.length === 1)
      return siteGrahics[0];
    let closestGraphic: __esri.Graphic = null;
    let closestDistance: number = Number.MAX_SAFE_INTEGER;
    for (const graphic of siteGrahics) {
      if (closestGraphic == null)
        closestGraphic = graphic;
      const distanceToSite = EsriUtils.getDistance(point, <__esri.Point> graphic.geometry);
      if (distanceToSite < closestDistance) {
        closestDistance = distanceToSite;
        closestGraphic = graphic;
      }
    }
    return closestGraphic;
  }
}
