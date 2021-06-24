/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_RFP_UI_EDIT_V
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
export class RfpUiEdit extends BaseModel
{
   public siteId:                number;
   public siteName:              string;
   public siteAddress:           string;
   public siteCitySt:            string;
   public siteZip:               string;
   public siteLat:               number;
   public siteLong:              number;
   public productCd:             string;
   public productName:           string;
   public finishedSize:          string;
   public estimatedPieceWeight:  number;
   public ownerGroup:            string;
   public vdpTypeCode:           string;
   public mbuPriceUom:           string;
   public sfdcProductCode:       string;
   public detailPageInd:         number;
   public taHousehold:           number;
   public taDistribution:        number;
   public distribution:          number;
   public investment:            number;
   public isAddOn:               boolean;
   public addonDistribution:     number;
   public addonTaDistribution:   number;
   public addonInvestment:       number;
   public avgCpm:                number;
   public coverage:              number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<RfpUiEdit>) {
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
         ['siteId',                'number'],
         ['siteName',              'string'],
         ['siteAddress',           'string'],
         ['siteCitySt',            'string'],
         ['siteZip',               'string'],
         ['siteLat',               'number'],
         ['siteLong',              'number'],
         ['productCd',             'string'],
         ['productName',           'string'],
         ['finishedSize',          'string'],
         ['estimatedPieceWeight',  'number'],
         ['ownerGroup',            'string'],
         ['vdpTypeCode',           'string'],
         ['mbuPriceUom',           'string'],
         ['sfdcProductCode',       'string'],
         ['detailPageInd',         'number'],
         ['taHousehold',           'number'],
         ['taDistribution',        'number'],
         ['distribution',          'number'],
         ['investment',            'number'],
         ['isAddOn',               'boolean'],
         ['addonDistribution',     'number'],
         ['addonTaDistribution',   'number'],
         ['addonInvestment',       'number'],
         ['avgCpm',                'number'],
         ['coverage',              'number']
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
