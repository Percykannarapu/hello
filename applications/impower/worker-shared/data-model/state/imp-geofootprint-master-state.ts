import { ImpGeofootprintMasterPayload } from '../payloads/imp-geofootprint-master-payload';
import { BaseModelState } from './base-model-state';

export class ImpGeofootprintMasterState extends BaseModelState {
  public cgmId:                number;            /// Primary key identifying the current run for the profile.
  public projectId:            number;            /// The IMPower Project ID
  public summaryInd:           number;            /// 1 = Summary, 0 = Not summary
  public allowDuplicate:       number;            /// Indicator for allowing duplicate geos
  public createdDate:          Date = new Date(); /// Date/Time row was created
  public status:               string;            /// Indicates success or failure of geofootprint creation
  public methAnalysis:         string;            /// Method analysis level. ZIP or ATZ
  public methSeason:           string;            /// Season
  public activeLocationCount:  number;            /// Total number of active location
  public totalLocationCount:   number;            /// Total number of location
  public isMarketBased:        boolean;           /// 1 = Market based, 2 = Store based
  public isActive:             boolean;           /// Is Active

  // ----------------------------------------------------------------------------
  // ONE TO MANY RELATIONSHIP MEMBERS
  // ----------------------------------------------------------------------------
  public impGeofootprintLocations:      Array<number> = [];
  // ----------------------------------------------------------------------------

  // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
  constructor(data?: Partial<ImpGeofootprintMasterPayload>) {
    super(data);
    if (data != null) {
      const additions = {
        createdDate: new Date(data.createdDate),
        impGeofootprintLocations: (data.impGeofootprintLocations ?? []).map(l => l.glId),
      };
      Object.assign(this, additions);
    }
  }
}
