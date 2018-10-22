import { SelectedButtonTypeCodes } from '../../core/esri.enums';
import { EsriMapActions, EsriMapActionTypes } from './esri.map.actions';
import { EsriMapToolbarButtonActionTypes } from './esri.map-button.actions';

export interface EsriMapState {
  mapIsInitializing: boolean;
  mapIsReady: boolean;
  mapInitializationError: any;
  selectedButton: SelectedButtonTypeCodes;
  containerHeight: number;
  mapViewpoint: __esri.Viewpoint;
  popupsVisible: boolean;
  sketchView: __esri.SketchViewModel;
  selectedFeatures: __esri.Graphic[];
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
  selectedFeatures: []
};

export function mapReducer(state = initialState, action: EsriMapActions) : EsriMapState {
  switch (action.type) {
    // Initialization/startup actions
    case EsriMapActionTypes.InitializeMap:
      return { ...state, mapIsInitializing: true };
    case EsriMapActionTypes.InitializeMapFailure:
      return { ...state, mapIsInitializing: false, mapInitializationError: action.payload.errorResponse };
    case EsriMapActionTypes.InitializeMapSuccess:
      return { ...state, mapIsInitializing: false, mapIsReady: true };

    // toolbar buttons and button-related actions
    case EsriMapToolbarButtonActionTypes.MeasureDistanceSelected:
      return { ...state, selectedButton: SelectedButtonTypeCodes.MeasureDistance };
    case EsriMapToolbarButtonActionTypes.PopupButtonSelected:
      return { ...state, selectedButton: SelectedButtonTypeCodes.ShowPopups };
    case EsriMapToolbarButtonActionTypes.SelectMultiPolySelected:
      return { ...state, selectedButton: SelectedButtonTypeCodes.SelectMultiplePolys };
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
      return { ...state, mapViewpoint: action.payload.newViewpoint };
    case EsriMapActionTypes.SetPopupVisibility:
      return { ...state, popupsVisible: action.payload.isVisible };

    // Other actions
    case EsriMapActionTypes.FeaturesSelected:
      return { ...state, selectedFeatures: [ ...action.payload.features ] };
    default:
      return state;
  }
}
