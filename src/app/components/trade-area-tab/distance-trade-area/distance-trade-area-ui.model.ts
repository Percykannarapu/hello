import { TradeAreaMergeSpec } from '../../../services/app-trade-area.service';

export interface DistanceTradeAreaUiModel {
  tradeAreas: TradeAreaModel[];
  mergeType: TradeAreaMergeSpec;
}

export interface TradeAreaModel {
  radius: number | null;
  isShowing: boolean;
  isApplied: boolean;
}
