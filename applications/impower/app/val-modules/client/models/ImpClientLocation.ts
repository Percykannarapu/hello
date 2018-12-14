import { BaseModel } from './../../api/models/BaseModel';
/** A CLIENT domain class representing the table: IMPOWER.IMP_CLIENT_LOCATIONS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';
import { ImpClientLocationType } from './ImpClientLocationType';

export class ImpClientLocation extends BaseModel
{
   public clientLocationId:             number;                       /// Primary Key
   public createUser:                   number;
   public createDate:                   Date;
   public modifyUser:                   number;
   public modifyDate:                   Date;
   public clientIdentifierId:           number;
   public locationNumber:               number;
   public locationName:                 string;
   public groupName:                    string;
   public addressKey:                   string;
   public addressStyle:                 string;
   public validatedFlag:                string;
   public latitude:                     number;
   public longitude:                    number;
   public country:                      string;
   public origAddress1:                 string;
   public origCity:                     string;
   public origState:                    string;
   public origPostalCode:               string;
   public address1:                     string;
   public address2:                     string;
   public address3:                     string;
   public address4:                     string;
   public city:                         string;
   public state:                        string;
   public province:                     string;
   public postalCode:                   string;
   public postalPlus4Code:              string;
   public county:                       string;
   public apartmentFlag:                string;
   public apartmentNumber:              string;
   public poBoxNumber:                  string;
   public streetSuffix:                 string;
   public building:                     string;
   public floor:                        string;
   public suite:                        string;
   public room:                         string;
   public salesTaxGeocode:              string;
   public salesTaxInsideCityLimiti:     string;
   public shortDescription:             string;
   public description:                  string;
   public addressEffectiveDate:         Date;
   public addressExpirationDate:        Date;
   public addressErrorCode:             string;
   public geocoderMatchCode:            string;
   public geocoderLocationCode:         string;
   public recordStatusCode:             string;
   public isActive:                     number;

   // IMPOWER.IMP_CLIENT_LOCATIONS - MANY TO ONE RELATIONSHIP MEMBERS
   // ---------------------------------------------------------------
   public clientIdentifierType:         ClientIdentifierType;         /// Cbx Client Identifier Types
   public impClientLocationType:        ImpClientLocationType;        /// Client Library - Client Location Types (CLIENT, COMPETITOR etc.)

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpClientLocation>) {
      super();
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
         ['clientLocationId',              'number'],
         ['createUser',                    'number'],
         ['createDate',                    'Date'],
         ['modifyUser',                    'number'],
         ['modifyDate',                    'Date'],
         ['clientIdentifierId',            'number'],
         ['locationNumber',                'number'],
         ['locationName',                  'string'],
         ['groupName',                     'string'],
         ['addressKey',                    'string'],
         ['addressStyle',                  'string'],
         ['validatedFlag',                 'string'],
         ['latitude',                      'number'],
         ['longitude',                     'number'],
         ['country',                       'string'],
         ['origAddress1',                  'string'],
         ['origCity',                      'string'],
         ['origState',                     'string'],
         ['origPostalCode',                'string'],
         ['address1',                      'string'],
         ['address2',                      'string'],
         ['address3',                      'string'],
         ['address4',                      'string'],
         ['city',                          'string'],
         ['state',                         'string'],
         ['province',                      'string'],
         ['postalCode',                    'string'],
         ['postalPlus4Code',               'string'],
         ['county',                        'string'],
         ['apartmentFlag',                 'string'],
         ['apartmentNumber',               'string'],
         ['poBoxNumber',                   'string'],
         ['streetSuffix',                  'string'],
         ['building',                      'string'],
         ['floor',                         'string'],
         ['suite',                         'string'],
         ['room',                          'string'],
         ['salesTaxGeocode',               'string'],
         ['salesTaxInsideCityLimiti',      'string'],
         ['shortDescription',              'string'],
         ['description',                   'string'],
         ['addressEffectiveDate',          'Date'],
         ['addressExpirationDate',         'Date'],
         ['addressErrorCode',              'string'],
         ['geocoderMatchCode',             'string'],
         ['geocoderLocationCode',          'string'],
         ['recordStatusCode',              'string'],
         ['isActive',                      'number']
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
         // MANY TO ONE RELATIONSHIP MEMBERS
         ['clientIdentifierType',          'ClientIdentifierType'],
         ['impClientLocationType',         'ImpClientLocationType']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}
