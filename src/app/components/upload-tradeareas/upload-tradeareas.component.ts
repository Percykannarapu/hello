import { Component, ViewChild } from '@angular/core';
import { siteListUploadRules } from './upload.rules';
import { FileService, ParseResponse, ParseRule } from '../../val-modules/common/services/file.service';
import { FileUpload } from 'primeng/primeng';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
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
import { EsriModules } from '../../esri-modules/core/esri-modules.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { AppStateService } from '../../services/app-state.service';
import { Observable } from 'rxjs/Observable';


class GeoLocations {

  constructor(private geocode: string, private location:  ImpGeofootprintLocation, private message?: string){}
  geocode1: string = this.geocode;
  loc: ImpGeofootprintLocation = this.location;
  msg: string = this.message;
}

@Component({
  selector: 'val-upload-tradeareas',
  templateUrl: './upload-tradeareas.component.html',
  styleUrls: ['./upload-tradeareas.component.css']
})
export class UploadTradeAreasComponent {
  public listType1: string = 'Site';
  private tradeAreasForInsert: ImpGeofootprintTradeArea[] = [];
  public impGeofootprintLocations: ImpGeofootprintLocation[];
  private csvParseRules: ParseRule[] = siteListUploadRules;
  public failedGeoLocList: GeoLocations[] = [];
  public  geoLocList: GeoLocations[] = [];
  public analysisLevel$: Observable<string>;
  //private csvHeaderValidator: (foundHeaders: ParseRule[]) => boolean = siteUploadHeaderValidator;

  @ViewChild('tradeAreaUpload') private fileUploadEl1: FileUpload;

  constructor(private messageService: MessageService,
    private appConfig: AppConfig,
    private stateService: AppStateService,
    private esriQueryService: EsriQueryService,
    private tradeAreaService: AppTradeAreaService,
    private impGeofootprintLocationService: ImpGeofootprintLocationService,
    private impGeoService: ImpGeofootprintGeoService,
    private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
    private usageService: UsageService) {
    this.analysisLevel$ = this.stateService.analysisLevel$;
  }

  //upload tradearea rings with site numbers and geos: US6879 tradeAreaUpload
  public onUploadClick(event: any) : void {
    console.log('Inside Upload TradeAreas:::');
    const reader = new FileReader();
    const name: String = event.files[0].name;
    console.log('file Name:::', name);
    if (name.includes('.xlsx') || name.includes('.xls')) {
      console.log('Includes Excel:::');
      reader.readAsText(event.files[0]);
      reader.onload = () => {
        this.parseExcelFile(event);
      };

    }
    else {
      reader.readAsText(event.files[0]);
      reader.onload = () => {
        this.onFileUpload(reader.result);
      };
    }
  }
  public parseExcelFile(event: any) : void {
    console.log('process excel data::');

    const target: DataTransfer = <DataTransfer>(event);
    const reader: FileReader = new FileReader();
    reader.readAsBinaryString(target.files[0]);
    reader.onload = () => {
      const bstr: string = reader.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const csvData = XLSX.utils.sheet_to_csv(ws);
      //console.log('csv data:::data1', csvData);
      this.onFileUpload(csvData);
      this.fileUploadEl1.clear();
      // workaround for https://github.com/primefaces/primeng/issues/4816
     // this.fileUploadEl1.basicFileInput.nativeElement.value = '';

    };
  }

  private onFileUpload(dataBuffer: string) {
    const rows: string[] = dataBuffer.split(/\r\n|\n/);
    const header: string = rows.shift();
    try {
      let customIndex: number = 0;
      const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
      const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(currentAnalysisLevel, false);

      //const filteredLocations: ImpGeofootprintLocation[] = [];
      //const successGeoLocMap:  Map<string, ImpGeofootprintLocation>  = new Map<string, ImpGeofootprintLocation>();

      // Create a Map to associate a geocode with an ImpGeofootprintLocation
      const geoLocMap: Map<string, ImpGeofootprintLocation>  = new Map<string, ImpGeofootprintLocation>();

      // Create a counter metric
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'custom-data-file', action: 'upload' });
       this.usageService.createCounterMetric(usageMetricName, null, rows.length - 1);

      // Parse the data into headers and rows
      const data: ParseResponse<ValGeocodingRequest> = FileService.parseDelimitedData(header, rows, this.csvParseRules);
      const headerCheck: string[] = header.split(/,/);

      // Continue if there are two header columns
      if (headerCheck.length == 2) {
        // Create a map of ImpGeofootprintLocations keyed by locationNumber
        const geocodes = [] ;
        const impGeofootprintLocationMap: Map<string, ImpGeofootprintLocation>  = new Map<string, ImpGeofootprintLocation>();
        this.impGeofootprintLocationService.get().forEach(loc => {
          impGeofootprintLocationMap.set(loc.locationNumber.toString(), loc);
        });

        // For every geocode in the data
        data.parsedData.forEach(valGeo => {
          // that has an associated ImpGeofootprintLocation
          if (impGeofootprintLocationMap.has(valGeo.STORE)){
            // Push the geocode into the geocodes array, geocode locations list and geo locations map
            geocodes.push(`${valGeo.Geo}`);
            this.geoLocList.push(new GeoLocations(valGeo.Geo, impGeofootprintLocationMap.get(valGeo.STORE)));
            geoLocMap.set(valGeo.Geo, impGeofootprintLocationMap.get(valGeo.STORE));
          }
          else{
            this.failedGeoLocList.push(new GeoLocations(valGeo.Geo, null, `$Site Number ${valGeo.STORE}  not found`));
          }
        });

        const outfields = [];
        const tradeAreasForInsert: ImpGeofootprintTradeArea [] = [];
        const geosToAdd: ImpGeofootprintGeo[] = [];
        const geocodeResultSet: Set<string> = new Set<string>();
        //let failedGeocodeList = null;

        outfields.push('geocode', 'latitude', 'longitude');
        const sub1 = this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', geocodes, false, outfields).subscribe(
          graphics => {
            graphics.forEach(graphic => {
              if (geoLocMap.has(graphic.attributes['geocode'])){
                const geocode = graphic.attributes['geocode'];
                const loc: ImpGeofootprintLocation = geoLocMap.get(geocode);
                geocodeResultSet.add(geocode);
                customIndex++;
                const latitude: number = graphic.attributes['latitude'];
                const longitude: number = graphic.attributes['longitude'];
                const geocodeDistance: number = EsriUtils.getDistance(longitude, latitude, loc.xcoord, loc.ycoord);
                const point = new EsriModules.Point({latitude: latitude, longitude: longitude});
                const geoData = data.parsedData.filter(g => g.Geo === geocode);
                if (geoData.length > 0) {
                  geoData.forEach(geo => {
                    const tas = tradeAreasForInsert.filter(ta => ta.impGeofootprintLocation === loc);
                    if (tas.length > 0) {
                      tas.forEach(ta => {
                        const newGeo = this.createGeo(geocodeDistance, point, loc, ta, graphic.attributes['geocode']);
                        ta.impGeofootprintGeos.push(newGeo);
                        geosToAdd.push(newGeo);
                      });
                    } else {
                      const newTA: ImpGeofootprintTradeArea = AppTradeAreaService.createCustomTradeArea(customIndex, loc, true, 'UPLOADGEO CUSTOM');
                      if (!newTA.impGeofootprintGeos)
                        newTA.impGeofootprintGeos = [];
                      geosToAdd.push(this.createGeo(geocodeDistance, point, loc, newTA, graphic.attributes['geocode']));
                      tradeAreasForInsert.push(newTA);
                    }
                  });
                }
              }
            });
          },
          err => console.log('error:::', err),
          () => {
            this.impGeoService.add(geosToAdd);
            this.impGeofootprintTradeAreaService.add(tradeAreasForInsert);
            const failedGeocodeSet: Set<string> = new Set<string>();
            const failedGeocodeList = Array.from(geoLocMap.keys()).filter(geocode => !geocodeResultSet.has(geocode));
            failedGeocodeList.filter(geo => failedGeocodeSet.add(geo));
            this.geoLocList.forEach(geoLoc => {
              if (failedGeocodeSet.has(geoLoc.geocode1)){
                this.failedGeoLocList.push(new GeoLocations(geoLoc.geocode1, geoLoc.loc, `${currentAnalysisLevel}  ${geoLoc.geocode1}   not found`));
              }
            });
            if (sub1)
                sub1.unsubscribe();
          });
       /* const sub = this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', geocodes, true, outfields).subscribe(graphics => {
        graphics.forEach(graphic => {
                if (geoLocMap.has(graphic.attributes['geocode'])){
                  const geocode = graphic.attributes['geocode'];
                  const loc: ImpGeofootprintLocation = geoLocMap.get(geocode);
                  geocodeResultSet.add(geocode);

                  customIndex++;
                  //successGeoLocMap.set(geocode, loc);
                  const latitude = graphic.geometry['centroid'].latitude   != null ? graphic.geometry['centroid'].latitude  : graphic.geometry['centroid'].y;
                  const longitude = graphic.geometry['centroid'].longitude != null ? graphic.geometry['centroid'].longitude : graphic.geometry['centroid'].x;
                  const geocodeDistance =  EsriUtils.getDistance(longitude, latitude, loc.xcoord, loc.ycoord);
                  const point: __esri.Point = new EsriModules.Point({latitude: latitude, longitude: longitude});

                  const newTA: ImpGeofootprintTradeArea = ValTradeAreaService.createCustomTradeArea(customIndex, loc, true, 'UPLOADGEO CUSTOM');
                  geosToAdd.push(this.createGeo(geocodeDistance, point, loc, newTA, graphic.attributes['geocode']));
                  tradeAreasForInsert.push(newTA);
                }
            });
          //console.log('geos added:::', geosToAdd);
          this.impGeoService.add(geosToAdd);
          this.impGeofootprintTradeAreaService.add(tradeAreasForInsert);

        }, null, () => {
            const failedGeocodeSet: Set<string> = new Set<string>();
            const failedGeocodeList = Array.from(geoLocMap.keys()).filter(geocode => !geocodeResultSet.has(geocode));
            failedGeocodeList.filter(geo => failedGeocodeSet.add(geo));
            this.geoLocList.forEach(geoLoc => {
              if (failedGeocodeSet.has(geoLoc.geocode1)){
                this.failedGeoLocList.push(new GeoLocations(geoLoc.geocode1, geoLoc.loc, `${this.analysisLevel}  ${geoLoc.geocode1}   not found`));
              }
            });
            if (sub)
                sub.unsubscribe();
        });*/
      } else {
        this.messageService.add({summary: 'Upload Error', detail: `The file must contain two columns: Site Number and Geocode.` });
        console.log('Set A validation message', header);
      }

      this.fileUploadEl1.clear();
      //this.fileUploadEl1.basicFileInput.nativeElement.value = '';

    } catch (e) {
      this.fileUploadEl1.clear();
     // this.fileUploadEl1.basicFileInput.nativeElement.value = '';
      this.handleError(`${e}`);
    }
  }

  private uploadTradeAreas(impGeofootprintLocations) {
  //Helper method for selecting polys with matched site #
    this.tradeAreasForInsert = [];
    console.log('Do the action ::', impGeofootprintLocations);

  }

  //Create a custom trade area
  public createGeo(distance: number, point: __esri.Point, loc: ImpGeofootprintLocation, ta: ImpGeofootprintTradeArea, geocode: string) : ImpGeofootprintGeo {
    const impGeofootprintGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo();
    impGeofootprintGeo.geocode = geocode;
    impGeofootprintGeo.isActive = true;
    impGeofootprintGeo.impGeofootprintLocation = loc;
    impGeofootprintGeo.impGeofootprintTradeArea = ta;
    impGeofootprintGeo.distance = distance;
    impGeofootprintGeo.xcoord = point.x;
    impGeofootprintGeo.ycoord = point.y;
    return impGeofootprintGeo;

  }

  private handleError(message: string) : void {
    //this.displayGcSpinner = false;
    //  this.messageService.add({ severity: 'error', summary: 'Trade Area Error', detail: message });
   //  this.appMessageService.showGrowlError(`Trade Area Error:`, `You must select an Analysis Level before uploading a custom trade area.`);
  }

  private onResubmit(row: GeoLocations){
    console.log('onResubmit::::', row);
    let resubmitRecord: string = 'NUMBER,GEO' + '\n';
    resubmitRecord = resubmitRecord + row.loc.locationNumber + ',' + row.geocode1 + '\n' ;
    this.onFileUpload(resubmitRecord);

  }

  private onRemove(row: GeoLocations){
    const index = this.failedGeoLocList.indexOf(row);
    this.failedGeoLocList.splice(index, 1);
  }
}
