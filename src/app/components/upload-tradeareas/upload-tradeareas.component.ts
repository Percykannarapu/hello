import { Component, ViewChild } from '@angular/core';
import { FileService, ParseResponse, ParseRule } from '../../val-modules/common/services/file.service';
import { FileUpload } from 'primeng/primeng';
import * as XLSX from 'xlsx';
import { MessageService } from 'primeng/components/common/messageservice';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { AppConfig } from '../../app.config';
import { EsriQueryService } from '../../esri-modules/layers/esri-query.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { EsriUtils } from '../../esri-modules/core/esri-utils.service';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { AppStateService } from '../../services/app-state.service';
import { filter, map, take } from 'rxjs/operators';
import { ImpDomainFactoryService, TradeAreaTypes } from '../../val-modules/targeting/services/imp-domain-factory.service';
import { Observable } from 'rxjs';

interface TradeAreaDefinition {
  store: string;
  geocode: string;
  message: string;
}

const tradeAreaUpload: ParseRule[] = [
  { headerIdentifier: ['STORE', 'SITE', 'LOC', 'Site #', 'NUMBER'], outputFieldName: 'store', required: true },
  { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true },
];

@Component({
  selector: 'val-upload-tradeareas',
  templateUrl: './upload-tradeareas.component.html',
  styleUrls: ['./upload-tradeareas.component.css']
})
export class UploadTradeAreasComponent {
  public listType1: string = 'Site';
  public impGeofootprintLocations: ImpGeofootprintLocation[];
  public uploadFailures: TradeAreaDefinition[] = [];
  public totalUploadedRowCount = 0;

  public currentAnalysisLevel$: Observable<string>;

  @ViewChild('tradeAreaUpload') private fileUploadEl: FileUpload;

  constructor(private messageService: MessageService,
    private appConfig: AppConfig,
    private stateService: AppStateService,
    private esriQueryService: EsriQueryService,
    private tradeAreaService: AppTradeAreaService,
    private impGeofootprintLocationService: ImpGeofootprintLocationService,
    private impGeoService: ImpGeofootprintGeoService,
    private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
    private usageService: UsageService,
    private domainFactory: ImpDomainFactoryService) {
    this.currentAnalysisLevel$ = this.stateService.analysisLevel$;
  }

  public onResubmit(data: TradeAreaDefinition) {
    this.onRemove(data);
    data.message = null;
    this.processUploadedTradeArea([data]);
  }

  public onRemove(data: TradeAreaDefinition) {
    this.totalUploadedRowCount -= 1;
    this.uploadFailures = this.uploadFailures.filter(f => f !== data);
  }

  //upload trade areas with site numbers and geos: US6879 tradeAreaUpload
  public onUploadClick(event: any) : void {
    const reader = new FileReader();
    const name: String = event.files[0].name;
    console.log('file Name:::', name);
    if (name.includes('.xlsx') || name.includes('.xls')) {
      reader.readAsBinaryString(event.files[0]);
      reader.onload = () => {
        this.parseExcelFile(reader.result);
      };
    } else {
      reader.readAsText(event.files[0]);
      reader.onload = () => {
        this.parseCsvFile(reader.result);
      };
    }

    this.stateService.uniqueIdentifiedGeocodes$.pipe(
      filter(geos => geos != null && geos.length > 0),
      take(1)
    ).subscribe (null, null, () => this.tradeAreaService.zoomToTradeArea());

    this.fileUploadEl.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.fileUploadEl.basicFileInput.nativeElement.value = '';
  }

  // to process excel upload data
  private parseExcelFile(bstr: string) : void {
    console.log('process excel data::');
    try {
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const worksheetName: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[worksheetName];
      const csvData = XLSX.utils.sheet_to_csv(ws);
      this.parseCsvFile(csvData);
    } catch (e) {
      console.error('Error converting Excel sheet to CSV', e);
    }
  }

  private parseCsvFile(dataBuffer: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    try {
      const headerValidation = (found: ParseRule[]) => found.length === 2;
      const data: ParseResponse<TradeAreaDefinition> = FileService.parseDelimitedData(header, rows, tradeAreaUpload, headerValidation);
      if (data != null) {
        const failedCount = data.failedRows ? data.failedRows.length : 0;
        const successCount = data.parsedData ? data.parsedData.length : 0;
        this.totalUploadedRowCount = failedCount;
        if (failedCount > 0) {
          this.messageService.add({summary: 'Upload Error', detail: `There were ${failedCount} rows that could not be parsed. See the F12 console for more details.`});
          console.error('Failed Trade Area Upload Rows:', data.failedRows);
        }
        if (successCount > 0) {
          this.processUploadedTradeArea(data.parsedData);
        }
      } else {
        this.messageService.add({summary: 'Upload Error', detail: `The file must contain two columns: Site Number and Geocode.` });
      }
    } catch (e) {
      console.log('There was an error parsing the uploaded data', e);
    }
  }

  private processUploadedTradeArea(data: TradeAreaDefinition[]) : void {
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(currentAnalysisLevel);
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'custom-data-file', action: 'upload' });
    const cleanTradeAreas = new Set<TradeAreaDefinition>();
    const locationNumberMap: Map<string, ImpGeofootprintLocation>  = new Map<string, ImpGeofootprintLocation>();
    this.totalUploadedRowCount += data.length;

    this.impGeofootprintLocationService.get().forEach(loc => {
      locationNumberMap.set(loc.locationNumber.toString(), loc);
    });

    // make sure we can find an associated location for each uploaded data row
    data.forEach(taDef => {
      if (locationNumberMap.has(taDef.store)){
        cleanTradeAreas.add(taDef);
      } else {
        taDef.message = 'Site number not found';
        this.uploadFailures = [...this.uploadFailures, taDef];
      }
    });
    this.usageService.createCounterMetric(usageMetricName, `success~=${cleanTradeAreas.size}~error=${this.uploadFailures.length}`, data.length - 1);

    const outfields = ['geocode', 'latitude', 'longitude'];
    const queryResult = new Map<string, {latitude: number, longitude: number}>();
    const geosToQuery = new Set(Array.from(cleanTradeAreas).map(ta => ta.geocode));

    const sub1 = this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', Array.from(geosToQuery), false, outfields).pipe(
      map(graphics => graphics.map(g => g.attributes)),
      map(attrs => attrs.map(a => ({ geocode: a.geocode, latitude: Number(a.latitude), longitude: Number(a.longitude) })))
    ).subscribe(
      results => results.forEach(r => queryResult.set(r.geocode, { latitude: r.latitude, longitude: r.longitude })),
      err => console.log('There was an error querying the ArcGIS layer', err),
      () => {
        const geosToAdd: ImpGeofootprintGeo[] = [];
        const tradeAreasToAdd: ImpGeofootprintTradeArea[] = [];
        cleanTradeAreas.forEach(ta => {
          // make sure the query returned a geocode+lat+lon for each of the uploaded data rows
          if (!queryResult.has(ta.geocode)) {
            ta.message = 'Geocode not found';
            this.uploadFailures = [...this.uploadFailures, ta];
          } else {
            const loc = locationNumberMap.get(ta.store);
            const layerData = queryResult.get(ta.geocode);
            // make sure the lat/lon data from the layer is valid
            if (Number.isNaN(layerData.latitude) || Number.isNaN(layerData.longitude)) {
              console.error(`Invalid Layer Data found for geocode ${ta.geocode}`, layerData);
            } else {
              // finally build the tradeArea (if necessary) and geo
              const distance = EsriUtils.getDistance(layerData.longitude, layerData.latitude, loc.xcoord, loc.ycoord);
              let currentTradeArea = loc.impGeofootprintTradeAreas.filter(current => current.taType === TradeAreaTypes.Custom)[0];
              if (currentTradeArea == null) {
                currentTradeArea = this.domainFactory.createTradeArea(loc, 4, TradeAreaTypes.Custom, true);
                tradeAreasToAdd.push(currentTradeArea);
              }
              const newGeo = this.createGeo(currentTradeArea, ta.geocode, layerData.longitude, layerData.latitude, distance);
              geosToAdd.push(newGeo);
            }
          }
        });
        // stuff all the results into appropriate data stores
        this.impGeoService.add(geosToAdd);
        this.impGeofootprintTradeAreaService.add(tradeAreasToAdd);
        if (sub1) sub1.unsubscribe();
      });
  }

  private createGeo(ta: ImpGeofootprintTradeArea, geocode: string, x: number, y: number, distance: number) : ImpGeofootprintGeo {
    const result: ImpGeofootprintGeo = new ImpGeofootprintGeo();
    result.geocode = geocode;
    result.isActive = ta.isActive;
    result.impGeofootprintLocation = ta.impGeofootprintLocation;
    result.impGeofootprintTradeArea = ta;
    result.distance = distance;
    result.xcoord = x;
    result.ycoord = y;
    ta.impGeofootprintGeos.push(result);
    return result;
  }
}

// results => {
//   graphics.forEach(graphic => {
//     if (geoLocMap.has(graphic.attributes['geocode'])){
//       const geocode = graphic.attributes['geocode'];
//       const loc: ImpGeofootprintLocation = geoLocMap.get(geocode);
//       geocodeResultSet.add(geocode);
//       const latitude: number = graphic.attributes['latitude'];
//       const longitude: number = graphic.attributes['longitude'];
//       const geocodeDistance: number = EsriUtils.getDistance(longitude, latitude, loc.xcoord, loc.ycoord);
//       const point = new EsriModules.Point({latitude: latitude, longitude: longitude});
//       const geoData = data.parsedData.filter(g => g.Geo === geocode);
//       if (geoData.length > 0) {
//
//         const tas = tradeAreasForInsert.filter(ta => ta.impGeofootprintLocation === loc);
//         if (tas.length <= 0) {
//           const newTA = this.domainFactory.createTradeArea(loc, 4, TradeAreaTypes.Custom, true);
//           tradeAreasForInsert.push(newTA);
//           tas.push(newTA);
//         }
//
//         geoData.forEach(geo => {
//           tas.forEach(ta => {
//             const newGeo = this.createGeo(geocodeDistance, point, loc, ta, graphic.attributes['geocode']);
//             ta.impGeofootprintGeos.push(newGeo);
//             geosToAdd.push(newGeo);
//           });
//         });
//       }
//     }
//   });
// },
