/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_RFP_UI_EDIT_V
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
export class RfpUiEditWrap extends BaseModel
{
   public isSelected:          boolean;
   public commonMbuId:         number;
   public siteId:              number;
   public siteName:            string;
   public siteAddress:         string;
   public siteCitySt:          string;
   public wrapZoneId:          number;
   public wrapZone:            string;
   public productCd:           string;
   public coverageFrequency:   string;
   public ownerGroup:          string;
   public wrapProductName:     string;
   public wrapPagePosition:    string;
   public primaryVariableName: string;
   public variableContents:    string;
   public variableValue:       number;
   public taHouseholds:        number;
   public taDistribution:      number;
   public distribution:        number;
   public avgCpm:              number;
   public investment:          number;
   public wrapEfficiency:      number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<RfpUiEditWrap>) {
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
         ['isSelected',         'boolean'],
         ['commonMbuId',         'number'],
         ['siteId',              'number'],
         ['siteName',            'string'],
         ['siteAddress',         'string'],
         ['siteCitySt',          'string'],
         ['wrapZoneId',          'number'],
         ['wrapZone',            'string'],
         ['productCd',           'string'],
         ['coverageFrequency',   'string'],
         ['ownerGroup',          'string'],
         ['wrapProductName',     'string'],
         ['wrapPagePosition',    'string'],
         ['primaryVariableName', 'string'],
         ['variableContents',    'string'],
         ['variableValue',       'number'],
         ['taHouseholds',        'number'],
         ['taDistribution',      'number'],
         ['distribution',        'number'],
         ['avgCpm',              'number'],
         ['investment',          'number'],
         ['wrapEfficiency',      'number']
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
