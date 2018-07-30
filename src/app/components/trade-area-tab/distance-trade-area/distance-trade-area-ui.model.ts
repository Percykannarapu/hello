import { TradeAreaMergeTypeCodes } from '../../../val-modules/targeting/targeting.enums';

export interface DistanceTradeAreaUiModel {
  tradeAreas: TradeAreaModel[];
  mergeType: TradeAreaMergeTypeCodes;
}

export interface TradeAreaModel {
  radius: number | null;
  isShowing: boolean;
  isApplied: boolean;
}
