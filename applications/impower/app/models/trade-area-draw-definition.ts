export interface TradeAreaDrawDefinition {
  groupName: string;
  layerName: string;
  color: [number, number, number, number];
  buffer: number[];
  merge: boolean;
  centers: __esri.Point[];
}
