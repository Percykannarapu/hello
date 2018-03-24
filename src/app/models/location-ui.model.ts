import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { EsriModules } from '../esri-modules/core/esri-modules.service';

export class LocationUiModel {

  private static starPath: string = 'M 240.000 260.000 L 263.511 272.361 L 259.021 246.180 L 278.042 227.639 L 251.756 223.820 L 240.000 200.000 L 228.244 223.820 L 201.958 227.639 L 220.979 246.180 L 216.489 272.361 L 240.000 260.000';
  private static red = [255, 0, 0];
  private static blue = [35, 93, 186];

  public point: __esri.Graphic;

  constructor(public location: ImpGeofootprintLocation, public attributes?: ImpGeofootprintLocAttrib[], private popupTemplate?: string, private popupTitle?: string, ) {
    if (this.attributes == null) this.attributes = [];
    this.initGraphic();
  }

  private initGraphic() : void {
    const currentColor = new EsriModules.Color((this.location.impClientLocationType && this.location.impClientLocationType.clientLocationType === 'Site') ? LocationUiModel.blue : LocationUiModel.red);
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
    const popupTemplate: __esri.PopupTemplate = new EsriModules.PopupTemplate({
      title: (this.popupTitle == null ? this.location.locationName : this.popupTitle),
      content: (this.popupTemplate == null ? '{*}' : this.popupTemplate)
    });
    this.point = new EsriModules.Graphic({
      geometry: point,
      symbol: symbol,
      popupTemplate: popupTemplate,
      visible: (this.location.isActive === true)
    });
    this.setAttributes(this.attributes);
  }

  public setPointVisibility(flag: boolean) : void {
    this.point.visible = flag;
  }

  public setAttributes(newAttributes: ImpGeofootprintLocAttrib[]) : void {
    this.attributes = Array.from(newAttributes);
    this.point.attributes = {
      parentId: this.location.locationNumber
    };
    for (const attribute of newAttributes) {
      this.point.attributes[attribute.attributeCode] = attribute.attributeValue;
    }
  }
}
