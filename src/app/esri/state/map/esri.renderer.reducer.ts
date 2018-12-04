import { EsriRendererActions, EsriRendererActionTypes } from './esri.renderer.actions';

export interface EsriHighlightRemover { 
  remove: () => void;
}
export interface EsriHighlightHandler { 
  geocode: string; 
  remover: EsriHighlightRemover; 
}

export interface NumericShadingData {
  geocode: string;
  data: number;
}

export interface TextShadingData {
  geocode: string;
  data: string;
}

export interface Statistics {
  mean: number;
  sum: number;
  min: number;
  max: number;
  variance: number;
  stdDeviation: number;
}

export interface EsriRendererState {
  numericShadingData: Array<NumericShadingData>;
  textShadingData: Array<TextShadingData>;
  selectedGeocodes: Array<string>;
  highlightSelectedGeos: boolean;
  highlightHandlers: Array<EsriHighlightHandler>;
  statistics: Statistics;
  enableShading: boolean;
}

const initialState: EsriRendererState = {
  numericShadingData: new Array<NumericShadingData>(),
  textShadingData: new Array<TextShadingData>(),
  selectedGeocodes: new Array<string>(),
  highlightSelectedGeos: false,
  highlightHandlers: new Array<EsriHighlightHandler>(),
  statistics: null,
  enableShading: false
};

export function rendererReducer(state = initialState, action: EsriRendererActions) : EsriRendererState {
  switch (action.type) {
    case EsriRendererActionTypes.AddNumericShadingData:
      const numericDataMap: Map<string, number> = new Map<string, number>();
      for (const datum of action.payload) {
        numericDataMap.set(datum.geocode, datum.data);
      }
      const numericDataArr: Array<NumericShadingData> = new Array<NumericShadingData>();
      for (const key of Array.from(numericDataMap.keys())) {
        numericDataArr.push({ geocode: key, data: numericDataMap.get(key) });
      }
      return { ...state, numericShadingData: numericDataArr };
    case EsriRendererActionTypes.AddTextShadingData:
      const textDataMap: Map<string, string> = new Map<string, string>();
      for (const datum of action.payload) {
        textDataMap.set(datum.geocode, datum.data);
      }
      const textDataArr: Array<TextShadingData> = new Array<TextShadingData>();
      for (const key of Array.from(textDataMap.keys())) {
        textDataArr.push({ geocode: key, data: textDataMap.get(key) });
      }
      return { ...state, textShadingData: textDataArr };
    case EsriRendererActionTypes.ClearNumericShadingData:
      return {...state, numericShadingData: new Array<NumericShadingData>()};
    case EsriRendererActionTypes.ClearTextShadingData:
      return {...state, textShadingData: new Array<TextShadingData>()};
    case EsriRendererActionTypes.AddSelectedGeos:
      return {...state, selectedGeocodes: action.payload};
    case EsriRendererActionTypes.ClearSelectedGeos:
      return {...state, selectedGeocodes: new Array<string>()};
    case EsriRendererActionTypes.HighlightSelectedGeos:
      return {...state, highlightSelectedGeos: action.payload};
    case EsriRendererActionTypes.AddHighlightHandlers:
      return {...state, highlightHandlers: action.payload};
    case EsriRendererActionTypes.ClearHighlightHandlers:
      return {...state, highlightHandlers: new Array<EsriHighlightHandler>()};
    case EsriRendererActionTypes.AddStatistics:
      return {...state, statistics: action.payload};
    case EsriRendererActionTypes.EnableShading:
      return {...state, enableShading: action.payload};
    default:
      return state;
  }
}