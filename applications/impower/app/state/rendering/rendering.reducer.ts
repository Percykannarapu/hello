import { RenderingActions, RenderingActionTypes } from './rendering.actions';

export interface RenderingState {
  lastRadiusRenderCount: number;
  lastAudienceRenderCount: number;
  radiusTradeAreasRendering: boolean;
  audienceTradeAreasRendering: boolean;
}

export const initialState: RenderingState = {
  lastRadiusRenderCount: 0,
  lastAudienceRenderCount: 0,
  radiusTradeAreasRendering: false,
  audienceTradeAreasRendering: false,
};

export function renderingReducer(state = initialState, action: RenderingActions) : RenderingState {
  switch (action.type) {
    case RenderingActionTypes.RenderAudienceTradeAreasComplete:
      return {
        ...state,
        audienceTradeAreasRendering: false,
      };
    case RenderingActionTypes.RenderRadiusTradeAreasComplete:
      return {
        ...state,
        radiusTradeAreasRendering: false,
      };
    case RenderingActionTypes.RenderAudienceTradeAreas:
      const audienceCount = action.payload == null ? 0 : (action.payload.tradeAreas || []).length;
      return {
        ...state,
        lastAudienceRenderCount: audienceCount,
        audienceTradeAreasRendering: true,
      };
    case RenderingActionTypes.RenderRadiusTradeAreas:
      const radiusCount = action.payload == null ? 0 : (action.payload.tradeAreas || []).length;
      return {
        ...state,
        lastRadiusRenderCount: radiusCount,
        radiusTradeAreasRendering: true,
      };
    default:
      return state;
  }
}
