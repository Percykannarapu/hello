import { ImpProjectVarPayload } from '../../payload-models/imp-project-var-payload';
import { BaseModelState, parseStatus } from './base-model-state';

export class ImpProjectVarState extends BaseModelState {
  public pvId:                      number;         /// Primary key, uniquely identifying a project variable aka audience
  public projectId:                 number;         /// The imPower Project ID
  public varPk:                     number;         /// Variable ID
  public source:                    string;         /// Data Source (ex: TDA, Interest, In-Market, Polk, IMS, IRI Data)
  public indexBase:                 string;         /// National or DMA index scoring base
  public sortOrder:                 number;         /// Order selected
  public fieldname:                 string;         /// Descriptive variable name
  public isShadedOnMap:             boolean;        /// Whether the variable is used to drive map shading
  public isIncludedInGeoGrid:       boolean;        /// Whether the variable is displayed in the application's geography grid
  public isIncludedInGeofootprint:  boolean;        /// Whether the variable is included in the geofootprint - see IMP_GEOFOOTPRINT* tables
  public isNationalExtract:         boolean;        /// Whether the variable is selected for a national export from imPower
  public isCustom:                  boolean;        /// 1 = Is a custom imPower variable
  public isString:                  boolean;        /// 1 = Value is a string
  public isNumber:                  boolean;        /// 1 = Value is a number
  public isUploaded:                boolean;        /// 1 = Is a custom audience uploaded into the imPower application
  public uploadFileName:            string;         /// Source file name if the audience was uploaded
  public customVarExprDisplay:      string;         /// Custom variable displayed expression
  public customVarExprQuery:        string;         /// Custom variable expression
  public fieldconte:                string;         /// Field contents, notably INDEX indicates an indexed value
  public decimal:                   string;         /// Decimal precision
  public isActive:                  boolean;        /// Is Active

  // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
  constructor(data?: Partial<ImpProjectVarPayload>) {
    super();
    const baseStatus = { baseStatus: parseStatus(data.baseStatus) };
    Object.assign(this, data, baseStatus);
  }
}
