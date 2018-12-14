import { TransientActions, TransientActionTypes } from './transient.actions';
import { TransientVarDefinition } from '../models/transient-var-definition';

// TODO: Once we upgrade to TS 2.8+ this can go away, and we can use Record<number, T>
interface NumericRecord<T> { [key: number] : T; }

export interface State {
  definitions: number[];
  definitionEntities: { [key: number] : TransientVarDefinition };
  geoData: Record<string, NumericRecord<string | number>>;
}

export const initialState: State = {
  definitions: [],
  definitionEntities: {},
  geoData: {},
};

export function reducer(state = initialState, action: TransientActions) : State {
  switch (action.type) {
    case TransientActionTypes.AddTransientDefinition:
      return {
        ...state,
        definitions: [...state.definitions, action.payload.definition.pk],
        definitionEntities: {
          ...state.definitionEntities,
          [action.payload.definition.pk]: action.payload.definition
        }
      };
    case TransientActionTypes.AddTransientGeoData:
      Object.entries(action.payload.data).forEach(([geocode, data]: [string, string | number]) => {
        state.geoData[geocode] = {
          ...state.geoData[geocode],
          [action.payload.definitionPk]: data
        };
      });
      return {
        ...state,
        geoData: {
          ...state.geoData,
        }
      };
    case TransientActionTypes.ClearTransientDefinitions:
      return {
        ...state,
        definitions: initialState.definitions,
        definitionEntities: initialState.definitionEntities
      };
    case TransientActionTypes.ClearTransientGeoData:
      return {
        ...state,
        geoData: initialState.geoData
      };
    case TransientActionTypes.DeleteTransientDefinitions:
      const toBeRemoved = new Set(action.payload.definitionPks);
      action.payload.definitionPks.forEach(pk => {
        delete state.definitionEntities[pk];
      });
      return {
        ...state,
        definitions: state.definitions.filter(pk => !toBeRemoved.has(pk)),
        definitionEntities: {
          ...state.definitionEntities
        }
      };
    case TransientActionTypes.DeleteTransientGeoData:
      action.payload.geocodes.forEach(geocode => {
        delete state.geoData[geocode];
      });
      return {
        ...state,
        geoData: {
          ...state.geoData
        }
      };
    case TransientActionTypes.LoadTransients:
      return state;
    default:
      return state;
  }
}
