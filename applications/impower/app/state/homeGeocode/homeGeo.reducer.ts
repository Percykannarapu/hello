import { HomeGeoActions, HomeGeoActionTypes } from './homeGeo.actions';



export interface HomeGeoState {
   geocode: boolean;
   homeGeocode: boolean;
   persistGeos: boolean;
 }


const initialState: HomeGeoState = {
   geocode: false,
   homeGeocode: false,
   persistGeos: false
 };

export function homeGeoReducer(state = initialState, action: HomeGeoActions) : HomeGeoState {
    switch (action.type){
       case HomeGeoActionTypes.Geocode:
         return  {
            ...state,
            geocode: false,
            homeGeocode: false,
            persistGeos: false,
          };
       case HomeGeoActionTypes.HomeGeocode:
         return {
            ...state,
            geocode: false,
            homeGeocode: true,
            persistGeos: false, 
         };   
       case HomeGeoActionTypes.PersistLocations:
         return{
            ...state,
            geocode: false,
            homeGeocode: false,
            persistGeos: true, 
         };
       case HomeGeoActionTypes.ZoomtoLocations:
         return state;
       case HomeGeoActionTypes.DetermineDTZHomeGeos:
         return state;  
       case HomeGeoActionTypes.ProcessHomeGeoAttributes:
         return state;
       case HomeGeoActionTypes.UpdateLocations:
         return state;   
       case HomeGeoActionTypes.ApplyTradeAreaOnEdit:
         return state;
       case HomeGeoActionTypes.ValidateEditedHomeGeoAttributes:
         return state;
       case HomeGeoActionTypes.SaveOnValidationSuccess:
         return state;
       default:
         return state;   
    }
 }