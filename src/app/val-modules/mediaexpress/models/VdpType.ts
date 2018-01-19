/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_VDP_TYPES
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

export class VdpType
{
   public vdpTypeCode:          string;                    /// Vdp Type Cd
   public createUser:           number;                    /// Fk Create User
   public createDate:           Date;                      /// Create Date
   public modifyUser:           number;                    /// Fk Modify User
   public modifyDate:           Date;                      /// Modify Date
   public vdpType:              string;                    /// Vdp Type
   public isDefault:            number;                    /// Is Default
   public sortOrder:            number;                    /// Sort Order

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: VdpType | {} = {}) {
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
         ['vdpTypeCode',           'string'],
         ['createUser',            'number'],
         ['createDate',            'Date'],
         ['modifyUser',            'number'],
         ['modifyDate',            'Date'],
         ['vdpType',               'string'],
         ['isDefault',             'number'],
         ['sortOrder',             'number']
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