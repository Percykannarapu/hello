/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_SFDC_PRODUCTS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class SfdcProduct
{
   public sfdcProductCode:      string;
   public productCode:          string;
   public sfdcProductName:      string;
   public createUser:           number;
   public createDate:           Date;
   public modifyUser:           number;
   public modifyDate:           Date;
   public isActive:             number;
   public pagePosition:         string;
   public vdpType:              string;
   public finishedSize:         string;
   public addOnFamilyName:      string;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<SfdcProduct>) {
      Object.assign(this, data);
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
         ['sfdcProductCode',       'string'],
         ['productCode',           'string'],
         ['sfdcProductName',       'string'],
         ['createUser',            'number'],
         ['createDate',            'Date'],
         ['modifyUser',            'number'],
         ['modifyDate',            'Date'],
         ['isActive',              'number'],
         ['pagePosition',          'string'],
         ['vdpType',               'string'],
         ['finishedSize',          'string'],
         ['addOnFamilyName',       'string']
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

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}