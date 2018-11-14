import { EsriRendererActions, EsriRendererActionTypes } from './esri.renderer.actions';


export interface EsriRendererState {
  numericShadingData: Array<{ geocode: string, data: number }>;
  textShadingData: Array<{ geocode: string, data: string }>;
  selectedGeocodes: Array<string>;
  highlightSelectedGeos: boolean;
}

const initialState: EsriRendererState = {
  numericShadingData: new Array<{ geocode: string, data: number }>(),
  textShadingData: new Array<{ geocode: string, data: string }>(),
  selectedGeocodes: new Array<string>(),
  highlightSelectedGeos: false
};

export function rendererReducer(state = initialState, action: EsriRendererActions) : EsriRendererState {
  switch (action.type) {
    case EsriRendererActionTypes.AddNumericShadingData:
      const numericDataMap: Map<string, number> = new Map<string, number>();
      for (const datum of action.payload) {
        numericDataMap.set(datum.geocode, datum.data);
      }
      const numericDataArr: Array<{ geocode: string, data: number }> = new Array<{ geocode: string, data: number }>();
      for (const key of Array.from(numericDataMap.keys())) {
        numericDataArr.push({ geocode: key, data: numericDataMap.get(key) });
      }
      return { ...state, numericShadingData: numericDataArr };
    case EsriRendererActionTypes.AddTextShadingData:
      const textDataMap: Map<string, string> = new Map<string, string>();
      for (const datum of action.payload) {
        textDataMap.set(datum.geocode, datum.data);
      }
      const textDataArr: Array<{ geocode: string, data: string }> = new Array<{ geocode: string, data: string }>();
      for (const key of Array.from(textDataMap.keys())) {
        textDataArr.push({ geocode: key, data: textDataMap.get(key) });
      }
      return { ...state, textShadingData: textDataArr };
    case EsriRendererActionTypes.ClearNumericShadingData:
      return {...state, numericShadingData: new Array<{geocode: string, data: number}>()};
    case EsriRendererActionTypes.ClearTextShadingData:
      return {...state, textShadingData: new Array<{geocode: string, data: string}>()};
    case EsriRendererActionTypes.AddSelectedGeos:
      return {...state, selectedGeocodes: action.payload};
    case EsriRendererActionTypes.ClearSelectedGeos:
      return {...state, selectedGeocodes: new Array<string>()};
    case EsriRendererActionTypes.HighlightSelectedGeos:
      return {...state, highlightSelectedGeos: action.payload};
    default:
      return state;
  }
}