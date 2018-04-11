import { Component, OnInit } from '@angular/core';
import { ValSiteListService } from '../../services/app-site-list.service';
import { Observable } from 'rxjs/Observable';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { map } from 'rxjs/operators';
import { ConfirmationService, SelectItem } from 'primeng/primeng';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { ValMapService } from '../../services/app-map.service';
import { ValLayerService } from '../../services/app-layer.service';
import { ValGeoService } from '../../services/app-geo.service';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';

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

  constructor(private siteListService: ValSiteListService,
              private locationService: ImpGeofootprintLocationService,
              private attributeService: ImpGeofootprintLocAttribService,
              private confirmationService: ConfirmationService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private geoService:  ImpGeofootprintGeoService,
              private geoAttributeService: ImpGeofootprintGeoAttribService,
              private impDiscoveryService: ImpDiscoveryService,
              private appMapService: ValMapService,
              private appLayerService: ValLayerService,
              private valGeoService: ValGeoService,
              private esriMapService: EsriMapService) { }

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
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'ui-icon-trash',
      accept: () => {
        this.removeLocationHierarchy(row);
        console.log('remove successful');
      },
      reject: () => {
        console.log('cancelled remove');
      }
    });
  }

  public onRowZoom(row: ImpGeofootprintLocation) {
    // TODO: Map Stuff
   const locList: ImpGeofootprintLocation[] = [];
   locList.push(row);
    this.esriMapService.zoomOnMap(locList);
  }

  public getRowAttributes(row: ImpGeofootprintLocation) {
    const attrs = this.attributeService.get().filter(a => a.impGeofootprintLocation === row);
    this.attributeColumns = [];
    const result: any = {};
    if (attrs == null || attrs.length === 0) return null;
    for (const attr of attrs) {
      this.attributeColumns.push(attr.attributeCode);
      result[attr.attributeCode] = attr.attributeValue;
    }
    return [result];
  }

  public removeLocationHierarchy(location: ImpGeofootprintLocation) {
    const attributes = this.attributeService.get().filter(attr => attr.impGeofootprintLocation === location);
    const tas = this.tradeAreaService.get().filter(trArea => trArea.impGeofootprintLocation === location);
    const geos = this.geoService.get().filter(geo => geo.impGeofootprintLocation === location);
    const geoSet = new Set(geos);
    const geoAttributes = this.geoAttributeService.get().filter(att => geoSet.has(att.impGeofootprintGeo));
    this.geoAttributeService.remove(geoAttributes);
    this.geoService.remove(geos);
    this.tradeAreaService.remove(tas);
    this.attributeService.remove(attributes);
    this.locationService.addDbRemove(location);  // For database removal 
    this.locationService.remove(location);
  }

  public setLocationHierarchyActiveFlag(location: ImpGeofootprintLocation, isActive: boolean) {
    const attributes = this.attributeService.get().filter(attr => attr.impGeofootprintLocation === location);
    const tas = this.tradeAreaService.get().filter(trArea => trArea.impGeofootprintLocation === location);
    const geos = this.geoService.get().filter(geo => geo.impGeofootprintLocation === location);
    const geoSet = new Set(geos);
    const geoAttributes = this.geoAttributeService.get().filter(att => geoSet.has(att.impGeofootprintGeo));
    location.isActive = isActive;
    attributes.forEach(att => att.isActive = isActive ? 1 : 0);
    tas.forEach(area => area.isActive = isActive ? 1 : 0);
    geos.forEach(geo => geo.isActive = isActive ? 1 : 0);
    geoAttributes.forEach(att => att.isActive = isActive ? 1 : 0);
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
