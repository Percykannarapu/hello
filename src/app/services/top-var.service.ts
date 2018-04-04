import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { UsageService, UsageTypes } from './usage.service';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ValGeoService } from './app-geo.service';
import { Subscription } from 'rxjs/Subscription';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { AppMessagingService } from './app-messaging.service';
import { chunkArray } from '../app.utils';
import { AppConfig } from '../app.config';
import { concat } from 'rxjs/observable/concat';

export interface DemographicCategory {
  '@ref': number;
  'pk': number;
  'tablename': string;
  'tabledesc': string;
  'sort': number;
  'accessType': string;
}

export interface CategoryVariable {
  '@ref': number;
  'tablename': string;
  'fieldnum': string;
  'fieldname': string;
  'fielddescr': string;
  'fieldtype': string;
  'fieldconte': string;
  'decimals': string;
  'source': string;
  'userAccess': string;
  'varFormat': string;
  'natlAvg': string;
  'avgType': string;
  'pk': string;
  'includeInCb': string;
  'includeInDatadist': string;
}

export interface DemographicVariable {
  fieldName: string;
  label: string;
}

interface GeoVariableData {
  variableFormat: string;
  variableName: string;
  variableType: string;
  variableValue: number;
}

const data: DemographicVariable[] = [
  { fieldName: 'SOLO_S', label: 'Solo Count, Summer' },
  { fieldName: 'SOLO_W', label: 'Solo Count, Winter' },
  { fieldName: 'SMC_S', label: 'Shared Count, Summer' },
  { fieldName: 'SMC_W', label: 'Shared Count, Winter' },
  { fieldName: 'APTCNT_S', label: 'Apartment Count, Summer' },
  { fieldName: 'APTCNT_W', label: 'Apartment Count, Winter' },
  { fieldName: 'PERCAPTS', label: '% Apartments, Summer' },
  { fieldName: 'PERCAPTW', label: '% Apartments, Winter' },
  { fieldName: 'SFDU_S', label: 'Single Family Dwelling Units, Summer' },
  { fieldName: 'SFDU_W', label: 'Single Family Dwelling Units, Winter' },
  { fieldName: 'PERSFDUS', label: '% Single Family Dwelling Units, Summer' },
  { fieldName: 'PERSFDUW', label: '% Single Family Dwelling Units, Winter' },
  { fieldName: 'ANNECNTS', label: 'ANNE Count, Summer' },
  { fieldName: 'ANNECNTW', label: 'ANNE Count, Winter' },
  { fieldName: 'METRO_CBSA_HHC', label: 'Metro CBSA Households' },
  { fieldName: 'MICRO_CBSA_HHC', label: 'Micro CBSA Households' },
  { fieldName: 'DMA_HHC', label: 'DMA Households' },
  { fieldName: 'COUNTY_HHC', label: 'County Households' },
  { fieldName: 'STATE_HHC', label: 'State Households' },
  { fieldName: 'HHLD_S', label: 'Households, Summer' },
  { fieldName: 'HHLD_W', label: 'Households, Winter' },
  { fieldName: 'NEWS_COUNT', label: 'Newspaper Household Count' },
  { fieldName: 'PCD_COUNT', label: 'PCD Household Count' },
  { fieldName: 'MAIL_COUNT_SUMMER', label: 'Mail Count Summer' },
  { fieldName: 'MAIL_COUNT_WINTER', label: 'Mail Count Winter' },
  { fieldName: 'NEWS_MAIL_COUNT', label: 'News Mail Count' },
  { fieldName: 'FREQUENCY_CNT_PRIMARY', label: 'Frequency Count Primary' },
  { fieldName: 'FREQUENCY_CNT_SECONDARY', label: 'Frequency Count Secondary' },
  { fieldName: 'IHWEEK_REMAINING', label: 'In Home Weeks Remaining' },
  { fieldName: 'NUM_DIRECT_PARENTS', label: 'Number of Direct Parents' },
  { fieldName: 'POB_SCOUNT', label: 'POB Summer Count' },
  { fieldName: 'POB_WCOUNT', label: 'POB Winter Count' },
  { fieldName: 'VDP_S', label: 'VDP Count, Summer' },
  { fieldName: 'VDP_W', label: 'VDP Count, Winter' },
  { fieldName: 'CL0C00', label: '% \'17 HHs Families with Related Children < 18 Yrs' },
  { fieldName: 'CL0C01', label: '% \'17 HHs Families with No Related Children < 18 Yrs' },
  { fieldName: 'CL0C03', label: '% \'17 HHs, Families w/ Related Children < 5 Only' },
  { fieldName: 'CL0C04', label: '% \'17 HHs, Families w/ Related Children 5-17 Only' },
  { fieldName: 'CL0PHM', label: '% \'17 Pop Hispanic or Latino, Mexican' },
  { fieldName: 'CL2F00', label: '% \'17 Pop Female' },
  { fieldName: 'CL2HA5', label: '% \'17 HHs w/HHr Age 55-64' },
  { fieldName: 'CL2HA6', label: '% \'17 HHs w/HHr Age 65-74' },
  { fieldName: 'CL2HA7', label: '% \'17 HHs w/HHr Age 75-84' },
  { fieldName: 'CL2HA8', label: '% \'17 HHs w/HHr Age 85+' },
  { fieldName: 'CL2HSZ', label: '2017 Average Household Size' },
  { fieldName: 'CL2I02', label: '% \'17 HHs w/HH Inc < $10K' },
  { fieldName: 'CL2I0K', label: '% \'17 HHs w/HH Inc < $30,000' },
  { fieldName: 'CL2I0O', label: '% \'17 HHs w/HH Inc $40,000 +' },
  { fieldName: 'CL2I0P', label: '% \'17 HHs w/HH Inc $75,000 +' },
  { fieldName: 'CL2I0R', label: '% \'17 HHs w/HH Inc $50K +' },
  { fieldName: 'CL2I0S', label: '% \'17 HHs w/HH Inc $100K +' },
  { fieldName: 'CL2I0T', label: '% \'17 HHs w/HH Inc $150K +' },
  { fieldName: 'CL2I0U', label: '% \'17 HHs w/HH Inc $200K +' },
  { fieldName: 'CL2M00', label: '% \'17 Pop Male' },
  { fieldName: 'CL2PRA', label: '% \'17 Pop Asian Alone Non-Hisp' },
  { fieldName: 'CL2PRB', label: '% \'17 Pop Black Alone Non-Hisp' },
  { fieldName: 'CL2PRH', label: '% \'17 Pop Hispanic or Latino' },
  { fieldName: 'CL2PRW', label: '% \'17 Pop White Alone Non-Hisp' },
  { fieldName: 'OCCHB', label: '% \'17 HHs w/ Black Alone, Not Hisp HHr' },
  { fieldName: 'OCCHBA', label: '% \'17 HHs, Black or African American Alone HHr' },
  { fieldName: 'OCCHH', label: '% \'17 HHs w/ Hispanic HHr' },
  { fieldName: 'CL2A0009', label: '% \'17 Pop Age 0-9' },
  { fieldName: 'CL2A1014', label: '% \'17 Pop Age 10-14' },
  { fieldName: 'CL2A1517', label: '% \'17 Pop Age 15-17' },
  { fieldName: 'CL2A1519', label: '% \'17 Pop Age 15-19' },
  { fieldName: 'CL2A1820', label: '% \'17 Pop Age 18-20' },
  { fieldName: 'CL2A1821', label: '% \'17 Pop Age 18-21' },
  { fieldName: 'CL2A2029', label: '% \'17 Pop Age 20-29' },
  { fieldName: 'CL2A2124', label: '% \'17 Pop Age 21-24' },
  { fieldName: 'CL2A2224', label: '% \'17 Pop Age 22-24' },
  { fieldName: 'CL2A2529', label: '% \'17 Pop Age 25-29' },
  { fieldName: 'CL2A2554', label: '% \'17 Pop Age 25-54' },
  { fieldName: 'CL2A3034', label: '% \'17 Pop Age 30-34' },
  { fieldName: 'CL2A3039', label: '% \'17 Pop Age 30-39' },
  { fieldName: 'CL2A3539', label: '% \'17 Pop Age 35-39' },
  { fieldName: 'CL2A4044', label: '% \'17 Pop Age 40-44' },
  { fieldName: 'CL2A4049', label: '% \'17 Pop Age 40-49' },
  { fieldName: 'CL2A4549', label: '% \'17 Pop Age 45-49' },
  { fieldName: 'CL2A5054', label: '% \'17 Pop Age 50-54' },
  { fieldName: 'CL2A5059', label: '% \'17 Pop Age 50-59' },
  { fieldName: 'CL2A5559', label: '% \'17 Pop Age 55-59' },
  { fieldName: 'CL2A6000', label: '% \'17 Pop Age 60 +' },
  { fieldName: 'CL2A6064', label: '% \'17 Pop Age 60-64' },
  { fieldName: 'CL2A6500', label: '% \'17 Pop Age 65 +' },
  { fieldName: 'CL2A7000', label: '% \'17 Pop Age 70 +' },
  { fieldName: 'CL2F1821', label: '% \'17 Pop Female, Age 18-21' },
  { fieldName: 'CL2F2029', label: '% \'17 Pop Female, Age 20-29' },
  { fieldName: 'CL2F2224', label: '% \'17 Pop Female, Age 22-24' },
  { fieldName: 'CL2F2529', label: '% \'17 Pop Female, Age 25-29' },
  { fieldName: 'CL2F2554', label: '% \'17 Pop Female, Age 25-54' },
  { fieldName: 'CL2F3034', label: '% \'17 Pop Female, Age 30-34' },
  { fieldName: 'CL2F3039', label: '% \'17 Pop Female, Age 30-39' },
  { fieldName: 'CL2F3539', label: '% \'17 Pop Female, Age 35-39' },
  { fieldName: 'CL2F4044', label: '% \'17 Pop Female, Age 40-44' },
  { fieldName: 'CL2F4049', label: '% \'17 Pop Female, Age 40-49' },
  { fieldName: 'CL2F4549', label: '% \'17 Pop Female, Age 45-49' },
  { fieldName: 'CL2F5054', label: '% \'17 Pop Female, Age 50-54' },
  { fieldName: 'CL2F5059', label: '% \'17 Pop Female, Age 50-59' },
  { fieldName: 'CL2F5559', label: '% \'17 Pop Female, Age 55-59' },
  { fieldName: 'CL2F6000', label: '% \'17 Pop Female, Age 60 +' },
  { fieldName: 'CL2M4049', label: '% \'17 Pop Male, Age 40-49' },
  { fieldName: 'CL2M5059', label: '% \'17 Pop Male, Age 50-59' },
  { fieldName: 'CL2M6000', label: '% \'17 Pop Male, Age 60 +' },
  { fieldName: 'CL0PE5', label: '% \'17 Pop Age 25+, Associate Degree' },
  { fieldName: 'CL0PE6', label: '% \'17 Pop Age 25+, Bachelor\'s Degree' },
  { fieldName: 'CL0PE7', label: '% \'17 Pop Age 25+, Master\'s Degree' },
  { fieldName: 'CL0PE9', label: '% \'17 Pop Age 25+, Doctorate Degree' },
  { fieldName: 'CL0PW3', label: '% \'17 Pop Age 16+, in Labor Force, Civilian Unemp' },
  { fieldName: 'CL0UB9', label: '2017 Median Year Structure Built' },
  { fieldName: 'CL0UBA', label: '% \'17 Housing Units Built Before 1940' },
  { fieldName: 'CL0UBB', label: '% \'17 Housing Units Built in 1940-1949' },
  { fieldName: 'CL0UBC', label: '% \'17 Housing Units Built in 1950-1959' },
  { fieldName: 'CL0UBD', label: '% \'17 Housing Units Built in 1960-1969' },
  { fieldName: 'CL0UBE', label: '% \'17 Housing Units Built in 1970-1979' },
  { fieldName: 'CL0UBF', label: '% \'17 Housing Units Built in 1980-1989' },
  { fieldName: 'CL0UBG', label: '% \'17 Housing Units Built in 1990-1999' },
  { fieldName: 'CL0UTR', label: '% 2017 Renter Occupied Housing Units' },
  { fieldName: 'CL0UTW', label: '% 2017 Owner Occupied Housing Units' },
  { fieldName: 'CL0UU2', label: '% \'17 HUs, w/HUs 3-4 Units' },
  { fieldName: 'CL0UU6', label: '% \'17 HUs, w/HUs 50+ Units' },
  { fieldName: 'CL0UW0', label: '2017 Owner Occ Housing Units' },
  { fieldName: 'CL2HWV', label: '2017 Median Value, Owner Occ Housing Units' },
  { fieldName: 'Y2LH02', label: '% \'17 Pop Age 5+ Language at Home, Spanish' },
  { fieldName: 'CL0PS2', label: '% \'17 Pop Age 15+ Married Spouse Present' },
  { fieldName: 'CL2A00', label: '2017 Median Age Total Pop 18+' },
  { fieldName: 'CL2HA0', label: '2017 Median Age of HHr' },
  { fieldName: 'CL2I00', label: '2017 Median Household Income' },
  { fieldName: 'CL2W00', label: '2017 Median Household Net Worth' },
  { fieldName: 'CLPFS4', label: '% \'17 Pop 15+ Female, Now Married, Spouse Present' },
  { fieldName: 'GO00', label: 'Fats & Oils' },
  { fieldName: 'R003', label: 'Food Away from Home Lunch Fast Food' },
  { fieldName: 'R005', label: 'Food Away from Home Dinner Fast Food' },
  { fieldName: 'DF11', label: 'Mattresses/ Springs' },
  { fieldName: 'SEG0', label: 'Grocery Stores' },
  { fieldName: 'HSPNNOTI', label: '% \'17 HHs w/HH Language: Spanish, Not Isolated' },
  { fieldName: 'CLHSPF25', label: '% \'17 Pop Hispanic or Latino: Female, Age 25-34' },
  { fieldName: 'CLHSPF35', label: '% \'17 Pop Hispanic or Latino: Female, Age 35-44' },
  { fieldName: 'CLHSPF45', label: '% \'17 Pop Hispanic or Latino: Female, Age 45-49' },
  { fieldName: 'VS_A_IDX', label: 'Prospect Value Indicator A Index' },
  { fieldName: 'VS_A_PCT', label: '% 2017 HHs Prospect Value Indicator A' },
  { fieldName: 'VS_B_IDX', label: 'Prospect Value Indicator B Index' },
  { fieldName: 'VS_B_PCT', label: '% 2017 HHs Prospect Value Indicator B' },
  { fieldName: 'VS_C_IDX', label: 'Prospect Value Indicator C Index' },
  { fieldName: 'VS_C_PCT', label: '% 2017 HHs Prospect Value Indicator C' },
  { fieldName: 'VS_D_IDX', label: 'Prospect Value Indicator D Index' },
  { fieldName: 'VS_D_PCT', label: '% 2017 HHs Prospect Value Indicator D' },
  { fieldName: 'VS_E_IDX', label: 'Prospect Value Indicator E Index' },
  { fieldName: 'VS_E_PCT', label: '% 2017 HHs Prospect Value Indicator E' },
  { fieldName: 'NUM_IP_ADDRS', label: 'EST GEO IP ADDRESSES' },
  { fieldName: 'NLA029', label: 'Hobbies: Cooking Idx' },
  { fieldName: 'NLA084', label: 'Pets: Own a Dog Idx' },
  { fieldName: 'NLA107', label: 'Sports: Hunting: Big Game Idx' },
  { fieldName: 'HIGH_TECH', label: '% HH ConneXions Technodoption: High-Tech' },
  { fieldName: 'LO_TECH', label: '% HH ConneXions Technodoption: Lo-Tech' },
  { fieldName: 'MID_TECH', label: '% HH ConneXions Technodoption: Mid-Tech' },
  { fieldName: 'NO_TECH', label: '% HH ConneXions Technodoption: No-Tech' },
  { fieldName: 'TAP049', label: 'Casual Dining: 10+ Times Past 30 Days' },
  { fieldName: 'TAP106', label: 'Fast Food: 10 or More Times Past 30 Days' },
  { fieldName: 'TAP109', label: 'Fast Food: Pizza' },
  { fieldName: 'TAP116', label: 'Fast Food: Domino\'s Pizza' },
  { fieldName: 'TAP123', label: 'Fast Food: Pizza Hut' },
  { fieldName: 'TAP169', label: 'Grocery Stores: Publix' },
  { fieldName: 'TAP178', label: 'Grocery Stores: Walmart Supercenter' },
  { fieldName: 'TAP181', label: 'Grocery Stores: Winn Dixie' },
  { fieldName: 'TAP199', label: 'Health Insurance: Medicaid, Public Assistance, or Welfare' },
  { fieldName: 'TAP200', label: 'Health Insurance: Medicare' },
  { fieldName: 'TAP201', label: 'Health Insurance: PPO' },
  { fieldName: 'TAP203', label: 'Health Insurance: None' },
  { fieldName: 'TAP298', label: 'Self-employed OR Small Business Owner' }
];

@Injectable()
export class TopVarService implements OnDestroy {
  private readonly subscription: Subscription;
  private readonly spinnerKey: string = 'TopVarServiceKey';

  private allTopVars: BehaviorSubject<DemographicVariable[]> = new BehaviorSubject<DemographicVariable[]>([]);
  private selectedTopVar: BehaviorSubject<DemographicVariable> = new BehaviorSubject<DemographicVariable>(null);
  private appliedTdaAudience: BehaviorSubject<CategoryVariable[]> = new BehaviorSubject<CategoryVariable[]>([]);
  private previousGeocodes: Set<string> = new Set();
  private previousVariables: Set<CategoryVariable> = new Set();
  private selectedTdaAudience: BehaviorSubject<CategoryVariable[]> = new BehaviorSubject<CategoryVariable[]>([]);

  public selectedTopVar$: Observable<DemographicVariable> = this.selectedTopVar.asObservable();
  public appliedTdaAudience$: Observable<CategoryVariable[]> = this.appliedTdaAudience.asObservable();
  public selectedTdaAudience$: Observable<CategoryVariable[]> = this.selectedTdaAudience.asObservable();

  constructor(private restService: RestDataService, private geoService: ValGeoService,
              private discoveryService: ImpDiscoveryService, private attributeService: ImpGeofootprintGeoAttribService,
              private usageService: UsageService, private messagingService: AppMessagingService,
              private config: AppConfig) {
    this.subscription = combineLatest(this.appliedTdaAudience$, this.geoService.uniqueSelectedGeocodes$, this.discoveryService.storeObservable)
      .subscribe(([variables, geocodes, disc]) => this.setGeoVariables(variables, geocodes, disc[0]));
  }

  private static mapGeoAttributes(fuseData: any) : Map<string, Map<number, GeoVariableData>> {
    const result = new Map();
    for (const [geocode, variables] of Object.entries(fuseData)) {
      const geoMap = new Map();
      for (const [pk, varData] of Object.entries(variables)) {
        geoMap.set(Number(pk), varData);
      }
      result.set(geocode, geoMap);
    }
    return result;
  }

  public ngOnDestroy() : void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  public getAllTopVars() : Observable<DemographicVariable[]> {
    if (this.allTopVars.getValue().length === 0) {
      // TODO: when the top vars can be pulled dynamically from a rest service, replace this with an HTTP call
      // (or possibly a call to a val-module service)
      this.allTopVars.next(data);
    }
    return this.allTopVars.asObservable();
  }

  public getSelectedTopVar() : DemographicVariable {
    return this.selectedTopVar.getValue();
  }

  public selectTopVar(newTopVar: DemographicVariable) : void {
    if (newTopVar == null) {
      this.selectedTopVar.next(null);
    } else {
      const candidates = this.allTopVars.getValue().filter(dv => {
        return dv.fieldName === newTopVar.fieldName;
      });
      if (candidates && candidates.length > 0) {
        this.selectedTopVar.next(candidates[0]);
        this.usageService.createCounterMetric(UsageTypes.targetingAudienceOfflineChecked, candidates[0].fieldName + '~' + candidates[0].label, 1);
      } else {
        // TODO: error handling?
      }
    }
  }

  public applyAudienceSelection() : void {
    this.appliedTdaAudience.next(this.selectedTdaAudience.getValue());
  }

  public selectTdaVariable(variable: CategoryVariable) : void {
    const dataSet = new Set(this.selectedTdaAudience.getValue());
    dataSet.add(variable);
    this.selectedTdaAudience.next(Array.from(dataSet));
    this.usageService.createCounterMetric(UsageTypes.targetingAudienceOfflineChecked, variable.fieldname + '~' + variable.fielddescr, 1);
  }

  public removeTdaVariable(variable: CategoryVariable) : void {
    const dataSet = new Set(this.selectedTdaAudience.getValue());
    dataSet.delete(variable);
    this.selectedTdaAudience.next(Array.from(dataSet));
    this.usageService.createCounterMetric(UsageTypes.targetingAudienceOfflineChecked, variable.fieldname + '~' + variable.fielddescr, 1);
  }

  public getDemographicCategories() : Observable<DemographicCategory[]> {
    return this.restService.get('v1/targeting/base/amtabledesc/search?q=amtabledesc').pipe(
      map((result: any) => result.payload.rows as DemographicCategory[])
    );
  }

  public getVariablesByCategory(categoryName: string) : Observable<CategoryVariable[]> {
    return this.restService.get(`v1/targeting/base/cldesctab/search?q=cldesctab&tablename=${categoryName}`).pipe(
      map((result: any) => result.payload.rows as CategoryVariable[])
    );
  }

  public getGeoData(analysisLevel: string, geocodes: string[], tdaPks: string[]) : Observable<any> {
    const chunks = chunkArray(geocodes, this.config.maxGeosPerGeoInfoQuery);
    const observables = [];
    this.messagingService.startSpinnerDialog(this.spinnerKey, 'Retrieving data');
    for (const chunk of chunks) {
      const inputData = {
        geoType: analysisLevel,
        geocodes: chunk,
        variablePks: tdaPks.map(pk => Number(pk)).filter(pk => !Number.isNaN(pk))
      };
      console.log('Sending geoinfo chunk to Fuse');
      observables.push(this.restService.post('v1/mediaexpress/base/geoinfo/lookup', inputData));
    }
    return concat(...observables);
  }

  private setGeoVariables(variables: CategoryVariable[], geocodes: string[], discElement: ImpDiscoveryUI) : void {
    if (discElement == null) return; //startup condition
    const addedGeos = geocodes.filter(g => !this.previousGeocodes.has(g));
    const addedVars = Array.from(variables).filter(v => !this.previousVariables.has(v));
    this.previousGeocodes = new Set(geocodes);
    this.previousVariables = new Set(variables);
    if (addedGeos.length > 0 && this.previousVariables.size > 0) {
      const pks = Array.from(this.previousVariables).map(v => v.pk);
      const geoSub = this.getGeoData(discElement.analysisLevel, addedGeos, pks).pipe(
        map(response => response.payload.data)
      ).subscribe(
        resData => this.persistGeoAttributes(TopVarService.mapGeoAttributes(resData)),
        err => this.handleFuseError(err),
        () => {
          geoSub.unsubscribe();
          this.messagingService.stopSpinnerDialog(this.spinnerKey);
        });
    }
    if (addedVars.length > 0 && this.previousGeocodes.size > 0) {
      const geos = Array.from(this.previousGeocodes);
      const varSub = this.getGeoData(discElement.analysisLevel, geos, addedVars.map(v => v.pk)).pipe(
        map(response => response.payload.data)
      ).subscribe(
        resData => this.persistGeoAttributes(TopVarService.mapGeoAttributes(resData)),
        err => this.handleFuseError(err),
        () => {
          varSub.unsubscribe();
          this.messagingService.stopSpinnerDialog(this.spinnerKey);
        });
    }
  }

  private persistGeoAttributes(geoDataMap: Map<string, Map<number, GeoVariableData>>) : void {
    const geoKeys = Array.from(geoDataMap.keys());
    let allAttributes = [];
    for (const geo of geoKeys) {
      const dataKeys = Array.from(geoDataMap.get(geo).keys());
      for (const dataKey of dataKeys) {
        const variable = geoDataMap.get(geo).get(dataKey);
        const attribute = new ImpGeofootprintGeoAttrib({
          attributeCode: variable.variableName,
          attributeValue: variable.variableValue,
          attributeType: 'Geofootprint Variable'
        });
        allAttributes = allAttributes.concat(this.geoService.createAttributesForGeos(geo, attribute));
      }
    }
    console.log('Geo Data Attributes being added to store:', allAttributes);
    this.attributeService.add(allAttributes);
  }

  private handleFuseError(err) {
    console.error(err);
    this.messagingService.showGrowlError('Error', 'There was an error retrieving data');
    this.messagingService.stopSpinnerDialog(this.spinnerKey);
  }
}
