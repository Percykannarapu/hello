//import { GeocodingAttributes } from "./GeoCodingAttributes";
import { GeocodingAttributes } from './GeocodingAttributes';



export class GeocodingResponse {
    firmname: string;
    addressline: string;
    city: string;
    state: string;
    longitude: number;
    latitude: number;
    countyName: string;
    locationQualityCode: string;
    zip10: string;
    fipscountyCode: string;
    matchCode: string;
    name: string;
    number: string;
    standardizedCity: string;
    standardizedState: string;
    zip: string;
    attributes?: any;
    status: string;
    orgAddr: string;
    orgCity: string;
    orgState: string;
    marketName: string;

    public   geocodingAttributesList: GeocodingAttributes[]; 
  }