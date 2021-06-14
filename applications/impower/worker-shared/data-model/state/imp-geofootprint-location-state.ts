import { ImpGeofootprintLocationPayload } from '../payloads/imp-geofootprint-location-payload';
import { BaseModelState } from './base-model-state';

export class ImpGeofootprintLocationState extends BaseModelState {
  public glId:                      number;         /// Primary key, uniquely identifying a locations row
  public cgmId:                     number;         /// Foreign key to imp_geofootprint_master.cgm_id
  public projectId:                 number;         /// The IMPower Project ID
  public clientLocationId:          number;         /// Optional Foreign Key to Client Library Location
  public clientLocationTypeCode:    string;         /// Whether a location is a Site or a Competitor
  public clientIdentifierTypeCode:  string;         /// Not used at present. It is always set to PROJECT_ID in imPower.
  public clientIdentifierId:        number;         /// Not used at present. It is always set to 123 in imPower
  public locationIdDisplay:         string;         /// LOCATION ID displayed on UI
  public locationName:              string;         /// Name of the location
  public marketName:                string;         /// Name of the market eg: Detroit
  public groupName:                 string;         /// Group is either Advertisers/Competitors
  public xcoord:                    number;         /// X Location coordinate
  public ycoord:                    number;         /// Y Location coordinate
  public homeGeocode:               string;         /// Identifies the location home geography
  public homeGeoName:               string;         /// Name of the home geography
  public geoProfileId:              number;         /// Identifies the geography profile
  public geoProfileTypeAbbr:        string;         /// Type of geo profile
  public origAddress1:              string;         /// Original Street Name provided for geocoding
  public origCity:                  string;         /// Original City provided for geocoding
  public origState:                 string;         /// Original State provided for geocoding
  public origPostalCode:            string;         /// Original ZIP provided for geocoding
  public locFranchisee:             string;         /// Store franchisee
  public locAddress:                string;         /// Store address
  public locCity:                   string;         /// Store city
  public locState:                  string;         /// Store state
  public locZip:                    string;         /// Store zip code
  public locSortOrder:              number;         /// Locations sort order
  public geocoderMatchCode:         string;         /// Match Code returned by the geocoder
  public geocoderLocationCode:      string;         /// Location Quality Code returned by the Address Broker geocoding software eg: AS0, It is the most common code
  public recordStatusCode:          string;         /// Status Code: PROVIDED/SUCCESS/ERROR
  public isActive:                  boolean;        /// Is Active
  public locationNumber:            string;         /// Location Number
  public marketCode:                string;         /// Stores market code value eg: 534 for Atlanta
  public description:               string;         /// Site Description entered by the Targeter
  public homeZip:                   string;         /// Home ZIP for the Site
  public homeAtz:                   string;         /// Home ATZ for Site
  public homeDigitalAtz:            string;         /// Home Digital ATZ for Site
  public homePcr:                   string;         /// Home PCR for Site
  public radius1:                   number;         /// Radius1 for Site
  public radius2:                   number;         /// Radius2 for Site
  public radius3:                   number;         /// Radius3 for Site
  public homeCountyFip:             string;         /// 5 digit FIPS County code e.g. 26163 for WAYNE county in Michigan
  public homeDmaCode:               string;         /// 5 digit Designated Metropolitan Area e.g. 0505 for Detroit MI
  public carrierRoute:              string;
  public isSelected:                boolean;


  // ----------------------------------------------------------------------------
  // ONE TO MANY RELATIONSHIP MEMBERS
  // ----------------------------------------------------------------------------
  public impGeofootprintLocAttribs:      Array<number> = [];
  public impGeofootprintTradeAreas:      Array<number> = [];
  // ----------------------------------------------------------------------------

  // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
  constructor(data?: Partial<ImpGeofootprintLocationPayload>) {
    super(data);
    if (data != null) {
      const relationships = {
        impGeofootprintLocAttribs: (data.impGeofootprintLocAttribs ?? []).map(a => a.locAttributeId),
        impGeofootprintTradeAreas: (data.impGeofootprintTradeAreas ?? []).map(ta => ta.gtaId),
      };
      Object.assign(this, relationships);
    }
  }
}
