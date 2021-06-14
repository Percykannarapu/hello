/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_GEOS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, transient } from '../../api/models/BaseModel';
import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpGeofootprintTradeArea } from './ImpGeofootprintTradeArea';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintGeo extends BaseModel
{
   public ggId:          number;         /// Primary key uniquely identifying a geofootprint row
   public cgmId:         number;         /// Foreign key to imp_geofootprint_master.cgm_id
   public glId:          number;         /// Foreign key to imp_geofootprint_locations.gl_id
   public gtaId:         number;         /// Foreign key to imp_geofootprint_trade_areas.gta_id
   public projectId:     number;         /// The IMPower Project ID
   public geocode:       string;         /// The geography
   public geoSortOrder:  number;         /// Geography sort order
   public hhc:           number;         /// Household count
   public xcoord:        number;         /// x_coord is longitude
   public ycoord:        number;         /// y_coord is latitude
   public distance:      number;         /// Geocodes distance to the location
   public isActive:      boolean;

   // ----------------------------------
   // TRANSITORY MEMBERS (NOT PERSISTED)
   // ----------------------------------
   public isDeduped:     number;         /// 1 = deduped, 0 = not deduped
   public rank:          number;         /// Rank used to calculate dupes
   public ownerSite:     string;         /// Site number which owns a geo when shared

   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintLocation:      ImpGeofootprintLocation;           /// Geofootprint Locations table

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintMaster:        ImpGeofootprintMaster;             /// Geofootprint master table for IMPower.

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintTradeArea:     ImpGeofootprintTradeArea;          /// Geofootprint Trade Areas

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impProject:                   ImpProject;                        /// Captures Project information from the UI


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpGeofootprintGeo>) {
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
  }

  // Removes a tree property from this level down
  public removeTreeProperty(propName: string)
  {
    delete this[propName];
  }

  // Convert JSON objects into Models
  public convertToModel()
  {

    // Set the isComplete flag indicating the load is complete
    this.setTreeProperty('isComplete', true);
  }
}
