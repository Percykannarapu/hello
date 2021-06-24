/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_RFP_UI_REVIEW_V
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
export class RfpUiReview extends BaseModel
{
   public mediaPlanGroupId:        number;
   public mediaPlanId:             number;
   public siteId:                  number;
   public siteIdDisplay:           string;
   public siteName:                string;
   public siteAddress:             string;
   public siteCitySt:              string;
   public siteZip:                 string;
   public siteHomeGeocode:         string;
   public productCd:               string;
   public productName:             string;
   public sfdcProductCode:         string;
   public sfdcProductName:         string;
   public pricingMarket:           string;
   public deliveryMethod:          string;
   public deliveryMethodAbbr:      string;
   public distributionMethod:      string;
   public ownerGroup:              string;
   public ihw:                     Date;
   public ihd:                     string;
   public wrapPagePosition:        string;
   public finishedSize:            string;
   public estimatedPieceWeight:    number;
   public vdpTypeCode:             string;
   public avgCpm:                  number;
   public taHousehold:             number;
   public distributionPossible:    number;
   public taDistributionPossible:  number;
   public distribution:            number;
   public taDistribution:          number;
   public investment:              number;
   public isAddOn:                 boolean;
   public addonDistribution:       number;
   public addonTaDistribution:     number;
   public addonInvestment:         number;
   public coverage:                number;
   public distEfficiency:          number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<RfpUiReview>) {
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
         ['mediaPlanGroupId',        'number'],
         ['mediaPlanId',             'number'],
         ['siteId',                  'number'],
         ['siteIdDisplay',           'string'],
         ['siteName',                'string'],
         ['siteAddress',             'string'],
         ['siteCitySt',              'string'],
         ['siteZip',                 'string'],
         ['siteHomeGeocode',         'string'],
         ['productCd',               'string'],
         ['productName',             'string'],
         ['sfdcProductCode',         'string'],
         ['sfdcProductName',         'string'],
         ['pricingMarket',           'string'],
         ['deliveryMethod',          'string'],
         ['deliveryMethodAbbr',      'string'],
         ['distributionMethod',      'string'],
         ['ownerGroup',              'string'],
         ['ihw',                     'Date'],
         ['ihd',                     'string'],
         ['wrapPagePosition',        'string'],
         ['finishedSize',            'string'],
         ['estimatedPieceWeight',    'number'],
         ['vdpTypeCode',             'string'],
         ['avgCpm',                  'number'],
         ['taHousehold',             'number'],
         ['distributionPossible',    'number'],
         ['taDistributionPossible',  'number'],
         ['distribution',            'number'],
         ['taDistribution',          'number'],
         ['investment',              'number'],
         ['isAddOn',                 'boolean'],
         ['addonDistribution',       'number'],
         ['addonTaDistribution',     'number'],
         ['addonInvestment',         'number'],
         ['coverage',                'number'],
         ['distEfficiency',          'number']
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
