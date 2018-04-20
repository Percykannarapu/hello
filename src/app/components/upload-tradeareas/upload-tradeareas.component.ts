import { Component, OnInit, ViewChild } from '@angular/core';
import { siteListUploadRules } from './upload.rules';
import { FileService, ParseResponse, ParseRule } from '../../val-modules/common/services/file.service';
import { FileUpload } from 'primeng/primeng';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import * as XLSX from 'xlsx';
import { MessageService } from 'primeng/components/common/messageservice';
import { ImpDiscoveryUI } from '../../models/ImpDiscoveryUI';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { AppConfig } from '../../app.config';
import { EsriQueryService } from '../../esri-modules/layers/esri-query.service';
import { ValTradeAreaService } from '../../services/app-trade-area.service';
import { EsriUtils } from '../../esri-modules/core/esri-utils.service';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { EsriModules } from '../../esri-modules/core/esri-modules.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';

class GeoLocations {

  constructor(private geocode: string, private location:  ImpGeofootprintLocation){}
  geocode1: string = this.geocode;
  loc: ImpGeofootprintLocation = this.location;
}

@Component({
  selector: 'val-upload-tradeareas',
  templateUrl: './upload-tradeareas.component.html',
  styleUrls: ['./upload-tradeareas.component.css']
})
export class UploadTradeAreasComponent implements OnInit {
  public listType1: string = 'Site';
  private tradeAreasForInsert: ImpGeofootprintTradeArea[] = [];
  public impGeofootprintLocations: ImpGeofootprintLocation[];
  private csvParseRules: ParseRule[] = siteListUploadRules;
  public failedGeoLocList: GeoLocations[] = [];
  //private csvHeaderValidator: (foundHeaders: ParseRule[]) => boolean = siteUploadHeaderValidator;

  @ViewChild('tradeAreaUpload') private fileUploadEl1: FileUpload;

  constructor(private messageService: MessageService,
    private impDiscoveryService: ImpDiscoveryService, private appConfig: AppConfig,
    private esriQueryService: EsriQueryService,
    private tradeAreaService: ValTradeAreaService,
    private impGeofootprintLocationService: ImpGeofootprintLocationService,
    private impGeoService: ImpGeofootprintGeoService,
    private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
    private usageService: UsageService) { }

  ngOnInit() {
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
      const discoveryUI: ImpDiscoveryUI[] = this.impDiscoveryService.get();
      let customIndex: number = 0;
      const analysisLevel = discoveryUI[0].analysisLevel;
      const portalLayerId = this.appConfig.getLayerIdForAnalysisLevel(analysisLevel, true);

      const filteredLocations: ImpGeofootprintLocation[] = [];
      const geoLocList: GeoLocations[] = [];
      
      const successGeoLocMap:  Map<string, ImpGeofootprintLocation>  = new Map<string, ImpGeofootprintLocation>();
      const geoLocMap: Map<string, ImpGeofootprintLocation>  = new Map<string, ImpGeofootprintLocation>();

      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'custom-data-file', action: 'upload' });
       this.usageService.createCounterMetric(usageMetricName, null, rows.length - 1);


      const data: ParseResponse<ValGeocodingRequest> = FileService.parseDelimitedData(header, rows, this.csvParseRules);
      const headerCheck: string[] = header.split(/,/);


      if (headerCheck.length == 2) {

        const geocodes = [] ;

        data.parsedData.forEach(valGeo => {
          this.impGeofootprintLocationService.get().forEach(loc => {
            if (valGeo.STORE == loc.locationNumber){
               geocodes.push(`${valGeo.Geo}`);
               filteredLocations.push(loc);
               geoLocList.push(new GeoLocations(valGeo.Geo, loc));
               geoLocMap.set(valGeo.Geo, loc);

            }
          });
        });

        //console.log('number of geocodes:::', geocodes);
        const outfields = [];
        const tradeAreasForInsert: ImpGeofootprintTradeArea [] = [];
       // tradeAreasForInsert = this.impGeofootprintTradeAreaService.get();
        outfields.push('geocode');
        const sub = this.esriQueryService.queryAttributeIn(portalLayerId, 'geocode', geocodes, true, outfields).subscribe(graphics => {
          const geosToAdd: ImpGeofootprintGeo[] = [];
         // console.log('graphic:::::', graphics);
         if (graphics.length === 0)
              this.failedGeoLocList = geoLocList;
         const geocodeResultSet: Set<string> = new Set<string>();
          graphics.forEach(graphic => {
            //console.log('test', graphic);
                if (geoLocMap.has(graphic.attributes['geocode'])){
                  const geocode = graphic.attributes['geocode'];
                  const loc: ImpGeofootprintLocation = geoLocMap.get(geocode);
                  geocodeResultSet.add(geocode);
                  
                  customIndex++;
                  successGeoLocMap.set(geocode, loc);
                  const latitude = graphic.geometry['centroid'].latitude   != null ? graphic.geometry['centroid'].latitude  : graphic.geometry['centroid'].y;
                  const longitude = graphic.geometry['centroid'].longitude != null ? graphic.geometry['centroid'].longitude : graphic.geometry['centroid'].x;
                  const geocodeDistance =  EsriUtils.getDistance(longitude, latitude,
                                                                 loc.xcoord, loc.ycoord);
                  const point: __esri.Point = new EsriModules.Point({latitude: latitude, longitude: longitude});
                  geosToAdd.push(this.createGeo(geocodeDistance, point, loc, graphic.attributes['geocode']));
                  tradeAreasForInsert.push(ValTradeAreaService.createCustomTradeArea(customIndex, loc, true, 'UPLOADGEO CUSTOM'));
                }
            });
          //console.log('geos added:::', geosToAdd);
          this.impGeoService.add(geosToAdd);
          this.impGeofootprintTradeAreaService.add(tradeAreasForInsert);
          const failedGeocodeList = Array.from(geoLocMap.keys()).filter(geocode => !geocodeResultSet.has(geocode));
          this.failedGeoLocList = geoLocList.filter(geocode => failedGeocodeList.includes(geocode.geocode1));
        });
      } else {
        this.messageService.add({ severity: 'error', summary: 'Upload Error', detail: `The file must contain two columns: Site Number and Geocode.` });
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
  public createGeo(distance: number, point: __esri.Point, loc: ImpGeofootprintLocation, geocode: string) : ImpGeofootprintGeo {
    const impGeofootprintGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo();
    impGeofootprintGeo.geocode = geocode;
    impGeofootprintGeo.isActive = 1;
    impGeofootprintGeo.impGeofootprintLocation = loc;
    impGeofootprintGeo.distance = distance;
    impGeofootprintGeo.xcoord = point.x;
    impGeofootprintGeo.ycoord = point.y;
    return impGeofootprintGeo;

  }

  private handleError(message: string) : void {
    //this.displayGcSpinner = false;
    this.messageService.add({ severity: 'error', summary: 'Geocoding Error', detail: message });
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
