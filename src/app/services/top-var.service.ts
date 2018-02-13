import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

export interface DemographicVariable {
  fieldName: string;
  label: string;
}

const data: DemographicVariable[] = [
  { fieldName: 'CL0C00', label: '% \'17 HHs Families with Related Children < 18 Yrs'},
  { fieldName: 'CL0C01', label: '% \'17 HHs Families with No Related Children < 18 Yrs'},
  { fieldName: 'CL0C03', label: '% \'17 HHs, Families w/ Related Children < 5 Only'},
  { fieldName: 'CL0C04', label: '% \'17 HHs, Families w/ Related Children 5-17 Only'},
  { fieldName: 'CL0PE5', label: '% \'17 Pop Age 25+, Associate Degree'},
  { fieldName: 'CL0PE6', label: '% \'17 Pop Age 25+, Bachelor\'s Degree'},
  { fieldName: 'CL0PE7', label: '% \'17 Pop Age 25+, Master\'s Degree'},
  { fieldName: 'CL0PE9', label: '% \'17 Pop Age 25+, Doctorate Degree'},
  { fieldName: 'CL0PHM', label: '% \'17 Pop Hispanic or Latino, Mexican'},
  { fieldName: 'CL0PS2', label: '% \'17 Pop Age 15+ Married Spouse Present'},
  { fieldName: 'CL0PW3', label: '% \'17 Pop Age 16+, in Labor Force, Civilian Unemp'},
  { fieldName: 'CL0UB9', label: '2017 Median Year Structure Built'},
  { fieldName: 'CL0UBA', label: '% \'17 Housing Units Built Before 1940'},
  { fieldName: 'CL0UBB', label: '% \'17 Housing Units Built in 1940-1949'},
  { fieldName: 'CL0UBC', label: '% \'17 Housing Units Built in 1950-1959'},
  { fieldName: 'CL0UBD', label: '% \'17 Housing Units Built in 1960-1969'},
  { fieldName: 'CL0UBE', label: '% \'17 Housing Units Built in 1970-1979'},
  { fieldName: 'CL0UBF', label: '% \'17 Housing Units Built in 1980-1989'},
  { fieldName: 'CL0UBG', label: '% \'17 Housing Units Built in 1990-1999'},
  { fieldName: 'CL0UTR', label: '% 2017 Renter Occupied Housing Units'},
  { fieldName: 'CL0UTW', label: '% 2017 Owner Occupied Housing Units'},
  { fieldName: 'CL0UU2', label: '% \'17 HUs, w/HUs 3-4 Units'},
  { fieldName: 'CL0UU6', label: '% \'17 HUs, w/HUs 50+ Units'},
  { fieldName: 'CL0UW0', label: '2017 Owner Occ Housing Units'},
  { fieldName: 'CL2A00', label: '2017 Median Age Total Pop 18+'},
  { fieldName: 'CL2A0009', label: '% \'17 Pop Age 0-9'},
  { fieldName: 'CL2A1014', label: '% \'17 Pop Age 10-14'},
  { fieldName: 'CL2A1517', label: '% \'17 Pop Age 15-17'},
  { fieldName: 'CL2A1519', label: '% \'17 Pop Age 15-19'},
  { fieldName: 'CL2A1820', label: '% \'17 Pop Age 18-20'},
  { fieldName: 'CL2A1821', label: '% \'17 Pop Age 18-21'},
  { fieldName: 'CL2A2029', label: '% \'17 Pop Age 20-29'},
  { fieldName: 'CL2A2124', label: '% \'17 Pop Age 21-24'},
  { fieldName: 'CL2A2224', label: '% \'17 Pop Age 22-24'},
  { fieldName: 'CL2A2529', label: '% \'17 Pop Age 25-29'},
  { fieldName: 'CL2A2554', label: '% \'17 Pop Age 25-54'},
  { fieldName: 'CL2A3034', label: '% \'17 Pop Age 30-34'},
  { fieldName: 'CL2A3039', label: '% \'17 Pop Age 30-39'},
  { fieldName: 'CL2A3539', label: '% \'17 Pop Age 35-39'},
  { fieldName: 'CL2A4044', label: '% \'17 Pop Age 40-44'},
  { fieldName: 'CL2A4049', label: '% \'17 Pop Age 40-49'},
  { fieldName: 'CL2A4549', label: '% \'17 Pop Age 45-49'},
  { fieldName: 'CL2A5054', label: '% \'17 Pop Age 50-54'},
  { fieldName: 'CL2A5059', label: '% \'17 Pop Age 50-59'},
  { fieldName: 'CL2A5559', label: '% \'17 Pop Age 55-59'},
  { fieldName: 'CL2A6000', label: '% \'17 Pop Age 60 +'},
  { fieldName: 'CL2A6064', label: '% \'17 Pop Age 60-64'},
  { fieldName: 'CL2A6500', label: '% \'17 Pop Age 65 +'},
  { fieldName: 'CL2A7000', label: '% \'17 Pop Age 70 +'},
  { fieldName: 'CL2F00', label: '% \'17 Pop Female'},
  { fieldName: 'CL2F1821', label: '% \'17 Pop Female, Age 18-21'},
  { fieldName: 'CL2F2029', label: '% \'17 Pop Female, Age 20-29'},
  { fieldName: 'CL2F2224', label: '% \'17 Pop Female, Age 22-24'},
  { fieldName: 'CL2F2529', label: '% \'17 Pop Female, Age 25-29'},
  { fieldName: 'CL2F2554', label: '% \'17 Pop Female, Age 25-54'},
  { fieldName: 'CL2F3034', label: '% \'17 Pop Female, Age 30-34'},
  { fieldName: 'CL2F3039', label: '% \'17 Pop Female, Age 30-39'},
  { fieldName: 'CL2F3539', label: '% \'17 Pop Female, Age 35-39'},
  { fieldName: 'CL2F4044', label: '% \'17 Pop Female, Age 40-44'},
  { fieldName: 'CL2F4049', label: '% \'17 Pop Female, Age 40-49'},
  { fieldName: 'CL2F4549', label: '% \'17 Pop Female, Age 45-49'},
  { fieldName: 'CL2F5054', label: '% \'17 Pop Female, Age 50-54'},
  { fieldName: 'CL2F5059', label: '% \'17 Pop Female, Age 50-59'},
  { fieldName: 'CL2F5559', label: '% \'17 Pop Female, Age 55-59'},
  { fieldName: 'CL2F6000', label: '% \'17 Pop Female, Age 60 +'},
  { fieldName: 'CL2HA0', label: '2017 Median Age of HHr'},
  { fieldName: 'CL2HA5', label: '% \'17 HHs w/HHr Age 55-64'},
  { fieldName: 'CL2HA6', label: '% \'17 HHs w/HHr Age 65-74'},
  { fieldName: 'CL2HA7', label: '% \'17 HHs w/HHr Age 75-84'},
  { fieldName: 'CL2HA8', label: '% \'17 HHs w/HHr Age 85+'},
  { fieldName: 'CL2HSZ', label: '2017 Average Household Size'},
  { fieldName: 'CL2HWV', label: '2017 Median Value, Owner Occ Housing Units'},
  { fieldName: 'CL2I00', label: '2017 Median Household Income'},
  { fieldName: 'CL2I02', label: '% \'17 HHs w/HH Inc < $10K'},
  { fieldName: 'CL2I0K', label: '% \'17 HHs w/HH Inc < $30,000'},
  { fieldName: 'CL2I0O', label: '% \'17 HHs w/HH Inc $40,000 +'},
  { fieldName: 'CL2I0P', label: '% \'17 HHs w/HH Inc $75,000 +'},
  { fieldName: 'CL2I0R', label: '% \'17 HHs w/HH Inc $50K +'},
  { fieldName: 'CL2I0S', label: '% \'17 HHs w/HH Inc $100K +'},
  { fieldName: 'CL2I0T', label: '% \'17 HHs w/HH Inc $150K +'},
  { fieldName: 'CL2I0U', label: '% \'17 HHs w/HH Inc $200K +'},
  { fieldName: 'CL2M00', label: '% \'17 Pop Male'},
  { fieldName: 'CL2M4049', label: '% \'17 Pop Male, Age 40-49'},
  { fieldName: 'CL2M5059', label: '% \'17 Pop Male, Age 50-59'},
  { fieldName: 'CL2M6000', label: '% \'17 Pop Male, Age 60 +'},
  { fieldName: 'CL2PRA', label: '% \'17 Pop Asian Alone Non-Hisp'},
  { fieldName: 'CL2PRB', label: '% \'17 Pop Black Alone Non-Hisp'},
  { fieldName: 'CL2PRH', label: '% \'17 Pop Hispanic or Latino'},
  { fieldName: 'CL2PRW', label: '% \'17 Pop White Alone Non-Hisp'},
  { fieldName: 'CL2W00', label: '2017 Median Household Net Worth'},
  { fieldName: 'CLHSPF25', label: '% \'17 Pop Hispanic or Latino: Female, Age 25-34'},
  { fieldName: 'CLHSPF35', label: '% \'17 Pop Hispanic or Latino: Female, Age 35-44'},
  { fieldName: 'CLHSPF45', label: '% \'17 Pop Hispanic or Latino: Female, Age 45-49'},
  { fieldName: 'CLPFS4', label: '% \'17 Pop 15+ Female, Now Married, Spouse Present'}];

@Injectable()
export class TopVarService {

  private allTopVars: BehaviorSubject<DemographicVariable[]> = new BehaviorSubject<DemographicVariable[]>([]);
  private selectedTopVar: BehaviorSubject<DemographicVariable> = new BehaviorSubject<DemographicVariable>(null);

  constructor() {}

  public getAllTopVars() : Observable<DemographicVariable[]> {
    if (this.allTopVars.getValue().length === 0) {
      // TODO: when the top vars can be pulled dynamically from a rest service, replace this with an HTTP call
      // (or possibly a call to a val-module service)
      this.allTopVars.next(data);
    }
    return this.allTopVars.asObservable();
  }

  public getSelectedTopVar() : Observable<DemographicVariable> {
    return this.selectedTopVar.asObservable();
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
      } else {
        // TODO: error handling?
      }
    }
  }
}
