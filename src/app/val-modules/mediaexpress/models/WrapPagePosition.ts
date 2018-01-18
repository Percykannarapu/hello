/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_WRAP_PAGE_POSITIONS
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

export class WrapPagePosition
{
   public wrapPagePositionCode: string;                /// Wrap Page Position Cd
   public createUser:           number;                /// Fk Create User
   public createDate:           Date;                  /// Create Date
   public modifyUser:           number;                /// Fk Modify User
   public modifyDate:           Date;                  /// Modify Date
   public wrapPagePosition:     string;                /// Wrap Page Position
   public isDefault:            number;                /// Is Default
   public isCover:              number;                /// Is Cover
   public isInside:             number;                /// Is Inside
   public isActive:             number;                /// Is Active
   public isFirstDefault:       number;                /// Is First Default
   public isSecondDefault:      number;                /// Is Second Default
   public isThirdDefault:       number;                /// Is Third Default
   public sortOrder:            number;                /// Sort Order
   public isBackPage:           number;                /// Is Back Page
   public isInsideFront:        number;                /// Is Inside Front
   public isInsideBack:         number;                /// Is Inside Back

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: WrapPagePosition | {} = {}) {
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
         ['wrapPagePositionCode',  'string'],
         ['createUser',            'number'],
         ['createDate',            'Date'],
         ['modifyUser',            'number'],
         ['modifyDate',            'Date'],
         ['wrapPagePosition',      'string'],
         ['isDefault',             'number'],
         ['isCover',               'number'],
         ['isInside',              'number'],
         ['isActive',              'number'],
         ['isFirstDefault',        'number'],
         ['isSecondDefault',       'number'],
         ['isThirdDefault',        'number'],
         ['sortOrder',             'number'],
         ['isBackPage',            'number'],
         ['isInsideFront',         'number'],
         ['isInsideBack',          'number']
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