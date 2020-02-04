import { groupByExtended } from '@val/common';
import { MapSymbols } from '@val/esri';
import { Point } from 'esri/geometry';
import Graphic from 'esri/Graphic';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { ImpProjectPref } from 'app/val-modules/targeting/models/ImpProjectPref';

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
  { fieldName: 'locationName', label: 'locationName', visible: false },
  { fieldName: 'labelName', label: 'labelName', visible: false  }
];

function createSiteGraphic(site: ImpGeofootprintLocation, oid?: number, labelVal?: string) : __esri.Graphic {
  const graphic = new Graphic({
    geometry: new Point({
      x: site.xcoord,
      y: site.ycoord
    }),
    attributes: { parentId: oid == null ? oidCache++ : oid },
    visible: site.isActive
  });

  let label = null;
  
  const attribute = site.impGeofootprintLocAttribs.filter(attr => attr != null && attr.attributeCode === labelVal);
  label = site[labelVal] != null ? site[labelVal].toString() : attribute != null && attribute.length > 0 ? attribute[0].attributeValue.toString() : site['locationNumber'];

  for (const field of defaultLocationPopupFields) {
    const fieldValue = site[field.fieldName];
    //graphic.attributes[field.fieldName] = fieldValue == null ? '' : fieldValue.toString();
    graphic.attributes[field.fieldName] = fieldValue == null ? field.fieldName === 'labelName' ? label : '' : fieldValue.toString();
  }
  
  return graphic;
}

export function prepareLocations(sites: ImpGeofootprintLocation[], prefs?: ImpProjectPref[]) : LocationDrawDefinition[] {
  const sitesByType = groupByExtended(sites, l => ImpClientLocationTypeCodes.parseAsSuccessful(l.clientLocationTypeCode));
  const result: LocationDrawDefinition[] = [];
  sitesByType.forEach((currentSites, siteType) => {
    const label = prefs.length > 0 ? prefs.filter(pref => pref.pref === siteType)[0].val : 'Number';
    const color: [number, number, number, number] = siteType === ImpClientLocationTypeCodes.Site ? [0, 0, 255, 1] : [255, 0, 0, 1];
    const currentResult = new LocationDrawDefinition(siteType, color, MapSymbols.STAR, '$feature.labelName', '{clientLocationTypeCode}: {labelName}');
    currentResult.sites = currentSites.map(l => createSiteGraphic(l, null, label));
    result.push(currentResult);
  });
  return result;
}
