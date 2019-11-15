import { ColorPalette } from '@val/esri';
import { RenderingActions, RenderingActionTypes } from './rendering.actions';

export interface RenderingState {
  lastRadiusRenderCount: number;
  lastAudienceRenderCount: number;
  currentPalette: ColorPalette;
  legacyRenderingEnabled: boolean;
}

export const initialState: RenderingState = {
  lastRadiusRenderCount: 0,
  lastAudienceRenderCount: 0,
  currentPalette: ColorPalette.EsriPurple,
  legacyRenderingEnabled: false
};

export function renderingReducer(state = initialState, action: RenderingActions) : RenderingState {
  switch (action.type) {
    case RenderingActionTypes.ClearTradeAreas:
      return {
        ...state,
        ...initialState
      };
    case RenderingActionTypes.RenderAudienceTradeAreas:
      const audienceCount = action.payload == null ? 0 : (action.payload.tradeAreas || []).length;
      return {
        ...state,
        lastAudienceRenderCount: audienceCount
      };
    case RenderingActionTypes.RenderRadiusTradeAreas:
      const radiusCount = action.payload == null ? 0 : (action.payload.tradeAreas || []).length;
      return {
        ...state,
        lastRadiusRenderCount: radiusCount
      };
    case RenderingActionTypes.SetPalette:
      return {
        ...state,
        currentPalette: action.payload.palette
      };
    case RenderingActionTypes.SetLegacyRenderingEnable:
      return {
        ...state,
        legacyRenderingEnabled: action.payload.isEnabled
      };
    default:
      return state;
  }
}
