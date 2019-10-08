import { groupByExtended } from '@val/common';
import { EsriApi, MapSymbols } from '@val/esri';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';

export class LocationDrawDefinition {
  groupName: string;
  layerName: string;
  sites: __esri.Graphic[];
  constructor(public siteType: SuccessfulLocationTypeCodes,
              public color: [number, number, number, number],
              public symbolPath: string,
              public labelExpression: string,
              public popupTitleExpression: string) {
    this.groupName = `${siteType}s`;
    this.layerName = `Project ${siteType}s`;
  }
}

let oidCache = 0;

export const defaultLocationPopupFields = [
  { fieldName: 'locationNumber', label: 'Location Number' },
  { fieldName: 'locAddress', label: 'Address' },
  { fieldName: 'locCity', label: 'City' },
  { fieldName: 'locState', label: 'State' },
  { fieldName: 'locZip', label: 'Zip' },
  { fieldName: 'recordStatusCode', label: 'Geocode Status' },
  { fieldName: 'ycoord', label: 'Latitude' },
  { fieldName: 'xcoord', label: 'Longitude' },
  { fieldName: 'geocoderMatchCode', label: 'Match Code' },
  { fieldName: 'geocoderLocationCode', label: 'Match Quality' },
  { fieldName: 'origAddress1', label: 'Original Address' },
  { fieldName: 'origCity', label: 'Original City' },
  { fieldName: 'origState', label: 'Original State' },
  { fieldName: 'origPostalCode', label: 'Original Zip' },
  { fieldName: 'clientLocationTypeCode', label: 'clientLocationTypeCode', visible: false },
  { fieldName: 'locationName', label: 'locationName', visible: false }
];

function createSiteGraphic(site: ImpGeofootprintLocation, oid?: number) : __esri.Graphic {
  const graphic = new EsriApi.Graphic({
    geometry: new EsriApi.Point({
      x: site.xcoord,
      y: site.ycoord
    }),
    attributes: { parentId: oid == null ? oidCache++ : oid },
    visible: site.isActive
  });
  for (const field of defaultLocationPopupFields) {
    const fieldValue = site[field.fieldName];
    graphic.attributes[field.fieldName] = fieldValue == null ? '' : fieldValue.toString();
  }
  return graphic;
}

export function prepareLocations(sites: ImpGeofootprintLocation[]) : LocationDrawDefinition[] {
  const sitesByType = groupByExtended(sites, l => ImpClientLocationTypeCodes.parseAsSuccessful(l.clientLocationTypeCode));
  const result: LocationDrawDefinition[] = [];
  sitesByType.forEach((currentSites, siteType) => {
    const color: [number, number, number, number] = siteType === ImpClientLocationTypeCodes.Site ? [0, 0, 255, 1] : [255, 0, 0, 1];
    const currentResult = new LocationDrawDefinition(siteType, color, MapSymbols.STAR, '$feature.locationNumber', '{clientLocationTypeCode}: {locationName}');
    currentResult.sites = currentSites.map(l => createSiteGraphic(l));
    result.push(currentResult);
  });
  return result;
}
