/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_CONSUMER_PURCHASING_FREQS */
export class ConsumerPurchasingFreq
{
   public consumerPurchaseFreqCode: string;                      /// Consumerpurchasefreqcd
   public createUser:               number;                      /// Fkcreateuser
   public createDate:               Date;                        /// Createdate
   public modifyUser:               number;                      /// Fkmodifyuser
   public modifyDate:               Date;                        /// Modifydate
   public consumerPurchaseFreq:     string;                      /// Consumerpurchasefreq
   public description:              string;                      /// Description
   public sortOrder:                number;                      /// Sortorder
   public isActive:                 number;                      /// Isactive
   public printSpend:               number;                      /// Printspend
   public digitalSpend:             number;                      /// Digitalspend

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ConsumerPurchasingFreq | {} = {}) {
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
         ['consumerPurchaseFreqCode',  'string'],
         ['createUser',                'number'],
         ['createDate',                'Date'],
         ['modifyUser',                'number'],
         ['modifyDate',                'Date'],
         ['consumerPurchaseFreq',      'string'],
         ['description',               'string'],
         ['sortOrder',                 'number'],
         ['isActive',                  'number'],
         ['printSpend',                'number'],
         ['digitalSpend',              'number']
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