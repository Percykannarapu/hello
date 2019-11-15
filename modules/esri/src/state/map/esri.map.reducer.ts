import { SelectedButtonTypeCodes } from '../../core/esri.enums';
import { EsriMapActions, EsriMapActionTypes } from './esri.map.actions';
import { EsriMapToolbarButtonActionTypes } from './esri.map-button.actions';

export interface EsriLabelConfiguration {
  //font: string;
  size: number;
  enabled: boolean;
  pobEnabled: boolean;
  siteEnabled: boolean;
}

export interface EsriLabelLayerOptions {
  expression: string;
  fontSizeOffset: number;
  colorOverride?: {a: number, r: number, g: number, b: number};
}

export interface EsriMapState {
  mapIsInitializing: boolean;
  mapIsReady: boolean;
  mapInitializationError: any;
  selectedButton: SelectedButtonTypeCodes;
  containerHeight: number;
  mapViewpoint: string;
  popupsVisible: boolean;
  sketchView: __esri.SketchViewModel;
  selectedFeatures: __esri.Graphic[];
  selectedLayerId: string;
  labelConfiguration: EsriLabelConfiguration;
  layerExpressions: {
    [layerId: string] : EsriLabelLayerOptions
  };
}

const initialState: EsriMapState = {
  mapIsInitializing: false,
  mapIsReady: false,
  mapInitializationError: null,
  selectedButton: SelectedButtonTypeCodes.ShowPopups,
  containerHeight: 400,
  mapViewpoint: null,
  popupsVisible: true,
  sketchView: null,
  selectedFeatures: [],
  selectedLayerId: null,
  labelConfiguration: {
    //font: 'sans-serif',
    size: 10,
    enabled: true,
    pobEnabled: false,
    siteEnabled: true,
  },
  layerExpressions: {}
};

export function mapReducer(state = initialState, action: EsriMapActions) : EsriMapState {
  switch (action.type) {
    case EsriMapActionTypes.ResetMapState:
      return {
        ...initialState,
        containerHeight: state.containerHeight,
        mapViewpoint: state.mapViewpoint,
        mapIsReady: state.mapIsReady
      };
    // Initialization/startup actions
    case EsriMapActionTypes.InitializeMap:
      return { ...state, mapIsInitializing: true };
    case EsriMapActionTypes.InitializeMapFailure:
      return { ...state, mapIsInitializing: false, mapInitializationError: action.payload.errorResponse };
    case EsriMapActionTypes.InitializeMapSuccess:
      return { ...state, mapIsInitializing: false, mapIsReady: true };

    // toolbar buttons and button-related actions
    case EsriMapToolbarButtonActionTypes.XYButtonSelected:
      return { ...state, selectedButton: SelectedButtonTypeCodes.XY };
    case EsriMapToolbarButtonActionTypes.MeasureDistanceSelected:
      return { ...state, selectedButton: SelectedButtonTypeCodes.MeasureDistance };
    case EsriMapToolbarButtonActionTypes.PopupButtonSelected:
      return { ...state, selectedButton: SelectedButtonTypeCodes.ShowPopups };
    case EsriMapToolbarButtonActionTypes.SelectMultiPolySelected:
      return { ...state, selectedButton: SelectedButtonTypeCodes.SelectMultiplePolys };
    case EsriMapToolbarButtonActionTypes.UnselectMultiPolySelected:
      return { ...state, selectedButton: SelectedButtonTypeCodes.UnselectMultiplePolys };
    case EsriMapToolbarButtonActionTypes.SelectSinglePolySelected:
      return { ...state, selectedButton: SelectedButtonTypeCodes.SelectSinglePoly };
    case EsriMapToolbarButtonActionTypes.StartSketchView:
      return { ...state, sketchView: action.payload.model };
    case EsriMapToolbarButtonActionTypes.ClearSketchView:
      return { ...state, sketchView: null };

    // Map Settings actions
    case EsriMapActionTypes.SetMapHeight:
      return { ...state, containerHeight: action.payload.newMapHeight };
    case EsriMapActionTypes.SetMapViewPoint:
      return { ...state, mapViewpoint: action.payload.newViewpointJson };
    case EsriMapActionTypes.SetPopupVisibility:
      return { ...state, popupsVisible: action.payload.isVisible };
    case EsriMapActionTypes.SetLabelConfiguration:
      return { ...state, labelConfiguration: { ...action.payload.labelConfiguration } };
    case EsriMapActionTypes.SetLayerLabelExpressions:
      return { ...state, layerExpressions: { ...action.payload.expressions } };

    // Other actions
    case EsriMapActionTypes.HideLabels:
      return { ...state, labelConfiguration: { ...state.labelConfiguration, enabled: false}};
    case EsriMapActionTypes.ShowLabels:
      return { ...state, labelConfiguration: { ...state.labelConfiguration, enabled: true}};
    case EsriMapActionTypes.FeaturesSelected:
      return { ...state, selectedFeatures: [ ...action.payload.features] };
    case EsriMapActionTypes.SetSelectedLayer:
      return {...state, selectedLayerId: action.payload.layerId};
    default:
      return state;
  }
}
