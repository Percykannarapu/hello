import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { EsriModules } from '../esri-modules/core/esri-modules.service';

export class LocationUiModel {

  private static starPath: string = 'M 240.000 260.000 L 263.511 272.361 L 259.021 246.180 L 278.042 227.639 L 251.756 223.820 L 240.000 200.000 L 228.244 223.820 L 201.958 227.639 L 220.979 246.180 L 216.489 272.361 L 240.000 260.000';
  private static red = [255, 0, 0];
  private static blue = [35, 93, 186];

  private static defaultPopupFields = [
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
  ];

  public point: __esri.Graphic;

  constructor(public location: ImpGeofootprintLocation, public attributes?: ImpGeofootprintLocAttrib[], private popupTemplate?: string, private popupTitle?: string, ) {
    if (this.attributes == null) this.attributes = [];
    this.initGraphic();
  }

  private initGraphic() : void {
    const currentColor = new EsriModules.Color((this.location.clientLocationTypeCode && this.location.clientLocationTypeCode === 'Site') ? LocationUiModel.blue : LocationUiModel.red);
    const symbol: __esri.SimpleMarkerSymbol = new EsriModules.SimpleMarkerSymbol({
      style: 'path',
      size: 12,
      outline: null,
      color: currentColor,
      path: LocationUiModel.starPath
    });
    const point: __esri.Point = new EsriModules.Point({
      x: this.location.xcoord,
      y: this.location.ycoord
    });
    const defaultFields = Array.from(LocationUiModel.defaultPopupFields);
    const defaultTitle: string = `${this.location.clientLocationTypeCode}: ${this.location.locationName}`;
    const popup = new EsriModules.PopupTemplate({
      title: (this.popupTitle == null ? defaultTitle : this.popupTitle),
      content: (this.popupTemplate == null ? [{ type: 'fields' }] : this.popupTemplate),
      fieldInfos: (this.popupTemplate == null ? defaultFields : [])
    });
    this.point = new EsriModules.Graphic({
      geometry: point,
      symbol: symbol,
      popupTemplate: popup,
      visible: (this.location.isActive === true),
      attributes: { parentId: this.location.locationNumber }
    });
    for (const [field, value] of Object.entries(this.location)) {
      this.point.attributes[field] = value;
    }

  }

  public setPointVisibility(flag: boolean) : void {
    this.point.visible = flag;
  }

  public setAttributes(newAttributes: ImpGeofootprintLocAttrib[]) : void {
    const currentAttributes = new Set(this.attributes);
    const adds = newAttributes.filter(att => !currentAttributes.has(att));
    this.attributes = Array.from(newAttributes);
    for (const attribute of adds) {
      this.point.attributes[attribute.attributeCode] = attribute.attributeValue;
      this.point.popupTemplate.fieldInfos.push({ fieldName: attribute.attributeCode, label: attribute.attributeCode });
    }
  }
}
