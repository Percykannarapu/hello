/** This is a model representing the Discovery Input screen
 ** There is a good chance this will be temporary in favor of ImpProjects and other models.
 ** We are using this hand written model in the interim to make the initial release.
 **/
export class ImpDiscoveryUI
{
   public productCode:              string;
   public industryCategoryCode:     string;                        /// Industry Categories from IMO (QSR, Soft Goods, Home Improvement, etc.
   public analysisLevel:            string;
   public selectedSeason:           string;
   public cpm:                      number;
   public totalBudget:              number;                        /// Total budget populated into opt_i_trade_areas
   public circBudget:               number;
   public includeNonWeekly:         boolean;
   public includeValassis:          boolean;
   public includePob:               boolean;
   public includeAnne:              boolean;
   public includeSolo:              boolean;
   public projectTrackerId:         number;
   public industryCategoryName:     string;
   public isBlended:                boolean;
   public isDefinedbyOwnerGroup:    boolean;
   public valassisCPM:              number;
   public anneCPM:                  number;
   public soloCPM:                  number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpDiscoveryUI | {} = {}) {
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
         ['productCode',             'string'],
         ['industryCategoryCode',    'string'],
         ['analysisLevel',           'string'],
         ['selectedSeason',          'number'],
         ['cpm',                     'number'],
         ['totalBudget',             'number'],
         ['circBudget',              'number'],
         ['includeNonWeekly',        'boolean'],
         ['includeValassis',         'boolean'],
         ['includePob',              'boolean'],
         ['includeAnne',             'boolean'],
         ['includeSolo',             'boolean'],
         ['isBlended',               'boolean'],
         ['isDefinedbyOwnerGroup',   'boolean'],
         ['includeValassisSM',       'number'],
         ['includeAnneSM',           'number'],
         ['includeSoloSM',           'number']
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