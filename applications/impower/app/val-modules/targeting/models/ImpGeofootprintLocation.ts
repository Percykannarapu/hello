/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_LOCATIONS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';
import { ImpClientLocation } from '../../client/models/ImpClientLocation';
import { ImpClientLocationType } from '../../client/models/ImpClientLocationType';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';
import { ImpGeofootprintGeo } from './ImpGeofootprintGeo';
import { ImpGeofootprintLocAttrib } from './ImpGeofootprintLocAttrib';
import { ImpGeofootprintTradeArea } from './ImpGeofootprintTradeArea';
import { ImpGeofootprintVar } from './ImpGeofootprintVar';

export class ImpGeofootprintLocation extends BaseModel
{
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

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public impGeofootprintLocAttribs:      Array<ImpGeofootprintLocAttrib> = new Array<ImpGeofootprintLocAttrib>();
   public impGeofootprintTradeAreas:      Array<ImpGeofootprintTradeArea> = new Array<ImpGeofootprintTradeArea>();
   // ----------------------------------------------------------------------------

   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public clientIdentifierType:        ClientIdentifierType;             /// Cbx Client Identifier Types

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impClientLocation:           ImpClientLocation;                /// Client Library Repository of Client Locations

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impClientLocationType:       ImpClientLocationType;            /// Client Library - Client Location Types (CLIENT, COMPETITOR etc.)

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintMaster:       ImpGeofootprintMaster;            /// Geofootprint master table for IMPower.

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impProject:                  ImpProject;                       /// Captures Project information from the UI


   // -------------------------------------------
   // TRANSITORY ONE TO MANY RELATIONSHIP GETTERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getImpGeofootprintGeos(): ReadonlyArray<ImpGeofootprintGeo> {
      let _result: Array<ImpGeofootprintGeo> = new Array<ImpGeofootprintGeo>();
      (this.impGeofootprintTradeAreas||[]).forEach(impGeofootprintTradeArea => (_result.push(...impGeofootprintTradeArea.impGeofootprintGeos||[])));
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getImpGeofootprintVars(): ReadonlyArray<ImpGeofootprintVar> {
      let _result: Array<ImpGeofootprintVar> = new Array<ImpGeofootprintVar>();
      (this.impGeofootprintTradeAreas||[]).forEach(impGeofootprintTradeArea => (_result.push(...impGeofootprintTradeArea.impGeofootprintVars||[])));
      return _result;
   }


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpGeofootprintLocation>) {
      super();
      Object.assign(this, data);
   }

   // Set tree property and push it down the hierarchy
   public setTreeProperty(propName: string, propValue: any)
   {
      if (!this.hasOwnProperty(propName)) {
         Object.defineProperty(this, propName, {
            enumerable: false,
            configurable: true,
            writable: true
         });
      }
      this[propName] = propValue;
      // Ask the children to set the tree property
      this.impGeofootprintLocAttribs.forEach(fe => fe.setTreeProperty(propName, propValue));
      this.impGeofootprintTradeAreas.forEach(fe => fe.setTreeProperty(propName, propValue));
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
      // Ask the children to remove the tree property
      this.impGeofootprintLocAttribs.forEach(fe => fe.removeTreeProperty(propName   ));
      this.impGeofootprintTradeAreas.forEach(fe => fe.removeTreeProperty(propName   ));
   }

   // Convert JSON objects into Models
   public convertToModel()
   {
      // Convert JSON objects into models
      this.impGeofootprintLocAttribs = (this.impGeofootprintLocAttribs || []).map(ma => new ImpGeofootprintLocAttrib(ma));
      this.impGeofootprintTradeAreas = (this.impGeofootprintTradeAreas || []).map(ma => new ImpGeofootprintTradeArea(ma));

      // Push this as transient parent to children
      this.impGeofootprintLocAttribs.forEach(fe => fe.impGeofootprintLocation = this);
      this.impGeofootprintTradeAreas.forEach(fe => fe.impGeofootprintLocation = this);

      // Ask the children to convert into models
      this.impGeofootprintLocAttribs.forEach(fe => fe.convertToModel());
      this.impGeofootprintTradeAreas.forEach(fe => fe.convertToModel());

      // Set the isComplete flag indicating the load is complete
      this.setTreeProperty('isComplete', true);
   }

   /**
    * Produces a map of this classes fields and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getFields () : Map<string, string>
   {
      return new Map([
         ['glId',                         'number'],
         ['clientIdentifierId',           'number'],
         ['locationIdDisplay',            'string'],
         ['locationName',                 'string'],
         ['marketName',                   'string'],
         ['groupName',                    'string'],
         ['xcoord',                       'number'],
         ['ycoord',                       'number'],
         ['homeGeocode',                  'string'],
         ['homeGeoName',                  'string'],
         ['geoProfileId',                 'number'],
         ['geoProfileTypeAbbr',           'string'],
         ['origAddress1',                 'string'],
         ['origCity',                     'string'],
         ['origState',                    'string'],
         ['origPostalCode',               'string'],
         ['locFranchisee',                'string'],
         ['locAddress',                   'string'],
         ['locCity',                      'string'],
         ['locState',                     'string'],
         ['locZip',                       'string'],
         ['locSortOrder',                 'number'],
         ['geocoderMatchCode',            'string'],
         ['geocoderLocationCode',         'string'],
         ['recordStatusCode',             'string'],
         ['isActive',                     'boolean'],
         ['locationNumber',               'string'],
         ['marketCode',                   'string'],
         ['description',                  'string'],
         ['homeZip',                      'string'],
         ['homeAtz',                      'string'],
         ['homeDigitalAtz',               'string'],
         ['homePcr',                      'string'],
         ['radius1',                      'number'],
         ['radius2',                      'number'],
         ['radius3',                      'number'],
         ['homeCountyFip',                'string'],
         ['homeDmaCode',                  'string']
         ]);
   }

   /**
    * Produces a map of this classes relationships and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getRelationships () : Map<string, string>
   {
      return new Map([
         // MANY TO ONE RELATIONSHIP MEMBERS
         ['clientIdentifierType',         'ClientIdentifierType'],
         ['impClientLocation',            'ImpClientLocation'],
         ['impClientLocationType',        'ImpClientLocationType'],
         ['impGeofootprintMaster',        'ImpGeofootprintMaster'],
         ['impProject',                   'ImpProject'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['clientIdentifierType',         'ClientIdentifierType'],
         ['impClientLocation',            'ImpClientLocation'],
         ['impClientLocationType',        'ImpClientLocationType'],
         ['impGeofootprintMaster',        'ImpGeofootprintMaster'],
         ['impProject',                   'ImpProject'],

         // TRANSITORY ONE TO MANY RELATIONSHIP MEMBERS
         ['impGeofootprintGeo',           'Array<ImpGeofootprintGeo>'],
         ['impGeofootprintVar',           'Array<ImpGeofootprintVar>'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   // public toString = () => JSON.stringify(this, null, '   ');
   public toString() {
      return JSON.stringify(this, null, '   ');
   }

}