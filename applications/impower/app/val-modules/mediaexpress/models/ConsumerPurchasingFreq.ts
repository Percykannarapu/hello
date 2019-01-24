/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_CONSUMER_PURCHASING_FREQS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class ConsumerPurchasingFreq
{
   public consumerPurchaseFreqCode:   string;                      /// Consumer Purchase Freq Cd
   public createUser:                 number;                      /// Fk Create User
   public createDate:                 Date;                        /// Create Date
   public modifyUser:                 number;                      /// Fk Modify User
   public modifyDate:                 Date;                        /// Modify Date
   public consumerPurchaseFreq:       string;                      /// Consumer Purchase Freq
   public description:                string;                      /// Description
   public sortOrder:                  number;                      /// Sort Order
   public isActive:                   number;                      /// Is Active
   public printSpend:                 number;                      /// Print Spend
   public digitalSpend:               number;                      /// Digital Spend

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ConsumerPurchasingFreq>) {
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
         ['consumerPurchaseFreqCode',    'string'],
         ['createUser',                  'number'],
         ['createDate',                  'Date'],
         ['modifyUser',                  'number'],
         ['modifyDate',                  'Date'],
         ['consumerPurchaseFreq',        'string'],
         ['description',                 'string'],
         ['sortOrder',                   'number'],
         ['isActive',                    'number'],
         ['printSpend',                  'number'],
         ['digitalSpend',                'number']
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
