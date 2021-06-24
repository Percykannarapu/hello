/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_RFP_UI_EDIT_DETAILS_V
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
export class RfpUiEditDetail extends BaseModel
{
   public mediaPlanId:           number;         /// The pk of cbx_media_plans
   public mbuHdrId:              number;         /// The pk of cbx_mp_mbu_hdrs
   public mbuDtlId:              number;         /// The pk of cbx_mp_mbu_dtls
   public commonMbuId:           number;         /// The pk of cbx_mp_common_mbus
   public ggId:                  number;         /// The pk of cbx_geofootprint_geos
   public geoProfileId:          number;         /// The wrap id in cbx_pm_forecast_wrap_dtls_mv
   public fkSite:                number;         /// The id of the site
   public wrapZoneId:            number;         /// ID of the wrap zone
   public wrapZone:              string;         /// Name of the wrap zone
   public productCd:             string;         /// The short code for the product
   public productName:           string;         /// The full product name
   public sfdcProductCode:       string;
   public wrapPagePosition:      string;         /// The page position of the wrap chosen
   public finishedSize:          string;         /// Finished size
   public estimatedPieceWeight:  number;         /// Estimated piece weight
   public vdpTypeCode:           string;         /// VDP Type
   public geocode:               string;         /// The geography
   public zip:                   string;         /// The zip code component of the geography
   public atz:                   string;         /// The atz component of the geography
   public cityName:              string;         /// The city / state of the geography
   public households:             number;         /// When bought, hh_count_mbu otherwise hh_count_pref_ihd. If null, then hh_count_geo
   public taHouseholds:           number;         /// Households in the trade area
   public distribution:          number;         /// The distribution (circ)
   public addOnDistribution:     number;
   public cpm:                   number;         /// Average MBU price (cost per thousand)
   public investment:            number;         /// Spend with flat_fee added in
   public addOnInvestment:       number;
   public overallCoverage:       number;         /// Overall Coverage: circ / household count * 100
   public taCoverage:            number;         /// Trade Area Coverage: TA (targeted) circ / TA (targeted) household count * 100
   public distance:              number;         /// The distance of the geography to the site
   public coverageDescDisplay:   string;         /// Abbreviated delivery method
   public coverageDesc:          string;         /// Delivery method full name
   public ownerGroup:            string;         /// Owner Group
   public coverageFrequency:     string;         /// Coverage Frequency
   public ihDate:                Date;           /// In home week start date
   public ihDay:                 string;         /// In home day
   public pricingMarket:         string;         /// Pricing market
   public sdmId:                 number;         /// The id of the shared delivery market
   public sdmName:               string;         /// Grouping of shared coverage areas
   public variableId:            number;         /// Primary variable id
   public primaryVariableName:   string;         /// Primary variable name
   public variableContent:       string;         /// Primary variable contents, notably INDEX indicates an indexed value
   public variableValue:         number;         /// Primary variable number value
   public isSelected:            boolean;        /// If the user has selected this geography, then 1 else 0 (Default is_bought)
   public isAddOn:               boolean;
   public isActiveMbuCmn:        boolean;        /// Value of cbx_mp_common_mbus.is_active
   public isActiveMbuHdr:        boolean;        /// Value of cbx_mp_mbu_hdrs.is_active
   public isActiveMbuDtl:        boolean;        /// Value of cbx_mp_mbu_dtls.is_active
   public isUsedInCbx:           boolean;        /// If the geography in mbu details then 1 else 0
   public isBought:              boolean;        /// If opti bought this geography, then 1 else 0
   public mbuPriceUom:           string;
   public var1Name:              string;         /// Variable 1 name
   public var1Content:           string;         /// Variable 1 contents, notably INDEX indicates an indexed value
   public var1IsString:          number;         /// 0 = Not a string, 1 = Is a string
   public var1IsNumber:          number;         /// 0 = Not a number, 1 = Is a number
   public var1Value:             string;         /// Variable 1 number value
   public var2Name:              string;         /// Variable 2 name
   public var2Content:           string;         /// Variable 2 contents, notably INDEX indicates an indexed value
   public var2IsString:          number;         /// 0 = Not a string, 1 = Is a string
   public var2IsNumber:          number;         /// 0 = Not a number, 1 = Is a number
   public var2Value:             string;         /// Variable 2 number value
   public var3Name:              string;         /// Variable 3 name
   public var3Content:           string;         /// Variable 3 contents, notably INDEX indicates an indexed value
   public var3IsString:          number;         /// 0 = Not a string, 1 = Is a string
   public var3IsNumber:          number;         /// 0 = Not a number, 1 = Is a number
   public var3Value:             string;         /// Variable 3 number value
   public siteName?:             string;        /// Site Name

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<RfpUiEditDetail>) {
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
         ['mediaPlanId',           'number'],
         ['mbuHdrId',              'number'],
         ['mbuDtlId',              'number'],
         ['commonMbuId',           'number'],
         ['ggId',                  'number'],
         ['geoProfileId',          'number'],
         ['fkSite',                'number'],
         ['wrapZoneId',            'number'],
         ['wrapZone',              'string'],
         ['productCd',             'string'],
         ['productName',           'string'],
         ['sfdcProductCode',       'string'],
         ['wrapPagePosition',      'string'],
         ['finishedSize',          'string'],
         ['estimatedPieceWeight',  'number'],
         ['vdpTypeCode',           'string'],
         ['geocode',               'string'],
         ['zip',                   'string'],
         ['atz',                   'string'],
         ['cityName',              'string'],
         ['household',             'number'],
         ['taHousehold',           'number'],
         ['distribution',          'number'],
         ['addOnDistribution',     'number'],
         ['cpm',                   'number'],
         ['investment',            'number'],
         ['addOnInvestment',       'number'],
         ['overallCoverage',       'number'],
         ['taCoverage',            'number'],
         ['distance',              'number'],
         ['coverageDescDisplay',   'string'],
         ['coverageDesc',          'string'],
         ['ownerGroup',            'string'],
         ['coverageFrequency',     'string'],
         ['ihDate',                'Date'],
         ['ihDay',                 'string'],
         ['pricingMarket',         'string'],
         ['sdmId',                 'number'],
         ['sdmName',               'string'],
         ['variableId',            'number'],
         ['primaryVariableName',   'string'],
         ['variableContent',       'string'],
         ['variableValue',         'number'],
         ['isSelected',            'boolean'],
         ['isAddOn',               'boolean'],
         ['isActiveMbuCmn',        'boolean'],
         ['isActiveMbuHdr',        'boolean'],
         ['isActiveMbuDtl',        'boolean'],
         ['isUsedInCbx',           'boolean'],
         ['isBought',              'boolean'],
         ['mbuPriceUom',           'string'],
         ['var1Name',              'string'],
         ['var1Content',           'string'],
         ['var1IsString',          'number'],
         ['var1IsNumber',          'number'],
         ['var1Value',             'string'],
         ['var2Name',              'string'],
         ['var2Content',           'string'],
         ['var2IsString',          'number'],
         ['var2IsNumber',          'number'],
         ['var2Value',             'string'],
         ['var3Name',              'string'],
         ['var3Content',           'string'],
         ['var3IsString',          'number'],
         ['var3IsNumber',          'number'],
         ['var3Value',             'string']
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
      ]);
   }
}
