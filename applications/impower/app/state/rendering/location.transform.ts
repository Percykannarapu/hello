import { Point } from 'esri/geometry';
import Graphic from 'esri/Graphic';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';

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
  { fieldName: 'labelName', label: 'labelName', visible: false },
  { fieldName: 'marketName', label: 'Market', visible: false },
  { fieldName: 'marketCode', label: 'Market Code', visible: false },
  { fieldName: 'groupName', label: 'Group', visible: false }
];

export function createSiteGraphic(site: ImpGeofootprintLocation, oid: number) : __esri.Graphic {
  const graphic = new Graphic({
    geometry: new Point({
      x: site.xcoord,
      y: site.ycoord
    }),
    attributes: { objectId: oid },
    visible: site.isActive
  });

  for (const field of defaultLocationPopupFields) {
    const fieldValue = site[field.fieldName];
    graphic.attributes[field.fieldName] = fieldValue == null ? '' : fieldValue.toString();
  }

  site.impGeofootprintLocAttribs.forEach(attr => {
    graphic.attributes[attr.attributeCode] = attr.attributeValue;
  });

  return graphic;
}
