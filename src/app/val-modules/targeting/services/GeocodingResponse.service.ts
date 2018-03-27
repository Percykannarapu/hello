import { MetricService } from '../../common/services/metric.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';    // See: https://github.com/ReactiveX/rxjs
import { Subject } from 'rxjs/Subject';
import { EsriLoaderWrapperService } from '../../../services/esri-loader-wrapper.service';
import { MapService } from '../../../services/map.service';
import { DefaultLayers } from '../../../models/DefaultLayers';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import * as $ from 'jquery';
import { GeocodingResponse } from '../../../models/GeocodingResponse';
import { GeocodingAttributes } from '../../../models/GeocodingAttributes';
import { SelectItem } from 'primeng/components/common/selectitem';
import { encode } from 'punycode';
import { ImpGeofootprintLocAttrib } from '../models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from './ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from './ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeArea } from '../models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from './ImpGeofootprintTradeArea.service';
import { MessageService } from 'primeng/components/common/messageservice';

@Injectable()
export class GeocodingResponseService {

    public cols: any[] = [];
    public columnOptions: SelectItem[] = [];
    private subject: Subject<any> = new Subject<any>();
    public pointsPlotted: Subject<any> = new Subject<any>();

    public sitesList: any[] = [];
    public unselectedSitesList: any[] = [];

    private tempId: number = 0;
    public impGeoLocAttrList: any[] = [];
    public impGeofootprintLocList: ImpGeofootprintLocation[] = [];


    constructor(private http: HttpClient,
        private mapService: MapService,
        private metricService: MetricService,
        private impGeofootprintLocationService: ImpGeofootprintLocationService,
        private impGeofootprintLocAttrService: ImpGeofootprintLocAttribService,
        private tradeAreaService: ImpGeofootprintTradeAreaService,
        private messageService: MessageService) { }

    /**
* @description export CSV data to the user
*/
    public exportCSV(csvData: string[], value) {

        let csvString = '';
        for (const row of csvData) {
            let encodedData = encode(row);
            if (encodedData.endsWith('-')) encodedData = encodedData.substring(0, encodedData.length - 1);
            csvString += encodedData + '\n';
        }
        const link = $('<a/>', {
          style: 'display:none',
          href: 'data:application/octet-stream;base64,' + btoa(csvString),
          download: `${value.toLowerCase()}s.csv`
        }).appendTo('body');
        link[0].click();
        link.remove();
    }

    /**
    * @description turn the AmSite[] array stored in this service into CSV data
    * @returns returns a string[] where each element in the array is a row of CSV data and the first element in the array is the header row
    */
    public createCSV(value: string) : string[] {
        const sitesList: any[] = this.displayData(value);
        if (sitesList.length < 1) {
            this.messageService.add({ severity: 'error', summary: 'No location found', detail: `Please add locations.` });
            throw new Error('No sites available to export');
        }
        const tradeAreas: ImpGeofootprintTradeArea[] = this.tradeAreaService.get().filter(t => t.taName.startsWith(value));
        tradeAreas.sort((a, b) => a.taRadius - b.taRadius);
        const csvData: string[] = [];
        // build the first row of the csvData out of the headers
        let displayHeaderRow = 'GROUP,NUMBER,NAME,DESCRIPTION,STREET,CITY,STATE,ZIP,X,Y,ICON,RADIUS1,'
            + 'RADIUS2,RADIUS3,TRAVELTIME1,TRAVELTIME2,TRAVELTIME3,TRADE_DESC1,TRADE_DESC2,TRADE_DESC3,'
            + 'Home Zip Code,Home ATZ,Home BG,Home Carrier Route,Home Geocode Issue,Carrier Route,ATZ,'
            + 'Block Group,Unit,ZIP4,Market,Market Code,Map Group,STDLINXSCD,SWklyVol,STDLINXOCD,SOwnFamCd,'
            + 'SOwnNm,SStCd,SCntCd,FIPS,STDLINXPCD,SSUPFAMCD,SSupNm,SStatusInd,Match Type,Match Pass,'
            + 'Match Score,Match Code,Match Quality,Match Error,Match Error Desc,Original Address,Original City,Original State,Original ZIP';

        const mappingHeaderRow = 'GROUP,Number,Name,DESCRIPTION,Address,City,State,ZIP,Longitude,Latitude,ICON,TA1,'
            + 'TA2,TA3,TRAVELTIME1,TRAVELTIME2,TRAVELTIME3,TA1_DESC1,TA2_DESC2,TA3_DESC3,'
            + 'Home ZIP,Home ATZ,Home BG,HOME PCR,HOME GEOCODE ISSUE,Carrier Route,ATZ,'
            + 'Block Group,Unit,ZIP4,Market,Market Code,Map Group,STDLINXSCD,SWklyVol,STDLINXOCD,SOwnFamCd,'
            + 'SOwnNm,SStCd,SCntCd,FIPS,STDLINXPCD,SSUPFAMCD,SSupNm,SStatusInd,Match Type,Match Pass,'
            + 'Match Score,Match Code,Match Quality,Match Error,Match Error Desc,Original Address,Original City,Original State,Original ZIP';

        //console.log('headerRow:::' + displayHeaderRow);
        //csvData.push(displayHeaderRow);

        const headerList: any[] = mappingHeaderRow.split(',');

        let recNumber: number = 0;
        console.log('exporting csv with data list', sitesList);
        for (const site of sitesList) {
            recNumber++;
            let row: string = '';
            let header: string = '';
            let ta1 = null;
            let ta2 = null;
            let ta3 = null;
            let zip4 = null;
            for (header of headerList) {
                //  if (siteMap.has(header)){

                if (header === 'GROUP') {
                  if (value === 'Competitor') {
                    row = row + 'Competitors,';
                  } else {
                    row = row + 'Advertisers,';

                  }
                    continue;
                }
                if (header.includes('TRAVELTIME')) {
                    row = row + '0,';
                    continue;
                }
                if (header === 'ZIP' || header === 'ZIP4') {
                    if (header === 'ZIP') {
                        if (site[header] !== undefined) {
                            const zip = site[header].split('-');
                            row = row + zip[0] + ',';
                            zip4 = zip[1] || '';
                            continue;
                        }
                    }
                    if (header === 'ZIP4') {
                        row = row + zip4 + ',';
                        continue;
                    }
                }
                if (['TA1', 'TA2', 'TA3'].indexOf(header) >= 0) {
                    if (header === 'TA1') {
                        if (tradeAreas.length >= 1 && tradeAreas[0] != null) {
                            row = row + tradeAreas[0].taRadius + ',';
                        } else {
                            row = row + '0,';
                        }
                    }
                    if (header === 'TA2') {
                        if (tradeAreas.length >= 2 && tradeAreas[1] != null) {
                            row = row + tradeAreas[1].taRadius + ',';
                        } else {
                            row = row + '0,';
                        }
                    }
                    if (header === 'TA3') {
                        if (tradeAreas.length >= 3 && tradeAreas[2] != null) {
                            row = row + tradeAreas[2].taRadius + ',';
                        } else {
                            row = row + '0,';
                        }
                    }

                    continue;
                }
                if (['TA1_DESC1', 'TA2_DESC2', 'TA3_DESC3'].indexOf(header) >= 0) {
                    if (header === 'TA1_DESC1' && ta1 !== null) {
                        row = row + 'RADIUS1,';
                        continue;
                    }
                    if (header === 'TA2_DESC2' && ta2 !== null) {
                        row = row + 'RADIUS2,';
                        continue;
                    }
                    if (header === 'TA3_DESC3' && ta3 !== null) {
                        row = row + 'RADIUS3,';
                        continue;
                    }
                    row = row + ' ,';
                    continue;
                }
                if (site[header] === undefined) {
                    row = row + ' ,';
                }
                else {
                    row = row + site[header] + ',';
                }
            }
            const fields = Object.keys(site);
            fields.sort();
            fields.forEach(item => {
                if (headerList.indexOf(item) < 0 && item.toUpperCase() !== 'GEOCODE STATUS') {
                    // console.log('item name:::' + item);
                    row = row + (site[item] || '') + ',';
                    if (recNumber === 1) {
                        displayHeaderRow = displayHeaderRow + ',' + item;
                    }
                }
            });

            if (row.substring(row.length - 1) === ',') {
                row = row.substring(0, row.length - 1);
            }
            if (recNumber == 1) {
                csvData.push(displayHeaderRow);
            }
            csvData.push(row);
        }
        return csvData;
    }

    public getNewSitePk() : number {
        return this.tempId++;
    }

    //also should be removed eventually : nallana : we are no loger using this for metric to update: datastore is the source now: 2/26/2018
    public add(sitesList: GeocodingResponse[]) {
        // For each site provided in the parameters
        for (const site of sitesList) {
            // Assign the site a temporary pk
            if (site.number == null)
                site.number = this.getNewSitePk().toString();

            // Add the site to the selected sites array
            //this.sitesList = [...this.sitesList, site];


            //for (let i = 0 ; i < sitesList.length; i++){
            console.log('sitesList.length::' + sitesList.length);
            const temp = {};
            site.geocodingAttributesList.forEach(item => {
                const keyValue = Object.values(item);
                temp[keyValue[0].toString()] = keyValue[1];

            });
            this.unselectedSitesList = [...this.unselectedSitesList, temp];
            this.sitesList = [...this.sitesList, temp];

            // Notifiy Observers
            this.subject.next(site);
        }

        // Update the metrics
        this.metricService.add('LOCATIONS', '# of Sites', this.sitesList.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));

        // Debug log site arrays to the console
        this.logSites();
    }

    // //Should be removed eventually : refactoring for business search as well as the geocoding.component
    //     public addCompetitors(amComps: any[]) {
    //         // For each site provided in the parameters
    //         for (const amComp of amComps) {
    //             if (amComp.number == null)
    //                 amComp.number = this.getNewSitePk().toString();
    //             // Add the competitor to the selected sites array
    //             //for (let i = 0 ; i < sitesList.length; i++){
    //             const temp = {};
    //             amComp.geocodingAttributesList.forEach(item => {
    //                 const keyValue = Object.values(item);
    //                 temp[keyValue[0].toString()] = keyValue[1];
    //             });
    //             // Add the site to the selected sites array
    //             this.amComps = [...this.amComps, temp];
    //             // Add the site to the sites list array
    //             this.unselectedAmComps = [...this.unselectedAmComps, amComp];
    //             // Notifiy Observers
    //             this.subject.next(amComp);
    //         }
    //         // Update the metrics
    //         this.metricService.add('LOCATIONS', '# of Competitors', this.amComps.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    //         // Debug log site arrays to the console
    //         this.logSites();
    //     }

    public remove(loc: ImpGeofootprintLocation) {
        // Remove the site from the selected sites array
        this.impGeofootprintLocationService.remove(loc);
        /*  const index = MapService.impGeofootprintLocList.indexOf(loc);
          MapService.impGeofootprintLocList = [...MapService.impGeofootprintLocList.slice(0, index),
          ...MapService.impGeofootprintLocList.slice(index + 1)];

          this.impGeofootprintLocList = MapService.impGeofootprintLocList;
          this.unselectedimpGeofootprintLocList =  MapService.impGeofootprintLocList;*/

        this.mapService.clearGraphicsForParent(Number(loc.glId));
        // Update the metrics
        this.metricService.add('LOCATIONS', '# of Sites', this.impGeofootprintLocationService.get().length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
        this.mapService.callTradeArea();
        // Notifiy Observers
        this.subject.next(loc);
    }

    public update(oldSite: GeocodingResponse, newSite: GeocodingResponse) {
        let index = this.sitesList.indexOf(oldSite);
        this.sitesList = [...this.sitesList.slice(0, index),
            //                     Object.assign({}, person, {age}),
            newSite,
        ...this.sitesList.slice(index + 1)];

        index = this.unselectedSitesList.indexOf(oldSite);
        this.unselectedSitesList = [...this.unselectedSitesList.slice(0, index),
            newSite,
        ...this.unselectedSitesList.slice(index + 1)];
    }

    // Site was unselected outside of the service, eg. from a data table
    // Alert the subscribers of the removal
    public siteWasUnselected(site: GeocodingResponse) {
        //      this.mapService.clearFeatureLayerAt(DefaultLayers.SITES, amSite.ycoord, amSite.xcoord);
        //      this.mapService.clearGraphicsAt(amSite.ycoord, amSite.xcoord);

        // Clear all map graphics that have an attribute of parentId with a value of amSite.pk
        this.mapService.clearGraphicsForParent(Number(site.number));

        this.subject.next(site);
    }

    // Site was selected outside of the service, eg. from a data table
    // Alert the subscribers of the addition
    public siteWasSelected(site: GeocodingResponse) {
        this.subject.next(site);
    }

    public refreshMapSites(selector) {
        console.log('refreshMapSites fired');
        if (selector === 'Site') {
            this.mapService.clearFeatureLayer(DefaultLayers.SITES);
        } else {
            this.mapService.clearFeatureLayer(DefaultLayers.COMPETITORS);
        }

        // Reflect selected sites on the map
        this.addSelectedSitesToMap(selector);
        console.log('refreshMapSites - cleared and set ' + this.sitesList.length + ' sites.');
    }

    // Create a Graphic object for the site that can be displayed on the map
    public async createGraphic(site: GeocodingResponse, popupTemplate: __esri.PopupTemplate): Promise<__esri.Graphic> {
        const loader = EsriLoaderWrapperService.esriLoader;
        const [Graphic] = await loader.loadModules(['esri/Graphic']);
        let graphic: __esri.Graphic = new Graphic();

        // give our site a blue color
        const color = {
            a: 1,
            r: 35,
            g: 93,
            b: 186
        };

        await this.mapService.createGraphic(site.latitude, site.longitude, color, popupTemplate, Number(site.number))
            .then(res => {
                graphic = res;
            });
        return graphic;
    }

    // Create a PopupTemplate for the site that will be displayed on the map
    private async createSitePopup(site: GeocodingResponse): Promise<__esri.PopupTemplate> {
        const loader = EsriLoaderWrapperService.esriLoader;
        const [PopupTemplate] = await loader.loadModules(['esri/PopupTemplate']);
        const popupTemplate: __esri.PopupTemplate = new PopupTemplate();
        const popupAttributesList: GeocodingAttributes[] = site.geocodingAttributesList;
        popupTemplate.title = `Sites`;
        let template = `<table> <tbody>`;
        for (const popupAttribute of popupAttributesList) {
            template = template + `<tr><th>${popupAttribute.attributeName}</th><td>${popupAttribute.attributeValue}</td></tr>`;
        }
        template = template + `</tbody> </table>`;
        popupTemplate.content = template;

        return popupTemplate;
    }

    // draw the site graphics on the Sites layer
    public async updateLayer(graphics: __esri.Graphic[], selector) {
        console.log('refreshMapSites fired');
        if (selector === 'Site') {
            this.mapService.updateFeatureLayer(graphics, DefaultLayers.SITES, true);
        } else {
            this.mapService.updateFeatureLayer(graphics, DefaultLayers.COMPETITORS, true);
        }
    }

    // Add all of the selected sites to the map
    private async addSelectedSitesToMap(selector) {
        try {
            const loader = EsriLoaderWrapperService.esriLoader;
            const [Graphic] = await loader.loadModules(['esri/Graphic']);
            const graphics: __esri.Graphic[] = new Array<__esri.Graphic>();
            for (const site of this.sitesList) {
                //console.log('creating popup for site: ' + amSite.pk);
                await this.createSitePopup(site)
                    .then(res => this.createGraphic(site, res))
                    .then(res => { graphics.push(res); })
                    .catch(err => this.handleError(err));
            }
            await this.updateLayer(graphics, selector)
                .then(res => { this.mapService.zoomOnMap(graphics); })
                .then(res => this.add(this.sitesList))
                .then(res => this.createGrid())
                .catch(err => this.handleError(err));
        } catch (error) {
            this.handleError(error);
        }
    }

    public observeSites(): Observable<GeocodingResponse> {
        return this.subject.asObservable();
    }

    //   onDbReset = this.messageService.state;

    private log(message: string) {
        //      this.messageService.add({severity: 'success', summary: 'AmSiteService: ' + message, detail: 'Via MessageService'});
    }

    // Debug methods
    logEnd() {
        console.log('getAmSites ended');
    }

    logMsg(p_msg: string) {
        console.log(p_msg);
    }

    public logSites() {
        console.log('--# SELECTED AMSITES');
        for (const site of this.sitesList)
            console.log('  ' + site);

        console.log('--# UNSELECTED AMSITES');
        for (const site of this.unselectedSitesList)
            console.log('  ' + site);
    }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        return Promise.reject(error.message || error);
    }

    //TODO: need to remove this Method
    /*public createGrid(sitesList: GeocodingResponse[]) {
        if (this.cols.length <= 0) {
            Object.keys(this.sitesList[0]).forEach(item => {
                this.cols.push({ field: item, header: item, size: '70px' });
            });
            for (let i = 0; i < this.cols.length; i++) {
                this.columnOptions.push({ label: this.cols[i].header, value: this.cols[i] });
            }
        }
    }*/

    public createGrid() {
        this.cols = [];
        this.impGeoLocAttrList.forEach(attrList => {
            if (this.cols.length <= 0) {
                attrList.forEach(locAttr => {
                    if (['Number', 'Name', 'Address', 'City', 'State', 'ZIP', 'Geocode Status', 'Latitude', 'Longitude', 'Match Code',
                        'Match Quality', 'Original Address', 'Original City', 'Original State', 'Original ZIP', 'Market'].indexOf(locAttr.attributeCode) < 0) {
                        // console.log('locAttr.attributeCode::::', locAttr.attributeCode);
                        this.cols.push({ field: locAttr.attributeCode, header: locAttr.attributeCode, size: '90px' });
                    }
                });
                for (let i = 0; i < this.cols.length; i++) {
                    this.columnOptions.push({ label: this.cols[i].header, value: this.cols[i] });
                }
            }
        });
    }

    public displayData(value) {
        const result: any[] = [];
        this.impGeoLocAttrList = [];
        this.impGeofootprintLocList = [];
        this.impGeoLocAttrList = this.impGeofootprintLocAttrService.get();
        this.impGeofootprintLocList = this.impGeofootprintLocationService.get();
        const currentLocList = this.impGeofootprintLocList.filter(l => l.clientLocationTypeCode === value);

        for (const currentLoc of currentLocList) {
            const gridMap: any = {};
            const returnList: ImpGeofootprintLocAttrib[] = this.impGeoLocAttrList.filter(
                attr => attr.impGeofootprintLocation.glId === currentLoc.glId);
            for (const locAttr of returnList) {
                gridMap['Number'] = currentLoc.glId;
                gridMap['Name'] = currentLoc.locationName;
                gridMap['Latitude'] = currentLoc.ycoord;
                gridMap['Longitude'] = currentLoc.xcoord;
                gridMap['City'] = currentLoc.origCity;
                gridMap['State'] = currentLoc.origState;
                gridMap['Orginal ZIP'] = currentLoc.origPostalCode;
                gridMap['Original Address'] = currentLoc.origAddress1;
                gridMap['ZIP'] = currentLoc.locZip;
                gridMap['Address'] = currentLoc.locAddress;
                gridMap[locAttr.attributeCode] = locAttr.attributeValue;
               // this.impGeofootprintLocList[locAttr.attributeCode] = locAttr.attributeValue;
       
            }
            result.push(gridMap);
        }   
        return result;
    }

    public locToEntityMapping(sitesList: GeocodingResponse[], selector) {
        // this.gridData = sitesList;
        this.impGeofootprintLocList = [];
        const gridtemp: any[] = [];
        const impGeofootprintLocAttribList: ImpGeofootprintLocAttrib[] = [];
        sitesList.forEach(site => {


            const impGeofootprintLoc: ImpGeofootprintLocation = new ImpGeofootprintLocation();
            impGeofootprintLoc.glId = Number(site.number);
            impGeofootprintLoc.locationName = site.name;
            impGeofootprintLoc.locAddress = site.addressline;
            impGeofootprintLoc.locCity = site.city;
            impGeofootprintLoc.locState = site.state;
            impGeofootprintLoc.locZip = site.zip;
            impGeofootprintLoc.recordStatusCode = site.status;
            impGeofootprintLoc.xcoord = site.longitude;
            impGeofootprintLoc.ycoord = site.latitude;
            impGeofootprintLoc.geocoderMatchCode = site.matchCode;
            impGeofootprintLoc.geocoderLocationCode = site.locationQualityCode;
            impGeofootprintLoc.origAddress1 = site.orgAddr;
            impGeofootprintLoc.origCity = site.orgCity;
            impGeofootprintLoc.origState = site.orgState;
            impGeofootprintLoc.origPostalCode = site.zip10;
            impGeofootprintLoc.marketName = site.marketName;
            impGeofootprintLoc.clientLocationTypeCode = selector;
            impGeofootprintLoc.homeGeocode = site.homeGeocode;

            //impGeofootprintLoc.qua = site.locationQualityCode;
            // impGeofootprintLoc.origAddress1 = site
            let i: number = 0;
            const impLocAttrTempList: ImpGeofootprintLocAttrib[] = [];
            site.geocodingAttributesList.forEach(geocodingAttr => {

                const impGeofootprintLocAttr: ImpGeofootprintLocAttrib = new ImpGeofootprintLocAttrib();
                impGeofootprintLocAttr.attributeCode = geocodingAttr.attributeName;
                impGeofootprintLocAttr.attributeValue = geocodingAttr.attributeValue;
                impGeofootprintLocAttr.locAttributeId = i++;
                impGeofootprintLocAttr.impGeofootprintLocation = impGeofootprintLoc;
                impGeofootprintLocAttribList.push(impGeofootprintLocAttr);
                impLocAttrTempList.push(impGeofootprintLocAttr);
            });
            this.impGeoLocAttrList.push(impLocAttrTempList);
            this.impGeofootprintLocList = [...this.impGeofootprintLocList, impGeofootprintLoc];

        });
        this.impGeofootprintLocationService.add(this.impGeofootprintLocList); //add to the dataStore for metric calculation
        this.impGeofootprintLocAttrService.add(impGeofootprintLocAttribList);

    }
}
