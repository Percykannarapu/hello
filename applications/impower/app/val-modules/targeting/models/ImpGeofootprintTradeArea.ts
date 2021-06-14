/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_TRADE_AREAS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, transient } from '../../api/models/BaseModel';
import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';
import { ImpGeofootprintGeo } from './ImpGeofootprintGeo';

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
      this.impGeofootprintGeos.forEach(fe => fe.setTreeProperty(propName, propValue));
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
      // Ask the children to remove the tree property
      this.impGeofootprintGeos.forEach(fe => fe.removeTreeProperty(propName   ));
   }

   // Convert JSON objects into Models
   public convertToModel()
   {
      // Convert JSON objects into models
      this.impGeofootprintGeos = (this.impGeofootprintGeos || []).map(ma => new ImpGeofootprintGeo(ma));

      // Push this as transient parent to children
      this.impGeofootprintGeos.forEach(fe => fe.impGeofootprintTradeArea = this);

      // Ask the children to convert into models
      this.impGeofootprintGeos.forEach(fe => fe.convertToModel());

      // Set the isComplete flag indicating the load is complete
      this.setTreeProperty('isComplete', true);
   }
}
