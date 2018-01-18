/** A TARGETING domain class representing the table: IMPOWER.IMP_IFACE03_ZIP_MARKET_V
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

export class ImpIface03ZipMarket
{
   public zipCode:            string;
   public z3:                 string;
   public city:               string;
   public stateCode:          string;
   public cbsaCode:           string;
   public cbsaDescr:          string;
   public dmaCode:            string;
   public dmaDescr:           string;
   public censusRegionCode:   string;
   public censusRegionDescr:  string;
   public countyNum:          string;
   public countyName:         string;
   public infoscanCode:       string;
   public infoscanDescr:      string;
   public scantrackCode:      string;
   public scantrackDescr:     string;
   public isOnlyWayToGetMail: number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpIface03ZipMarket | {} = {}) {
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
         ['zipCode',             'string'],
         ['z3',                  'string'],
         ['city',                'string'],
         ['stateCode',           'string'],
         ['cbsaCode',            'string'],
         ['cbsaDescr',           'string'],
         ['dmaCode',             'string'],
         ['dmaDescr',            'string'],
         ['censusRegionCode',    'string'],
         ['censusRegionDescr',   'string'],
         ['countyNum',           'string'],
         ['countyName',          'string'],
         ['infoscanCode',        'string'],
         ['infoscanDescr',       'string'],
         ['scantrackCode',       'string'],
         ['scantrackDescr',      'string'],
         ['isOnlyWayToGetMail',  'number']
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