import { groupByExtended, toUniversalCoordinates } from '@val/common';
import { EsriApi } from '@val/esri';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes } from '../../val-modules/targeting/targeting.enums';

export class TradeAreaDrawDefinition {
  groupName: string;
  layerName: string;
  buffer: number[] = [];
  centers: __esri.Point[] = [];

  constructor(siteType: SuccessfulLocationTypeCodes, layerSuffix: string, public color: [number, number, number, number], public merge: boolean) {
    this.groupName = `${siteType}s`;
    this.layerName = `${siteType} - ${layerSuffix}`;
  }
}

function toPoint(tradeArea: ImpGeofootprintTradeArea, wkid: number) : __esri.Point {
  const coordinates = toUniversalCoordinates(tradeArea.impGeofootprintLocation);
  return new EsriApi.Point({ spatialReference: { wkid }, ...coordinates });
}

export function prepareRadiusTradeAreas(tradeAreas: ImpGeofootprintTradeArea[], currentProject: ImpProject, wkid: number) : TradeAreaDrawDefinition[] {
  const result: TradeAreaDrawDefinition[] = [];
  const siteMergeMap = new Map<SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes>([
    [ImpClientLocationTypeCodes.Site, TradeAreaMergeTypeCodes.parse(currentProject.taSiteMergeType)],
    [ImpClientLocationTypeCodes.Competitor, TradeAreaMergeTypeCodes.parse(currentProject.taCompetitorMergeType)]
  ]);
  const usableTradeAreas = tradeAreas.filter(ta => ta.impGeofootprintLocation != null); // This filter is already applied to the observable that starts this process,
                                                                                                  // but the re-homegeocode process is breaking it somehow
  const siteGroups = groupByExtended(usableTradeAreas, ta => ImpClientLocationTypeCodes.parseAsSuccessful(ta.impGeofootprintLocation.clientLocationTypeCode));
  siteGroups.forEach((tas, siteType) => {
    const mergeType = siteMergeMap.get(siteType);
    const maxTaNum = Math.max(...tas.map(ta => ta.taNumber));
    const usableTas = mergeType === TradeAreaMergeTypeCodes.MergeAll ? tas.filter(ta => ta.taNumber === maxTaNum) : tas;
    const layerGroups = groupByExtended(usableTas, ta => ta.taName);
    layerGroups.forEach((layerTradeAreas, layerName) => {
      const currentResult = new TradeAreaDrawDefinition(siteType, layerName, siteType === 'Site' ? [0, 0, 255, 1] : [255, 0, 0, 1], mergeType !== TradeAreaMergeTypeCodes.NoMerge);
      layerTradeAreas.forEach(ta => {
        if (ta.taRadius != null) {
          currentResult.buffer.push(ta.taRadius);
          currentResult.centers.push(toPoint(ta, wkid));
        }
      });
      result.push(currentResult);
    });
  });
  return result;
}

export function prepareAudienceTradeAreas(tradeAreas: ImpGeofootprintTradeArea[], currentProject: ImpProject, wkid: number) : TradeAreaDrawDefinition[] {
  const minRadius = currentProject.audTaMinRadiu;
  const maxRadius = currentProject.audTaMaxRadiu;
  const minLayer = new TradeAreaDrawDefinition(ImpClientLocationTypeCodes.Site, 'Audience Min Radius', [0, 0, 255, 1], false);
  const maxLayer = new TradeAreaDrawDefinition(ImpClientLocationTypeCodes.Site, 'Audience Max Radius', [0, 0, 255, 1], false);
  tradeAreas.forEach(ta => {
    const currentPoint = toPoint(ta, wkid);
    minLayer.buffer.push(minRadius);
    minLayer.centers.push(currentPoint);
    maxLayer.buffer.push(maxRadius);
    maxLayer.centers.push(currentPoint.clone());
  });
  return [minLayer, maxLayer];
}