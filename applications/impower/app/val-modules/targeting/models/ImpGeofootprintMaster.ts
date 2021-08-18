/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_MASTER
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, transient } from '../../api/models/BaseModel';
import { ImpGeofootprintGeo } from './ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from './ImpGeofootprintLocAttrib';
import { ImpGeofootprintTradeArea } from './ImpGeofootprintTradeArea';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintMaster extends BaseModel
{

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpGeofootprintMaster>) {
      super();
      Object.assign(this, data);
   }
   public cgmId:                number;         /// Primary key identifying the current run for the profile.
   public projectId:            number;         /// The IMPower Project ID
   public summaryInd:           number;         /// 1 = Summary, 0 = Not summary
   public allowDuplicate:       number;         /// Indicator for allowing duplicate geos
   public createdDate:          number;           /// Date/Time row was created
   public status:               string;         /// Indicates success or failure of geofootprint creation
   public methAnalysis:         string;         /// Method analysis level. ZIP or ATZ
   public methSeason:           string;         /// Season
   public activeLocationCount:  number;         /// Total number of active location
   public totalLocationCount:   number;         /// Total number of location
   public isMarketBased:        boolean;        /// 1 = Market based, 2 = Store based
   public isActive:             boolean;        /// Is Active

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public impGeofootprintLocations:      Array<ImpGeofootprintLocation> = new Array<ImpGeofootprintLocation>();
   // ----------------------------------------------------------------------------

   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impProject:                ImpProject;                     /// Captures Project information from the UI


   // -------------------------------------------
   // TRANSITORY ONE TO MANY RELATIONSHIP GETTERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getImpGeofootprintGeos() : ReadonlyArray<ImpGeofootprintGeo> {
      let _result: Array<ImpGeofootprintGeo> = new Array<ImpGeofootprintGeo>();
      (this.impGeofootprintLocations || []).forEach(impGeofootprintLocation => (impGeofootprintLocation.impGeofootprintTradeAreas ?? [])
                                         .forEach(impGeofootprintTradeArea => (_result = _result.concat(impGeofootprintTradeArea.impGeofootprintGeos ?? []))));
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getImpGeofootprintLocAttribs() : ReadonlyArray<ImpGeofootprintLocAttrib> {
     let _result: Array<ImpGeofootprintLocAttrib> = new Array<ImpGeofootprintLocAttrib>();
      (this.impGeofootprintLocations || []).forEach(impGeofootprintLocation => (_result = _result.concat(impGeofootprintLocation.impGeofootprintLocAttribs ?? [])));
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getImpGeofootprintTradeAreas() : ReadonlyArray<ImpGeofootprintTradeArea> {
     let _result: Array<ImpGeofootprintTradeArea> = new Array<ImpGeofootprintTradeArea>();
      (this.impGeofootprintLocations || []).forEach(impGeofootprintLocation => (_result = _result.concat(impGeofootprintLocation.impGeofootprintTradeAreas ?? [])));
      return _result;
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
      this.impGeofootprintLocations.forEach(fe => fe.setTreeProperty(propName, propValue));
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
      // Ask the children to remove the tree property
      this.impGeofootprintLocations.forEach(fe => fe.removeTreeProperty(propName   ));
   }

   // Convert JSON objects into Models
   public convertToModel()
   {
      // Convert JSON objects into models
      this.impGeofootprintLocations = (this.impGeofootprintLocations || []).map(ma => new ImpGeofootprintLocation(ma));

      // Push this as transient parent to children
      this.impGeofootprintLocations.forEach(fe => fe.impGeofootprintMaster = this);

      // Ask the children to convert into models
      this.impGeofootprintLocations.forEach(fe => fe.convertToModel());

      // Set the isComplete flag indicating the load is complete
      this.setTreeProperty('isComplete', true);
   }
}
