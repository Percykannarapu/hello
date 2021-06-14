import { BaseModelPayload } from './base-model-payload';
import { ImpGeofootprintLocAttribPayload } from './imp-geofootprint-loc-attrib-payload';
import { ImpGeofootprintTradeAreaPayload } from './imp-geofootprint-trade-area-payload';

export interface ImpGeofootprintLocationPayload extends BaseModelPayload {
   glId:                      number;         /// Primary key, uniquely identifying a locations row
   cgmId:                     number;         /// Foreign key to imp_geofootprint_master.cgm_id
   projectId:                 number;         /// The IMPower Project ID
   clientLocationId:          number;         /// Optional Foreign Key to Client Library Location
   clientLocationTypeCode:    string;         /// Whether a location is a Site or a Competitor
   clientIdentifierTypeCode:  string;         /// Not used at present. It is always set to PROJECT_ID in imPower.
   clientIdentifierId:        number;         /// Not used at present. It is always set to 123 in imPower
   locationIdDisplay:         string;         /// LOCATION ID displayed on UI
   locationName:              string;         /// Name of the location
   marketName:                string;         /// Name of the market eg: Detroit
   groupName:                 string;         /// Group is either Advertisers/Competitors
   xcoord:                    number;         /// X Location coordinate
   ycoord:                    number;         /// Y Location coordinate
   homeGeocode:               string;         /// Identifies the location home geography
   homeGeoName:               string;         /// Name of the home geography
   geoProfileId:              number;         /// Identifies the geography profile
   geoProfileTypeAbbr:        string;         /// Type of geo profile
   origAddress1:              string;         /// Original Street Name provided for geocoding
   origCity:                  string;         /// Original City provided for geocoding
   origState:                 string;         /// Original State provided for geocoding
   origPostalCode:            string;         /// Original ZIP provided for geocoding
   locFranchisee:             string;         /// Store franchisee
   locAddress:                string;         /// Store address
   locCity:                   string;         /// Store city
   locState:                  string;         /// Store state
   locZip:                    string;         /// Store zip code
   locSortOrder:              number;         /// Locations sort order
   geocoderMatchCode:         string;         /// Match Code returned by the geocoder
   geocoderLocationCode:      string;         /// Location Quality Code returned by the Address Broker geocoding software eg: AS0, It is the most common code
   recordStatusCode:          string;         /// Status Code: PROVIDED/SUCCESS/ERROR
   isActive:                  boolean;        /// Is Active
   locationNumber:            string;         /// Location Number
   marketCode:                string;         /// Stores market code value eg: 534 for Atlanta
   description:               string;         /// Site Description entered by the Targeter
   homeZip:                   string;         /// Home ZIP for the Site
   homeAtz:                   string;         /// Home ATZ for Site
   homeDigitalAtz:            string;         /// Home Digital ATZ for Site
   homePcr:                   string;         /// Home PCR for Site
   radius1:                   number;         /// Radius1 for Site
   radius2:                   number;         /// Radius2 for Site
   radius3:                   number;         /// Radius3 for Site
   homeCountyFip:             string;         /// 5 digit FIPS County code e.g. 26163 for WAYNE county in Michigan
   homeDmaCode:               string;         /// 5 digit Designated Metropolitan Area e.g. 0505 for Detroit MI
   carrierRoute:              string;
   isSelected:                boolean;

  // ----------------------------------------------------------------------------
  // ONE TO MANY RELATIONSHIP MEMBERS
  // ----------------------------------------------------------------------------
   impGeofootprintLocAttribs:      Array<ImpGeofootprintLocAttribPayload>;
   impGeofootprintTradeAreas:      Array<ImpGeofootprintTradeAreaPayload>;
  // ----------------------------------------------------------------------------
}
