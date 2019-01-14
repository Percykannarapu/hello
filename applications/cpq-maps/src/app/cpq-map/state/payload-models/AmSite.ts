/** A TARGETING domain class representing the table: SDE.AM_SITES
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';

export interface AmSitePayload extends BaseModelPayload
{
   pk:            number;         /// Pk
   profile:       number;         /// Fk Profile
   xcoord:        number;         /// Xcoord
   ycoord:        number;         /// Ycoord
   siteType:      number;         /// Site Type
   legacySiteId:  string;         /// Site Id
   name:          string;         /// Name
   owner:         string;         /// Owner
   franchisee:    string;         /// Franchisee
   address:       string;         /// Address
   crossStreet:   string;         /// Cross Street
   city:          string;         /// City
   state:         string;         /// State
   zip:           string;         /// Zip
   taSource:      number;         /// Ta Source
   xmlLocation:   string;         /// Xml Location
   xmlTradearea:  string;         /// Xml Tradearea
   createType:    number;         /// Create Type
   grouping:      string;         /// Grouping
}