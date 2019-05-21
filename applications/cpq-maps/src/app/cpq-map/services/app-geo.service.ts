import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { EsriApi, EsriLayerService, EsriQueryService, EsriUtils } from '@val/esri';
import { mapBy } from '@val/common';
import { RfpUiEditDetail } from '../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { RfpUiEditWrap } from '../../val-modules/mediaexpress/models/RfpUiEditWrap';
import { RfpUiReview } from '../../val-modules/mediaexpress/models/RfpUiReview';
import { AvailabilityDetailResponse } from '../models/availability-detail-response';
import { FullState } from '../state';
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

  public addNewGeo(geocode: string, wrapName: string, availsInfo: AvailabilityDetailResponse[], arbitraryReviewDetail: RfpUiReview, isWrap: boolean, analysisLevel: string) {
    if (isWrap) {
      this.createNewRfpUiEditWrap(wrapName, availsInfo);
      const query: __esri.Query = new EsriApi.Query();
      query.outFields = ['geocode'];
      query.where = `wrap_name = '${wrapName}'`;
      this.queryService.executeQuery(this.configService.layers['zip'].boundaries.id, query, false).subscribe(res => {
        const wrapGeocodes: Array<string> = res.features.map(f => f.getAttribute('geocode'));
        const geoInClause = wrapGeocodes.map(w => `'${w}'`).join(',');
        const pointQuery = new EsriApi.Query();
        pointQuery.outFields = ['geocode'];
        pointQuery.where = `geocode IN (${geoInClause})`;
        this.queryService.executeQuery(this.configService.layers['zip'].centroids.id, pointQuery, true).subscribe(pointRes => {
          const editDetailsInput = pointRes.features.map(f => ({
            geocode: f.getAttribute('geocode'),
            point: f.geometry as __esri.Point,
            wrapZone: wrapName,
            zip: f.getAttribute('geocode')
          }));
          this.createNewRfpUiEditDetails(editDetailsInput, arbitraryReviewDetail, availsInfo);
        });
      });
    } else {
      const query = new EsriApi.Query();
      query.outFields = ['geocode'];
      query.where = `geocode = '${geocode}'`;
      this.queryService.executeQuery(this.configService.layers[analysisLevel].centroids.id, query, true).subscribe(res => {
        this.createNewRfpUiEditDetails([{ geocode: geocode, point: res.features[0].geometry as __esri.Point, zip: geocode.substr(0, 5) }], arbitraryReviewDetail, availsInfo);
      });
    }
  }

  private createNewRfpUiEditDetails(editDetailInput: { geocode: string, point: __esri.Point, wrapZone?: string, zip?: string }[], arbitraryReviewDetail: RfpUiReview, availsInfo?: AvailabilityDetailResponse[]) {
    const availsByGeocode = mapBy(availsInfo, 'geocode');
    const newDetails: Array<RfpUiEditDetail> = [];
    editDetailInput.forEach(edi => {
      const newDetail: RfpUiEditDetail = new RfpUiEditDetail();
      const closestSite: __esri.Graphic = this.findClosestSite(edi.point);
      const siteFk = Number(closestSite.getAttribute('siteFk'));
      const currentAvailsData = availsByGeocode.get(edi.geocode);
      let distance = 0;
      if (EsriUtils.geometryIsPoint(closestSite.geometry)) {
        const line = new EsriApi.PolyLine({
          paths: [[[edi.point.x, edi.point.y], [closestSite.geometry.x, closestSite.geometry.y]]]
        });
        distance = EsriApi.geometryEngine.geodesicLength(line, 'miles');
      }
      newDetail.distance = distance;
      newDetail.geocode = edi.geocode;
      newDetail.isSelected = true;
      newDetail.fkSite = siteFk;
      newDetail.siteName = closestSite.getAttribute('siteName');
      newDetail.mediaPlanId = arbitraryReviewDetail.mediaPlanId;
      newDetail.productName = arbitraryReviewDetail.sfdcProductName;
      newDetail.investment = 0;
      newDetail.ownerGroup = currentAvailsData ? currentAvailsData.ownerGroup : '';
      newDetail.distribution = currentAvailsData ? Number(currentAvailsData.sharedHhcScheduled) : 0;
      if (edi.wrapZone != null)
        newDetail.wrapZone = edi.wrapZone;
      if (edi.zip != null)
        newDetail.zip = edi.zip;
      newDetail['@ref'] = this.newGeoId++;
      newDetails.push(newDetail);
    });

    this.store$.dispatch(new UpsertRfpUiEditDetails({ rfpUiEditDetails: newDetails }));
  }

  private createNewRfpUiEditWrap(wrapZone: string, availsInfo?: AvailabilityDetailResponse[]) {
    const newWrap = new RfpUiEditWrap();
    newWrap.wrapZone = wrapZone;
    newWrap.investment = 0;
    newWrap['@ref'] = this.newGeoId++;
    newWrap.isSelected = true;
    if (availsInfo != null) {
      newWrap.distribution = availsInfo.reduce((p, c) => p + Number(c.sharedHhcScheduled), 0);
    }
    this.store$.dispatch(new UpsertRfpUiEditWraps({ rfpUiEditWraps: [newWrap] }));
  }

  private findClosestSite(point: __esri.Point) : __esri.Graphic {
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
  }
}
