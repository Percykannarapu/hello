/** A TARGETING domain class representing the table: SDE.AM_PROFILES
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';
import { AmSitePayload } from './AmSite';

export interface AmProfilePayload extends BaseModelPayload
{
   pk:                number;         /// Pk
   createUser:        number;         /// Fk Create User
   group:             number;         /// Fk Group
   createDate:        Date;           /// Create Date
   name:              string;         /// Name
   description:       string;         /// Description
   clientId:          string;         /// Client Id
   methAccess:        number;         /// Meth Access
   methAnalysis:      string;         /// Meth Analysis
   methDistribution:  string;         /// Meth Distribution
   methSeason:        string;         /// Meth Season
   taSource:          number;         /// Ta Source
   xmlVariable:       string;         /// Xml Variables
   xmlTradearea:      string;         /// Xml Tradearea
   xmlSicquery:       string;         /// Xml Sicquery
   modifyUser:        number;         /// Fk Modify User
   modifyDate:        Date;           /// Modify Date

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   sites:                  Array<AmSitePayload>;
   // ----------------------------------------------------------------------------
}