/** A MEDIAPLANNING domain class representing the table: IMPOWER.IMP_PRODUCTS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class ImpProduct
{
   public productCd:            string;                    /// Primary key uniquely identifying a product
   public createUser:           number;                    /// User to create the row
   public createDate:           Date;                      /// Date/Time row was created
   public modifyUser:           number;                    /// User to modify the row
   public modifyDate:           Date;                      /// Date/Time row was modified
   public productName:          string;                    /// Descriptive product name
   public sortOrder:            number;                    /// Order that this product should be processed
   public isActive:             number;                    /// 1 = Active, 0 = InActive
   public isPrint:              number;                    /// 1 = Print product, 0 = Not a print product
   public isDigital:            number;                    /// 1 = Digital product, 0 = Not a digital product
   public mediaType:            number;                    /// Number identifying the type of media
   public minEfficiency:        number;                    /// Minimum efficiency for this product
   public minPenetration:       number;                    /// Minimum penetration for this product
   public productId:            number;                    /// ID of the product
   public floorCpm:             number;                    /// Floor cpm
   public floorAnneCpm:         number;                    /// Floor anne cpm
   public useFilter:            number;                    /// Indicates if product is filterable by variables
   public placementMinimum:     number;                    /// Placement minimum
   public isQuickAvail:         number;                    /// Is Quick Avail Enabled for given Product
   public isAddOn:              number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpProduct>) {
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
         ['productCd',             'string'],
         ['createUser',            'number'],
         ['createDate',            'Date'],
         ['modifyUser',            'number'],
         ['modifyDate',            'Date'],
         ['productName',           'string'],
         ['sortOrder',             'number'],
         ['isActive',              'number'],
         ['isPrint',               'number'],
         ['isDigital',             'number'],
         ['mediaType',             'number'],
         ['minEfficiency',         'number'],
         ['minPenetration',        'number'],
         ['productId',             'number'],
         ['floorCpm',              'number'],
         ['floorAnneCpm',          'number'],
         ['useFilter',             'number'],
         ['placementMinimum',      'number'],
         ['isQuickAvail',          'number'],
         ['isAddOn',               'number']
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
