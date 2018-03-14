/** A CLIENT domain class representing the table: IMPOWER.IMP_CLIENTS_V
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class ImpClient
{
   public corpClientPartyNumberC:   string;
   public corpClientPartyNumber:    number;
   public corpClientPartyName:      string;
   public corpClientCatCode:        string;
   public corpClientPartyStatus:    string;
   public corpClientDunsNumber:     number;
   public corpClientPartyCrDt:      Date;
   public endClientPartyNumber:     string;
   public endClientName:            string;
   public endClientPartyCatCode:    string;
   public endClientPartyStatus:     string;
   public endClientPartyDunsNumber: number;
   public endClientPartyCrDt:       Date;
   public clientId:                 string;
   public endClientAccCode:         string;
   public endClientAccDesc:         string;
   public industryCategoryCode:     string;
   public endClientSubAccDesc:      string;
   public acctGroupPartyNumber:     string;
   public acctGroupPartyName:       string;
   public acctGroupPartyStatus:     string;
   public acctGroupPartyCatCode:    string;
   public acctGroupPartyDunsNumber: number;
   public acctGroupPartyCrDt:       Date;
   public customerNumber:           string;
   public customerName:             string;
   public custAcctStatus:           string;
   public customerCrDt:             Date;
   public thirdPartyPartyNumber:    string;
   public thirdPartyPartyName:      string;
   public newClientBusYear:         string;
   public epicorAcctNumber:         string;
   public epicorCustomerName1:      string;
   public epicorCustomerName2:      string;
   public mscNumber:                string;
   public salespersonName:          string;
   public custPrimarySalesrep:      string;
   public custPrimarySalesrepPosid: string;
   public npProductLine:            string;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpClient>) {
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
         ['corpClientPartyNumberC',    'string'],
         ['corpClientPartyNumber',     'number'],
         ['corpClientPartyName',       'string'],
         ['corpClientCatCode',         'string'],
         ['corpClientPartyStatus',     'string'],
         ['corpClientDunsNumber',      'number'],
         ['corpClientPartyCrDt',       'Date'],
         ['endClientPartyNumber',      'string'],
         ['endClientName',             'string'],
         ['endClientPartyCatCode',     'string'],
         ['endClientPartyStatus',      'string'],
         ['endClientPartyDunsNumber',  'number'],
         ['endClientPartyCrDt',        'Date'],
         ['clientId',                  'string'],
         ['endClientAccCode',          'string'],
         ['endClientAccDesc',          'string'],
         ['industryCategoryCode',      'string'],
         ['endClientSubAccDesc',       'string'],
         ['acctGroupPartyNumber',      'string'],
         ['acctGroupPartyName',        'string'],
         ['acctGroupPartyStatus',      'string'],
         ['acctGroupPartyCatCode',     'string'],
         ['acctGroupPartyDunsNumber',  'number'],
         ['acctGroupPartyCrDt',        'Date'],
         ['customerNumber',            'string'],
         ['customerName',              'string'],
         ['custAcctStatus',            'string'],
         ['customerCrDt',              'Date'],
         ['thirdPartyPartyNumber',     'string'],
         ['thirdPartyPartyName',       'string'],
         ['newClientBusYear',          'string'],
         ['epicorAcctNumber',          'string'],
         ['epicorCustomerName1',       'string'],
         ['epicorCustomerName2',       'string'],
         ['mscNumber',                 'string'],
         ['salespersonName',           'string'],
         ['custPrimarySalesrep',       'string'],
         ['custPrimarySalesrepPosid',  'string'],
         ['npProductLine',             'string']
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