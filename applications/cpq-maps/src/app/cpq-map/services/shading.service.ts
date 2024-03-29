import { Injectable } from '@angular/core';
import Color from '@arcgis/core/Color';
import { union } from '@arcgis/core/geometry/geometryEngine';
import Point from '@arcgis/core/geometry/Point';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Query from '@arcgis/core/rest/support/Query';
import { Store } from '@ngrx/store';
import { mapByExtended } from '@val/common';
import {
  ColorPalette,
  EsriLayerService,
  EsriMapService,
  EsriQueryService,
  EsriUtils,
  FillPattern,
  getColorPalette,
  LayerGroupDefinition
} from '@val/esri';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RfpUiEdit } from '../../val-modules/mediaexpress/models/RfpUiEdit';
import { RfpUiEditDetail } from '../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { LocalState } from '../state/index';
import { LegendData, NumericVariableShadingMethod, ShadingType, VarDefinition, VariableRanges } from '../state/app.interfaces';
import { SetVariableShading } from '../state/map-ui/map-ui.actions';
import { MapUIState } from '../state/map-ui/map-ui.reducer';
import { SetLegendData } from '../state/shared/shared.actions';
import { SharedState } from '../state/shared/shared.reducers';
import { ConfigService } from './config.service';

function formatNumber(value: number) {
  const localeOptions = {
    maximumFractionDigits: 2,
    useGrouping: true
  };
  return value.toLocaleString(window.navigator.language, localeOptions);
}

@Injectable({
  providedIn: 'root'
})
export class ShadingService {

  private sortMap: Map<string, number> = new Map<string, number>();
  private siteMap: Map<string, RfpUiEdit> = new Map<string, RfpUiEdit>();
  private zoomedFirstTime = false;

  constructor(private configService: ConfigService,
              private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private queryService: EsriQueryService,
              private store$: Store<LocalState>) { }

  private static getShadingGroupAttributeName(shadingMode: ShadingType) : string {
    switch (shadingMode) {
      case ShadingType.ZIP:
        return 'zip';
      case ShadingType.WRAP_ZONE:
        return 'wrap_name';
      case ShadingType.ATZ_INDICATOR:
        return 'atzind';
      case ShadingType.VARIABLE:
        return 'variableName';
      default:
        return 'siteName';
    }
  }

  private static getLegendTitle(shadingData: MapUIState) : string {
    switch (shadingData.shadingType) {
      case ShadingType.SITE:
        return 'Site Name';
      case ShadingType.ZIP:
        return 'Zip Code';
      case ShadingType.WRAP_ZONE:
        return 'Wrap Zone';
      case ShadingType.ATZ_INDICATOR:
        return 'ATZ Indicator';
      case ShadingType.VARIABLE:
        return shadingData.selectedVarName;
    }
  }

  initializeVariables(details: RfpUiEditDetail[]) : VarDefinition[] {
    const arbitrary = details[0];
    const definitions: VarDefinition[] = [];
    if (arbitrary.var1Name != null) {
      const var1: VarDefinition = { name: arbitrary.var1Name, isNumber: (arbitrary.var1IsNumber === 1) };
      if (arbitrary.var1IsNumber) {
        const var1Values = details.filter(d => d.isSelected && d.var1Value != null).map(d => Number(d.var1Value));
        var1.minValue = Math.min(...var1Values);
        var1.maxValue = Math.max(...var1Values);
      }
      definitions.push(var1);
    }
    if (arbitrary.var2Name != null) {
      const var2: VarDefinition = { name: arbitrary.var2Name, isNumber: (arbitrary.var2IsNumber === 1) };
      if (arbitrary.var2IsNumber) {
        const var2Values = details.filter(d => d.isSelected && d.var2Value != null).map(d => Number(d.var2Value));
        var2.minValue = Math.min(...var2Values);
        var2.maxValue = Math.max(...var2Values);
      }
      definitions.push(var2);
    }
    if (arbitrary.var3Name != null) {
      const var3: VarDefinition = { name: arbitrary.var3Name, isNumber: (arbitrary.var3IsNumber === 1) };
      if (arbitrary.var3IsNumber) {
        const var3Values = details.filter(d => d.isSelected && d.var3Value != null).map(d => Number(d.var3Value));
        var3.minValue = Math.min(...var3Values);
        var3.maxValue = Math.max(...var3Values);
      }
      definitions.push(var3);
    }
    return definitions;
  }

  setShader(shared: SharedState, shadingData: MapUIState, edits: RfpUiEdit[], details: RfpUiEditDetail[], createLayer: boolean) : Observable<__esri.Graphic[]> {
    this.sortMap.clear();
    if (createLayer) {
      return this.createShadingDetails(shared, shadingData, edits, details);
    } else {
      return this.editShadingDetails(shadingData, shared, edits, details);
    }
  }

  private createShadingDetails(shared: SharedState, shadingData: MapUIState, edits: RfpUiEdit[], details: RfpUiEditDetail[]) : Observable<__esri.Graphic[]> {
    this.generateSiteGeoMap(edits, details);
    return this.generateGraphics(shared.analysisLevel, details).pipe(
      tap(graphics => this.enrichGraphics(graphics, shadingData, details)),
      tap(graphics => this.generateLegend(shared, graphics, shadingData, edits, details)),
      tap(graphics => this.zoomOnStartup(graphics)),
    );
  }

  private editShadingDetails(shadingData: MapUIState, shared: SharedState, edits: RfpUiEdit[], details: RfpUiEditDetail[]) : Observable<__esri.Graphic[]> {
    return this.getCurrentGraphics().pipe(
      tap(graphics => this.enrichGraphics(graphics, shadingData, details)),
      tap(graphics => this.generateLegend(shared, graphics, shadingData, edits, details)),
    );
  }

  private generateSiteGeoMap(edits: RfpUiEdit[], details: RfpUiEditDetail[]) : void {
    this.siteMap.clear();
    const siteRefsByFk: Map<number, RfpUiEdit> = mapByExtended(edits, e => e.siteId);
    for (const detail of details) {
      if (siteRefsByFk.has(detail.fkSite)) {
        this.siteMap.set(detail.geocode, siteRefsByFk.get(detail.fkSite));
      } else {
        throw new Error('Site identified in Details is missing in Edits');
      }
    }
  }

  private generateGraphics(analysisLevel: string, details: RfpUiEditDetail[]) : Observable<__esri.Graphic[]> {
    const queryLayer = this.configService.layers[analysisLevel].boundaries.id;
    const geocodes = details.map(d => `'${d.geocode}'`);
    const query: __esri.Query = new Query();
    query.outFields = ['geocode, zip, atz, atzind, wrap_name'];
    query.where = `geocode in (${geocodes.join(',')})`;
    return this.queryService.executeNativeQuery(queryLayer, query, true).pipe(
      map(featureSet => featureSet.features)
    );
  }

  private getCurrentGraphics() : Observable<__esri.Graphic[]> {
    const layer = this.layerService.getGraphicsLayer('Selected Geos');
    return of(layer.graphics.toArray());
  }

  private enrichGraphics(graphics: __esri.Graphic[], shadingData: MapUIState, details: RfpUiEditDetail[]) : void {
    const detailsByGeocode = mapByExtended(details, d => d.geocode);
    const shadingAttribute = ShadingService.getShadingGroupAttributeName(shadingData.shadingType);
    for (const graphic of graphics) {
      const currentGeocode = graphic.getAttribute('geocode');
      this.assignSiteId(graphic);
      if (detailsByGeocode.has(currentGeocode)) {
        this.assignDemographicMetadata(graphic, detailsByGeocode.get(currentGeocode), shadingData);
      }
      const shadingValue = graphic.getAttribute(shadingAttribute);
      graphic.setAttribute('SHADING_GROUP', shadingValue == null ? 'Unknown' : shadingValue);
    }
  }

  private assignSiteId(graphic: __esri.Graphic) : void {
    const currentGeocode = graphic.getAttribute('geocode');
    if (currentGeocode != null) {
      if (this.siteMap.has(currentGeocode)) {
        graphic.setAttribute('siteId', this.siteMap.get(currentGeocode)['@ref'].toString());
        graphic.setAttribute('siteName', this.siteMap.get(currentGeocode).siteName);
      } else {
        throw new Error('Layer Query returned a geocode the siteMap could not match');
      }
    } else {
      throw new Error('Layer Query returned a feature without a geocode');
    }
  }

  private assignDemographicMetadata(graphic: __esri.Graphic, detail: RfpUiEditDetail, shadingData: MapUIState) {
    graphic.setAttribute('householdCount', detail.distribution);
    let varName;
    switch (shadingData.selectedVarName) {
      case detail.var1Name:
        if (detail.var1IsNumber) {
          const var1 = detail.var1Value == null ? null : Number(detail.var1Value);
          varName = this.getVariableName(var1, shadingData.classifications);
        } else {
          varName = detail.var1Value;
        }
        break;
      case detail.var2Name:
        if (detail.var2IsNumber) {
          const var2 = detail.var2Value == null ? null : Number(detail.var2Value);
          varName = this.getVariableName(var2, shadingData.classifications);
        } else {
          varName = detail.var2Value;
        }
        break;
      case detail.var3Name:
        if (detail.var3IsNumber) {
          const var3 = detail.var3Value == null ? null : Number(detail.var3Value);
          varName = this.getVariableName(var3, shadingData.classifications);
        } else {
          varName = detail.var3Value;
        }
        break;
      default:
        varName = '';
    }
    graphic.setAttribute('variableName', varName);
    graphic.visible = detail.isSelected;
  }

  private getVariableName(value: number, classes: VariableRanges[]) : string {
    if (value == null) {
      this.sortMap.set('Unknown', 999);
      return 'Unknown';
    }
    for (let i = 0; i < classes.length; ++i) {
      const currentClass = classes[i];
      const currentMin = currentClass.minValue == null ? Number.NEGATIVE_INFINITY : currentClass.minValue;
      const currentMax = currentClass.maxValue == null ? Number.POSITIVE_INFINITY : currentClass.maxValue;
      if (value < currentMin || value > currentMax) continue;
      let result: string;
      if (currentClass.minValue == null) {
        const maxRepresentation = formatNumber(currentClass.maxValue);
        result = ` < ${maxRepresentation}`;
      } else if (currentClass.maxValue == null) {
        const minRepresentation = formatNumber(currentClass.minValue);
        result = ` > ${minRepresentation}`;
      } else {
        const minRepresentation = formatNumber(currentClass.minValue);
        const maxRepresentation = formatNumber(currentClass.maxValue);
        result = `${minRepresentation} - ${maxRepresentation}`;
      }
      if (!this.sortMap.has(result)) this.sortMap.set(result, i);
      return result;
    }
    throw new Error('Error generating variable suffix');
  }

  public generateLegend(shared: SharedState, graphics: __esri.Graphic[], shadingData: MapUIState, siteData: RfpUiEdit[], siteDetails: RfpUiEditDetail[]) : void {
    const legend = new Map<string, { color: number[], hhc: number }>();
    let palette = getColorPalette(shadingData.selectedPalette, false, true);
    if (palette == null) palette = getColorPalette(ColorPalette.CpqMaps, false);
    const layerId = this.configService.layers[shared.analysisLevel].boundaries.id;
    const layers = this.layerService.getPortalLayersById(layerId);
    const shadingGroup = this.layerService.getGroup('Shading');
    const layer = layers.filter(l => l['parent'] !== shadingGroup)[0];
    graphics.sort((a, b) => {
      const groupA: string = a.getAttribute('SHADING_GROUP');
      const groupB: string = b.getAttribute('SHADING_GROUP');
      if (groupA === 'Unknown') return 1;
      if (groupB === 'Unknown') return -1;
      if (this.sortMap.has(groupA) && this.sortMap.has(groupB)) {
        return this.sortMap.get(groupA) - this.sortMap.get(groupB);
      } else {
        return groupA.localeCompare(groupB);
      }
    });
    for (const graphic of graphics) {
      if (!legend.has(graphic.getAttribute('SHADING_GROUP'))) {
        const newColor = [...palette[legend.size % palette.length]];
        newColor.push(this.configService.defaultShadingTransparency);
        legend.set(graphic.getAttribute('SHADING_GROUP'), { color: newColor, hhc: 0 } );
      }
      // update the graphic color to match the legend
      const newSymbol = ((layer.renderer as __esri.SimpleRenderer).symbol as __esri.SimpleFillSymbol).clone();
      const legendInfo = legend.get(graphic.getAttribute('SHADING_GROUP'));
      newSymbol.color = new Color(legendInfo.color);
      graphic.symbol = newSymbol;
      if (graphic.visible) {
        legendInfo.hhc += Number(graphic.getAttribute('householdCount'));
      }
    }
    const legendSettings: LegendData[] = [];
    legend.forEach((v, k) => {
      if (this.sortMap.has(k)) {
        legendSettings.push({ groupName: k, color: v.color, hhc: v.hhc, sortOrder: this.sortMap.get(k) });
      } else {
        legendSettings.push({ groupName: k, color: v.color, hhc: v.hhc });
      }
    });

    if ((shadingData.shadeAnne || shadingData.shadeSolo)) {
      if (shared.radius != null && shared.radius > 0) {
        const promoEndDate = new Date(shared.promoDateTo);
        const countAttr = promoEndDate.getMonth() >= 4 && promoEndDate.getMonth() <= 8 ? 'hhld_s' : 'hhld_w';
        const points = siteData.map(s => new Point({ latitude: s.siteLat, longitude: s.siteLong }));
        const hhCountMap = mapByExtended(siteDetails, s => s.geocode, s => s.distribution);
        const selectedGeos = new Set(siteDetails.filter(s => s.isSelected).map(s => s.geocode));
        this.queryService.queryPointWithBuffer(layerId, points, shared.radius, false, ['geocode', 'owner_group_primary', 'cov_frequency', 'hhld_w', 'hhld_s', 'latitude', 'longitude'])
          .subscribe(results => {
            let anneCount = 0;
            let soloCount = 0;
            results.forEach(r => {
              const currentPoint = new Point({ latitude: r.attributes.latitude, longitude: r.attributes.longitude });
              const useResult = points.some(p => EsriUtils.getDistance(p, currentPoint) <= shared.radius) && !selectedGeos.has(r.attributes.geocode);
              if (useResult) {
                if (r.attributes.owner_group_primary === 'ANNE') anneCount += hhCountMap.get(r.attributes.geocode) || Number(r.attributes[countAttr]);
                if (r.attributes.cov_frequency === 'Solo') soloCount += hhCountMap.get(r.attributes.geocode) || Number(r.attributes[countAttr]);
              }
            });
            if (shadingData.shadeAnne) {
              legendSettings.push({ groupName: 'ANNE Geographies', hhc: anneCount, image: shadingData.annePattern, sortOrder: 0 });
            }
            if (shadingData.shadeSolo) {
              legendSettings.push({ groupName: 'Solo Geographies', hhc: soloCount, image: shadingData.soloPattern, sortOrder: 1 });
            }
            this.store$.dispatch(new SetLegendData({ legendData: legendSettings, legendTitle: ShadingService.getLegendTitle(shadingData) }));
          });
      } else {
        if (shadingData.shadeAnne) {
          legendSettings.push({ groupName: 'ANNE Geographies', hhc: null, image: shadingData.annePattern, sortOrder: 0 });
        }
        if (shadingData.shadeSolo) {
          legendSettings.push({ groupName: 'Solo Geographies', hhc: null, image: shadingData.soloPattern, sortOrder: 1 });
        }
        this.store$.dispatch(new SetLegendData({ legendData: legendSettings, legendTitle: ShadingService.getLegendTitle(shadingData) }));
      }
    } else {
      this.store$.dispatch(new SetLegendData({ legendData: legendSettings, legendTitle: ShadingService.getLegendTitle(shadingData) }));
    }
  }

  private zoomOnStartup(graphics: __esri.Graphic[]) {
    if (!this.zoomedFirstTime) {
      this.mapService.mapView.extent = union(graphics.map(g => g.geometry)).extent;
      this.zoomedFirstTime = true;
    }
  }

  calculateEqualIntervals(payload: {breakCount: number, selectedVar: VarDefinition, selectedNumericMethod: NumericVariableShadingMethod, classBreakValues: number[], isRowCheckOrUncheck?: boolean}) {
    let classBreakValues = payload.selectedNumericMethod != NumericVariableShadingMethod.CustomClassifications ? [80, 120, 140] : payload.classBreakValues;
    const interval = (payload.selectedVar.maxValue - payload.selectedVar.minValue) / payload.breakCount;
    if (payload.selectedNumericMethod != NumericVariableShadingMethod.StandardIndex && payload.selectedNumericMethod != NumericVariableShadingMethod.CustomClassifications){
      classBreakValues = [];
      for (let i = 0; i < payload.breakCount - 1; ++i) {
        const currentBreak = (interval * (i + 1)) + payload.selectedVar.minValue;
        classBreakValues.push(currentBreak);
      }
      if (payload.isRowCheckOrUncheck != null && payload.isRowCheckOrUncheck){
        const classifications: VariableRanges[] = [];
        classifications.push({ minValue: null, maxValue: classBreakValues[0] });
        for (let i = 1; i < classBreakValues.length; ++i) {
          classifications.push({ minValue: classBreakValues[i - 1], maxValue: classBreakValues[i] });
        }
        classifications.push({ minValue: classBreakValues[classBreakValues.length - 1], maxValue: null });
        this.store$.dispatch(new SetVariableShading({ classifications, selectedVarName: payload.selectedVar.name }));
      }
    }

    return {classBreakValues: classBreakValues, breakCount: payload.breakCount, selectedVar: payload.selectedVar,
            selectedNumericMethod: payload.selectedNumericMethod};
  }

  public setupCrossHatchLayer(layerConfig: LayerGroupDefinition, layerName: string, group: __esri.GroupLayer, expression: string, showLayer: boolean, recreateLayer: boolean, pattern: FillPattern) : void {
    const foundLayer = this.layerService.getFeatureLayer(layerName);

    if (foundLayer != null) {
      foundLayer.visible = showLayer;
      return;
    }

    if (recreateLayer == false) return;

    const layerProps: Partial<__esri.FeatureLayer> = {
      legendEnabled : false,
      labelsVisible : false,
      popupEnabled : false,
      renderer : new UniqueValueRenderer({
        defaultSymbol: new SimpleFillSymbol({ color: [0, 0, 0, 0], outline: { color: [0, 0, 0, 0] } }),
        uniqueValueInfos: [{
          value: 1,
          symbol: new SimpleFillSymbol({
            style: pattern,
            color: [0, 0, 0, 0.5]
          })
        }],
        valueExpression: expression,
      })
    };

    this.layerService.createPortalLayer(layerConfig.boundaries.id, layerName, layerConfig.boundaries.minScale, showLayer, layerProps)
      .subscribe(newLayer => group.add(newLayer));
  }

}
