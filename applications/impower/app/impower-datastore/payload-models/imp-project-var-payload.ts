import { BaseModelPayload } from './base-model-payload';

export interface ImpProjectVarPayload extends BaseModelPayload {
   pvId:                      number;         /// Primary key, uniquely identifying a project variable aka audience
   projectId:                 number;         /// The imPower Project ID
   varPk:                     number;         /// Variable ID
   source:                    string;         /// Data Source (ex: TDA, Interest, In-Market, Polk, IMS, IRI Data)
   indexBase:                 string;         /// National or DMA index scoring base
   sortOrder:                 number;         /// Order selected
   fieldname:                 string;         /// Descriptive variable name
   isShadedOnMap:             boolean;        /// Whether the variable is used to drive map shading
   isIncludedInGeoGrid:       boolean;        /// Whether the variable is displayed in the application's geography grid
   isIncludedInGeofootprint:  boolean;        /// Whether the variable is included in the geofootprint - see IMP_GEOFOOTPRINT* tables
   isNationalExtract:         boolean;        /// Whether the variable is selected for a national export from imPower
   isCustom:                  boolean;        /// 1 = Is a custom imPower variable
   isString:                  boolean;        /// 1 = Value is a string
   isNumber:                  boolean;        /// 1 = Value is a number
   isUploaded:                boolean;        /// 1 = Is a custom audience uploaded into the imPower application
   uploadFileName:            string;         /// Source file name if the audience was uploaded
   customVarExprDisplay:      string;         /// Custom variable displayed expression
   customVarExprQuery:        string;         /// Custom variable expression
   fieldconte:                string;         /// Field contents, notably INDEX indicates an indexed value
   decimal:                   string;         /// Decimal precision
   isActive:                  boolean;        /// Is Active
}
