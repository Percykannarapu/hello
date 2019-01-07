/** A TARGETING domain class representing the table: IMPOWER.IMP_CL_ZIP_GEO_XREF
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class ImpClZipGeoXref
{
   public zip:               string;
   public subzip:            string;
   public effectiveDate:     Date;
   public ziptype:           string;
   public ziphh:             number;
   public zippop:            number;
   public city:              string;
   public countyNum:         string;
   public countyName:        string;
   public countyDesignation: string;
   public countyhh:          number;
   public statefip:          string;
   public statename:         string;
   public stateCode:         string;
   public statehh:           number;
   public dmaCode:           string;
   public dmaDescr:          string;
   public dmahh:             number;
   public prizmcode:         string;
   public prizmclustername:  string;
   public prizmvalue:        number;
   public prizmnatlavg:      string;
   public metrocbsacode:     string;
   public metrocbsaname:     string;
   public metrocbsahh:       number;
   public microcbsacode:     string;
   public microcbsaname:     string;
   public microcbsahh:       number;
   public infoscanCode:      string;
   public infoscanDescr:     string;
   public infoscanhh:        number;
   public scantrackCode:     string;
   public scantrackDescr:    string;
   public scantrackhh:       number;
   public msacode:           string;
   public msaname:           string;
   public msahh:             number;
   public areasquaremile:    number;
   public longitude:         number;
   public latitude:          number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpClZipGeoXref>) {
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
         ['zip',                'string'],
         ['subzip',             'string'],
         ['effectiveDate',      'Date'],
         ['ziptype',            'string'],
         ['ziphh',              'number'],
         ['zippop',             'number'],
         ['city',               'string'],
         ['countyNum',          'string'],
         ['countyName',         'string'],
         ['countyDesignation',  'string'],
         ['countyhh',           'number'],
         ['statefip',           'string'],
         ['statename',          'string'],
         ['stateCode',          'string'],
         ['statehh',            'number'],
         ['dmaCode',            'string'],
         ['dmaDescr',           'string'],
         ['dmahh',              'number'],
         ['prizmcode',          'string'],
         ['prizmclustername',   'string'],
         ['prizmvalue',         'number'],
         ['prizmnatlavg',       'string'],
         ['metrocbsacode',      'string'],
         ['metrocbsaname',      'string'],
         ['metrocbsahh',        'number'],
         ['microcbsacode',      'string'],
         ['microcbsaname',      'string'],
         ['microcbsahh',        'number'],
         ['infoscanCode',       'string'],
         ['infoscanDescr',      'string'],
         ['infoscanhh',         'number'],
         ['scantrackCode',      'string'],
         ['scantrackDescr',     'string'],
         ['scantrackhh',        'number'],
         ['msacode',            'string'],
         ['msaname',            'string'],
         ['msahh',              'number'],
         ['areasquaremile',     'number'],
         ['longitude',          'number'],
         ['latitude',           'number']
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
