import { MetricService } from '../../common/services/metric.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MapService } from '../../../services/map.service';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import * as $ from 'jquery';
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
                attr => attr.impGeofootprintLocation === currentLoc);
            for (const locAttr of returnList) {
                gridMap['Number'] = currentLoc.glId;
                gridMap['Name'] = currentLoc.locationName;
                gridMap['Latitude'] = currentLoc.ycoord;
                gridMap['Longitude'] = currentLoc.xcoord;
                gridMap['City'] = currentLoc.origCity;
                gridMap['State'] = currentLoc.origState;
                gridMap['Original ZIP'] = currentLoc.origPostalCode;
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
}
