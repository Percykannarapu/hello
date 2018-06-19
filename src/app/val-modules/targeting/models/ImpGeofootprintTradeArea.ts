/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_TRADE_AREAS
 **
 ** Generated from VAL_BASE_GEN - v1.04
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';
import { ImpGeofootprintGeo } from './ImpGeofootprintGeo';
import { ImpGeofootprintVar } from './ImpGeofootprintVar';

export class ImpGeofootprintTradeArea extends BaseModel
{
   public gtaId:           number;         /// Primary key, uniquely identifying a trade areas row
   public cgmId:           number;         /// Foreign key to imp_geofootprint_master.cgm_id
   public glId:            number;         /// Foreign key to imp_geofootprint_location.gl_id
   public projectId:       number;
   public taNumber:        number;         /// Trade area number
   public taName:          string;         /// Trade area name
   public taRadius:        number;         /// Trade area radius
   public taMinHhc:        number;         /// Trade area minimum hhc
   public taUseMinHhcInd:  number;         /// Use minimum hhc indicator
   public taType:          string;         /// Trade area type (RADIUS, GEO_LIST, ...)
   public taOverrideInd:   number;         /// Trade area override indicator
   public isActive:        boolean;        /// Is Active

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public impGeofootprintGeos:      Array<ImpGeofootprintGeo> = new Array<ImpGeofootprintGeo>();
   public impGeofootprintVars:      Array<ImpGeofootprintVar> = new Array<ImpGeofootprintVar>();
   // ----------------------------------------------------------------------------

   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintLocation:      ImpGeofootprintLocation;           /// Geofootprint Locations table

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintMaster:        ImpGeofootprintMaster;             /// Geofootprint master table for IMPower.

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impProject:                   ImpProject;                        /// Captures Project information from the UI


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpGeofootprintTradeArea>) {
      super();
      Object.assign(this, data);
   }

   // Convert JSON objects into Models
   public convertToModel()
   {
      // Convert JSON objects into models
      this.impGeofootprintGeos = (this.impGeofootprintGeos||[]).map(ma => new ImpGeofootprintGeo(ma));
      this.impGeofootprintVars = (this.impGeofootprintVars||[]).map(ma => new ImpGeofootprintVar(ma));

      // Push this as transient parent to children
      this.impGeofootprintGeos.forEach(fe => fe.impGeofootprintTradeArea = this);
      this.impGeofootprintVars.forEach(fe => fe.impGeofootprintTradeArea = this);

      // Ask the children to convert into models
      this.impGeofootprintGeos.forEach(fe => fe.convertToModel());
      this.impGeofootprintVars.forEach(fe => fe.convertToModel());
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
         ['gtaId',                         'number'],
         ['taNumber',                      'number'],
         ['taName',                        'string'],
         ['taRadius',                      'number'],
         ['taMinHhc',                      'number'],
         ['taUseMinHhcInd',                'number'],
         ['taType',                        'string'],
         ['taOverrideInd',                 'number'],
         ['isActive',                      'boolean']
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
         ['impGeofootprintLocation',       'ImpGeofootprintLocation'],
         ['impGeofootprintMaster',         'ImpGeofootprintMaster'],
         ['impProject',                    'ImpProject'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['impGeofootprintLocation',       'ImpGeofootprintLocation'],
         ['impGeofootprintMaster',         'ImpGeofootprintMaster'],
         ['impProject',                    'ImpProject'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}
