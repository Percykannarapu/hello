/** A CLIENT domain class representing the table: IMPOWER.IMP_CLIENT_SITES
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';
import { ImpClientSiteType } from './ImpClientSiteType';

export class ImpClientSite
{
   public clientSiteId:                 number;                      /// Primary Key
   public createUser:                   number;
   public createDate:                   Date;
   public modifyUser:                   number;
   public modifyDate:                   Date;
   public clientIdentifierId:           number;
   public siteNumber:                   number;
   public siteName:                     string;
   public groupName:                    string;
   public addressKey:                   string;
   public addressStyle:                 string;
   public validatedFlag:                string;
   public latitude:                     number;
   public longitude:                    number;
   public country:                      string;
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
   public isActive:                     number;

   // IMPOWER.IMP_CLIENT_SITES - MANY TO ONE RELATIONSHIP MEMBERS
   // -----------------------------------------------------------
   public clientIdentifierTypeCode:     ClientIdentifierType;        /// Cbx Client Identifier Types
   public clientSiteTypeCode:           ImpClientSiteType;           /// Client Library - Client Site Types (CLIENT, COMPETITOR etc.)

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpClientSite | {} = {}) {
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
         ['clientSiteId',                  'number'],
         ['createUser',                    'number'],
         ['createDate',                    'Date'],
         ['modifyUser',                    'number'],
         ['modifyDate',                    'Date'],
         ['clientIdentifierId',            'number'],
         ['siteNumber',                    'number'],
         ['siteName',                      'string'],
         ['groupName',                     'string'],
         ['addressKey',                    'string'],
         ['addressStyle',                  'string'],
         ['validatedFlag',                 'string'],
         ['latitude',                      'number'],
         ['longitude',                     'number'],
         ['country',                       'string'],
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
         ['clientIdentifierTypeCode',      'ClientIdentifierType'],
         ['clientSiteTypeCode',            'ImpClientSiteType']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}