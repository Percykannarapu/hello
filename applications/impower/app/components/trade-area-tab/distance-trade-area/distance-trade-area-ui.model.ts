import { TradeAreaMergeTypeCodes } from '../../../../worker-shared/data-model/impower.data-model.enums';

export interface DistanceTradeAreaUiModel {
  tradeAreas: TradeAreaModel[];
  mergeType: TradeAreaMergeTypeCodes;
  isReadOnly: boolean;
  analysisLevel: string;
  hasLocations: boolean;
}

export interface TradeAreaModel {
  radius: number | null;
  isActive: boolean;
  tradeAreaNumber: number;
}
