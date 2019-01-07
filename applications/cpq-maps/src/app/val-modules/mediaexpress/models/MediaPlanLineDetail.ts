/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MP_MBU_DTLS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { AdvertiserInfo } from './AdvertiserInfo';
import { MediaPlan } from './MediaPlan';
import { MediaPlanLine } from './MediaPlanLine';

export class MediaPlanLineDetail extends BaseModel
{
   public mbuDtlId:           number;         /// Primary key indicating a particular MBU detail row
   public createUser:         number;         /// User to create the row
   public createDate:         Date;           /// Date/Time row was created
   public modifyUser:         number;         /// User to modify the row
   public modifyDate:         Date;           /// Date/Time row was modified
   public mbuHdrId:           number;         /// Foreign key to cbx_mp_mbu_hdrs.mbu_hdr_id
   public mediaPlanId:        number;         /// Foreign key to cbx_media_plans.media_plan_id
   public advertiserInfoId:   number;         /// Foreign key to cbx_advertiser_info.advertiser_info_id
   public geocode:            string;         /// Geography code
   public zipCode:            string;         /// Zip code derived from the geocode
   public atz:                string;         /// Atz code derived from the geocode
   public validFromDate:      Date;           /// Normally from forecast mv to find dates of interest
   public validToDate:        Date;           /// Normally from forecast mv to find dates of interest
   public hhCount:            number;         /// Household count
   public targetedHhCount:    number;         /// Targeted household count
   public circ:               number;         /// Circulation
   public targetedCirc:       number;         /// Targeted circulation
   public unindexedGeoScore:  number;         /// Unindexed variable value from cbx_geofootprint_vars
   public isActive:           boolean;        /// 1 = Active, 0 = InActive. (Note: Always also check cbx_mp_mbu_hdrs.is_active)
   public isTargeted:         boolean;        /// Is the geography targeted?  (1 = Yes, 0 = No)
   public rank:               number;         /// Ranking value to choose one geography over the other
   public fkSite:             number;         /// Site the geography belongs to
   public meetsVarFilter:     number;         /// Does the geography meet the variable filter or not
   public gsId:               number;         /// Site gs_id (cbx_geofootprint_sites)
   public isHomeGeo:          boolean;        /// 1 = Is a home geography, 0 = Is not a home geography
   public indexedGeoScore:    number;         /// Indexed variable value from cbx_geofootprint_vars
   public npDtlId:            number;         /// Newspaper detail ID
   public hhCountPrefIhd:     number;         /// Hh Count Pref Ihd
   public isBlendedZip:       boolean;        /// 0 or 1: A 1 indicates that the ZIP contains more than one delivery_method, for example: PCD/MAIL (see CBX_ZONE_BLENDED_ZIPS_MV)
   public blendedPct:         number;         /// Blended Pct
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public advertiserInfo:       AdvertiserInfo;            /// Captures advertiser information from the UI

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mediaPlan:            MediaPlan;                 /// Media plans for an advertiser info id / profile

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mediaPlanLine:        MediaPlanLine;             /// CBX.CBX_MP_MBU_HDRS


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<MediaPlanLineDetail>) {
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

   /**
    * Produces a map of this classes fields and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getFields () : Map<string, string>
   {
      return new Map([
         ['mbuDtlId',              'number'],
         ['createUser',            'number'],
         ['createDate',            'Date'],
         ['modifyUser',            'number'],
         ['modifyDate',            'Date'],
         ['geocode',               'string'],
         ['zipCode',               'string'],
         ['atz',                   'string'],
         ['validFromDate',         'Date'],
         ['validToDate',           'Date'],
         ['hhCount',               'number'],
         ['targetedHhCount',       'number'],
         ['circ',                  'number'],
         ['targetedCirc',          'number'],
         ['unindexedGeoScore',     'number'],
         ['isActive',              'boolean'],
         ['isTargeted',            'boolean'],
         ['rank',                  'number'],
         ['fkSite',                'number'],
         ['meetsVarFilter',        'number'],
         ['isHomeGeo',             'boolean'],
         ['indexedGeoScore',       'number'],
         ['npDtlId',               'number'],
         ['hhCountPrefIhd',        'number'],
         ['isBlendedZip',          'boolean'],
         ['blendedPct',            'number']
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
         ['advertiserInfo',        'AdvertiserInfo'],
         ['geofootprintSite',      'GeofootprintSite'],
         ['mediaPlan',             'MediaPlan'],
         ['mpMbuHdr',              'MpMbuHdr'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['advertiserInfo',        'AdvertiserInfo'],
         ['geofootprintSite',      'GeofootprintSite'],
         ['mediaPlan',             'MediaPlan'],
         ['mpMbuHdr',              'MpMbuHdr'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}