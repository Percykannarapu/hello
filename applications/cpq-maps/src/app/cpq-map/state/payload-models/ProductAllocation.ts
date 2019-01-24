/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_PRODUCT_ALLOCATIONS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';
import { PpToWrapPagePayload } from './PpToWrapPage';

export interface ProductAllocationPayload extends BaseModelPayload
{
   productAllocationId:   number;         /// Primary key uniquely identifying a product allocation row
   createUser:            number;         /// User to create the row
   createDate:            Date;           /// Date/Time row was created
   modifyUser:            number;         /// User to modify the row
   modifyDate:            Date;           /// Date/Time row was modified
   advertiserInfoId:      number;         /// Foreign key to cbx_advertiser_info.advertiser_info_id
   productCode:           string;         /// Foreign key to cbx_products.product_cd
   estimatedCpm:          number;         /// Estimated CPM for the product
   pctBudgetAllocated:    number;         /// Percentage of budget allocated
   npSundayDailyEd:       string;         /// Newspaper sunday daily edition
   smIncludeAnne:         number;         /// Shared mail include anne
   smIncludeNonWeekly:    number;         /// Shared mail include non-weekly
   dtNumFlight:           number;         /// Display number of flights
   isActive:              boolean;        /// 1 = Active, 0 = InActive
   smAnneCpm:             number;         /// Shared mail anne cpm
   buySeq:                number;         /// Buying sequence
   atzCharge:             number;         /// ATZ charge
   emailIncludeAtz:       number;         /// Email include ATZ charge
   wrapIncludeNonWeekly:  number;         /// Wrap include non-weekly
   customerNumber:        string;         /// Customer number
   smIncludeVdp:          number;         /// Sm Include Vdp
   wrapPagePriorityCode:  string;         /// FOREIGN KEY to CBX_WRAP_PAGE_PRIORITY
   isRunAvail:            boolean;        /// Is Run Avail
   finishedSize:          string;         /// Fk Finished Size
   pieceWeight:           number;         /// Piece Weight
   flatFee:               number;         /// Flat Fee
   vdpTypeCode:           string;         /// Fk Vdp Type Cd
   entryPointCode:        string;         /// Fk Entry Point Cd
   sfdcProductCode:       string;

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   ppToWrapPages:      Array<PpToWrapPagePayload>;
   // ----------------------------------------------------------------------------
}