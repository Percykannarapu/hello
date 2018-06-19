import { Component, OnInit } from '@angular/core';
import { AppLocationService } from '../../services/app-location.service';
import { Observable } from 'rxjs';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { map } from 'rxjs/operators';
import { ConfirmationService, SelectItem } from 'primeng/primeng';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AppMapService } from '../../services/app-map.service';
import { AppLayerService } from '../../services/app-layer.service';
import { AppGeoService } from '../../services/app-geo.service';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { simpleFlatten } from '../../val-modules/common/common.utils';

@Component({
  selector: 'val-site-list',
  templateUrl: './site-list.component.html',
  styleUrls: ['./site-list.component.css']
})
export class SiteListComponent implements OnInit {

  public selectedListType: 'Site' | 'Competitor';
  public currentAllSites$: Observable<ImpGeofootprintLocation[]>;
  public currentActiveSites$: Observable<ImpGeofootprintLocation[]>;
  public allSiteCount$: Observable<number>;
  public activeSiteCount$: Observable<number>;

  public columnOptions: SelectItem[] = [];
  // TODO: Where to put this stuff?
  public allColumns: any[] = [
    { field: 'locationNumber',       header: 'Number',           size: '60px'},
    { field: 'locationName',         header: 'Name',             size: '120px'},
    { field: 'locAddress',           header: 'Address',          size: '120px'},
    { field: 'locCity',              header: 'City',             size: '70px'},
    { field: 'locState',             header: 'State',            size: '40px'},
    { field: 'locZip',               header: 'ZIP',              size: '75px'},
    { field: 'marketName',           header: 'Market',           size: '85px'},
    { field: 'recordStatusCode',     header: 'Geocode Status',   size: '70px'},
    { field: 'ycoord',               header: 'Latitude',         size: '80px'},
    { field: 'xcoord',               header: 'Longitude',        size: '80px'},
    { field: 'geocoderMatchCode',    header: 'Match Code',       size: '70px'},
    { field: 'geocoderLocationCode', header: 'Match Quality',    size: '70px'},
    { field: 'origAddress1',         header: 'Original Address', size: '70px'},
    { field: 'origCity',             header: 'Original City',    size: '70px'},
    { field: 'origState',            header: 'Original State',   size: '38px'},
    { field: 'origPostalCode',       header: 'Original Zip',     size: '70px'}
  ];
  public selectedColumns: any[] = [];
  public attributeColumns: string[];

  constructor(private siteListService: AppLocationService,
              private locationService: ImpGeofootprintLocationService,
              private attributeService: ImpGeofootprintLocAttribService,
              private confirmationService: ConfirmationService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private geoService:  ImpGeofootprintGeoService,
              private geoAttributeService: ImpGeofootprintGeoAttribService,
              private appMapService: AppMapService,
              private appLayerService: AppLayerService,
              private valGeoService: AppGeoService,
              private esriMapService: EsriMapService,
              private usageService: UsageService) { }

  ngOnInit() {
    this.onListTypeChange('Site');
    for (const column of this.allColumns) {
      this.columnOptions.push({ label: column.header, value: column });
      this.selectedColumns.push(column);
    }
  }

  public onListTypeChange(data: 'Site' | 'Competitor') {
    this.selectedListType = data;
    if (this.selectedListType === 'Site') {
      this.currentAllSites$ = this.siteListService.allClientLocations$;
      this.currentActiveSites$ = this.siteListService.activeClientLocations$;
    } else {
      this.currentAllSites$ = this.siteListService.allCompetitorLocations$;
      this.currentActiveSites$ = this.siteListService.activeCompetitorLocations$;
    }
    this.setCounts();
  }

  public onRowSelect(event: any, isSelected: boolean) {
    this.setLocationHierarchyActiveFlag((event.data as ImpGeofootprintLocation), isSelected);
  }

  public onRowDelete(row: ImpGeofootprintLocation) {
    const number = row.locationNumber != null ? 'Number=' + row.locationNumber + '~' : '';
    const name =   row.locationName   != null ? 'Name=' + row.locationName + '~'     : '';
    const street = row.locAddress     != null ? 'Street=' + row.locAddress + '~'     : '';
    const city =   row.locCity        != null ? 'City=' + row.locCity + '~'          : '';
    const state =  row.locState       != null ? 'State=' + row.locState + '~'        : '';
    const zip =    row.locZip         != null ? 'ZIP=' + row.locZip + '~'            : '';
    const market = row.marketName     != null ? 'market=' + row.marketName + '~'     : '';
    const x =      row.xcoord         != null ? 'X=' + row.xcoord + '~'              : '';
    const y =     row.ycoord          != null ? 'Y=' + row.ycoord                    : '';

    const metricText = number + name + street + city + state + zip + market + x + y;
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'ui-icon-trash',
      accept: () => {
        this.removeLocationHierarchy(row);
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location',
                                                  target: 'single-' + this.selectedListType.toLowerCase(), action: 'delete' });
       this.usageService.createCounterMetric(usageMetricName, metricText, 1);
        console.log('remove successful');
      },
      reject: () => {
        console.log('cancelled remove');
      }
    });
  }

  public onRowZoom(row: ImpGeofootprintLocation) {
    this.esriMapService.zoomOnMap({ min: row.xcoord, max: row.xcoord }, { min: row.ycoord, max: row.ycoord }, 1);
  }

  public getRowAttributes(row: ImpGeofootprintLocation) {
    this.attributeColumns = [];
    const result: any = {};
    if (row.impGeofootprintLocAttribs == null || row.impGeofootprintLocAttribs.length === 0) return null;
    for (const attr of row.impGeofootprintLocAttribs) {
      this.attributeColumns.push(attr.attributeCode);
      result[attr.attributeCode] = attr.attributeValue;
    }
    return [result];
  }

  public removeLocationHierarchy(location: ImpGeofootprintLocation) {
    this.geoAttributeService.remove(simpleFlatten(location.impGeofootprintGeos.map(geo => geo.impGeofootprintGeoAttribs)));
    this.geoService.remove(location.impGeofootprintGeos);
    this.tradeAreaService.remove(location.impGeofootprintTradeAreas);
    this.attributeService.remove(location.impGeofootprintLocAttribs);
    this.locationService.addDbRemove(location);  // For database removal
    this.locationService.remove(location);
  }

  public setLocationHierarchyActiveFlag(location: ImpGeofootprintLocation, isActive: boolean) {
    location.impGeofootprintGeos.forEach(geo => {
      geo.impGeofootprintGeoAttribs.forEach(attr => attr.isActive = isActive);
      geo.isActive = isActive;
    });
    location.impGeofootprintTradeAreas.forEach(ta => ta.isActive = isActive);
    location.impGeofootprintLocAttribs.forEach(attr => attr.isActive = isActive);
    location.isActive = isActive;
    this.geoAttributeService.update(null, null);
    this.geoService.update(null, null);
    this.tradeAreaService.update(null, null);
    this.attributeService.update(null, null);
    this.locationService.update(null, null);
  }

  private setCounts() {
    // every time we change the ref to the current observable, we have to reset the mapping
    this.allSiteCount$ = this.currentAllSites$.pipe(map(s => s.length));
    this.activeSiteCount$ = this.currentActiveSites$.pipe(map(s => s.length));
  }
}
