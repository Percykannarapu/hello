import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EsriIdentityService } from '../../services/esri-identity.service';
import { EsriModules } from '../core/esri-modules.service';
import { AppConfig } from '../../app.config';

export const homeGeoTempKey = '_homeGeos';

export interface HomeGeoPoint {
  xcoord: number;
  ycoord: number;
}

@Injectable()
export class EsriRestQueryService {

  constructor(private config: AppConfig,
               private identityService: EsriIdentityService,
               private http: HttpClient) {
  }

  /**
   * Build a query params object that is usable in the home geocode query
   * @param locations The array of locations to determine home geocodes for
   * @returns A HttpParams object that can be used in the home geocode query with ArcGIS
   */
  private createHomeGeocodeParams(locations: HomeGeoPoint[]) : HttpParams {
    const queryParams: HttpParams = new HttpParams()
      .set('objectIds', '')
      .set('time', '')
      .set('geometry', JSON.stringify(this.createHomeGeocodeGeometry(locations)))
      .set('geometryType', 'esriGeometryMultipoint')
      .set('inSR', '4326')
      .set('spatialRel', 'esriSpatialRelIntersects')
      .set('distance', '')
      .set('units', 'esriSRUnit_Foot')
      .set('relationParam', '')
      .set('outFields', 'geocode')
      .set('returnGeometry', 'true')
      .set('maxAllowableOffset', '')
      .set('geometryPrecision', '')
      .set('outSR', '')
      .set('gdbVersion', '')
      .set('historicMoment', '')
      .set('returnDistinctValues', 'false')
      .set('returnIdsOnly', 'false')
      .set('returnCountOnly', 'false')
      .set('returnExtentOnly', 'false')
      .set('orderByFields', '')
      .set('groupByFieldsForStatistics', '')
      .set('outStatistics', '')
      .set('returnZ', 'false')
      .set('returnM', 'false')
      .set('multipatchOption', 'xyFootprint')
      .set('resultOffset', '')
      .set('resultRecordCount', '')
      .set('returnTrueCurves', 'false')
      .set('sqlFormat', 'none')
      .set('resultType', '')
      .set('f', 'pjson')
      .set('token', this.identityService.token);
    return queryParams;
  }

  /**
   * Build a geometry object that is usable in the home geocode query
   * @param locations The array of locations to determine home geocodes for
   * @returns an object that is in the correct input format for a multipoint ArcGIS query
   */
  private createHomeGeocodeGeometry(locations: HomeGeoPoint[]) : any {
    const points: number[][] = [];
    let count = 0;
    for (const location of locations) {
      points[count] = new Array<number>();
      points[count].push(Number(location.xcoord));
      points[count].push(Number(location.ycoord));
      count++;
    }
    return {'points': points, 'spatialReference': { 'wkid': 4326 }};
  }

  /**
   * Determine the home geocodes for each location in the ImpGeofootprintLocation array that is passed in
   * @param locations The array containing the locations to determine home geocodes for
   * @param queryUrl
   * @param attributeName
   * @returns An observable that will asynchronously return an array of ImpGeofootprintLocation[] with the home geocodes populated
   */
  public homeGeocodeQuery(locations: HomeGeoPoint[], queryUrl: string, attributeName: string) : Promise<HomeGeoPoint[]> {
    console.log('querying with the following data', locations);
    return this.http.post<__esri.FeatureSet>(this.config.esriRestApiBase + queryUrl, this.createHomeGeocodeParams(locations), { withCredentials: true})
      .toPromise()
      .catch(e => {
        this.handleError(e);
        return null;
      })
      .then(result => {
        return this.parseHomeGeocodeResult(result, locations, attributeName);
      });
  }

  /**
   * A stub method to handle errors
   */
  private handleError(error: Error) {
    console.error(error);
  }

  /**
   * Parse the response from the home geocode query
   * Use the geometry engine to find the home geocodes
   * @param queryResult The result of the home geocode query
   * @param locations The array containing the locations that will have the home geocodes updated
   * @param attributeName
   * @returns an array of ImpGeofootprintLocation[] with the home geocode populated
   */
  private parseHomeGeocodeResult(queryResult: __esri.FeatureSet, locations: HomeGeoPoint[], attributeName: string) : HomeGeoPoint[] {
    let count: number = 0;
    for (const location of locations) {
      const point: __esri.Point = new EsriModules.Point();
      point.x = location.xcoord;
      point.y = location.ycoord;
      for (const feature of queryResult.features) {
        const polygon: __esri.Polygon = EsriModules.Polygon.fromJSON(feature.geometry);
        try {
          if (polygon.contains(point)) {
            if (locations[count][homeGeoTempKey] == null) locations[count][homeGeoTempKey] = {};
            locations[count][homeGeoTempKey][attributeName] = feature.attributes.geocode;
            break;
          }
        } catch (error) {
          this.handleError(error);
        }
      }
      count++;
    }
    return locations;
  }
}
