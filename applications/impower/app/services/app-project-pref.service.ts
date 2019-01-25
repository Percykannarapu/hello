import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { combineLatest, merge, Observable, EMPTY, of } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { calculateStatistics, filterArray, groupByExtended, mapBy, simpleFlatten } from '@val/common';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpProjectPrefService } from '../val-modules/targeting/services/ImpProjectPref.service';
import { AppConfig } from '../app.config';
import { AppStateService } from './app-state.service';
import { AppLoggingService } from './app-logging.service';
import { MetricService } from '../val-modules/common/services/metric.service';
import { ImpProjectPref } from '../val-modules/targeting/models/ImpProjectPref';
import { ProjectPrefGroupCodes } from '../val-modules/targeting/targeting.enums';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';

@Injectable({
   providedIn: 'root'
})
export class AppProjectPrefService {

   public allProjectPrefs$: Observable<ImpProjectPref[]>;
   public actProjectPrefs$: Observable<ImpProjectPref[]>;
   public totCount$: Observable<number>;
   public actCount$: Observable<number>;
   public mustCoverPrefs$: Observable<ImpProjectPref[]>;
 
   constructor(private impProjectPrefService: ImpProjectPrefService,
               private appStateService: AppStateService,
               private metricsService: MetricService,
               private config: AppConfig,
               private logger: AppLoggingService,
               private domainFactory: ImpDomainFactoryService,
               private store$: Store<LocalAppState>) {
      this.allProjectPrefs$ = this.impProjectPrefService.storeObservable.pipe(
         filter(pref => pref != null)
      );
      this.actProjectPrefs$ = this.allProjectPrefs$.pipe(
         filterArray(pref => pref.isActive)
      );
      this.totCount$ = this.allProjectPrefs$.pipe(
         map(prefs => prefs.length)
      );
      this.actCount$ = this.actProjectPrefs$.pipe(
         map(prefs => prefs.length)
      );
      // this.mustCoverPrefs$ = this.actProjectPrefs$.pipe(
      //    filterArray(pref => pref.prefGroup === ProjectPrefGroupCodes.MustCover),
      // );
   }

   public createPref(project: ImpProject, group: string, pref: string, value: string, type: string = "STRING") {
      const currentProject = this.appStateService.currentProject$.getValue();

      let impProjectPref: ImpProjectPref = this.domainFactory.createProjectPref(project, group, pref, type, value);
      if (currentProject.impProjectPrefs.filter(p => p.prefGroup === group || p.pref === pref).length === 0)
      {
         // console.log("### Added pref: ", impProjectPref);
         currentProject.impProjectPrefs.push(impProjectPref);
      }
      else
      {
         // console.log("### Did not add pref: ", pref);
         // console.log("### Num Project prefs for group: " + group + ", pref: " + pref + " = " + currentProject.impProjectPrefs.filter(p => p.prefGroup === group || p.pref === pref).length);
         // console.log("### Tot Project prefs " + currentProject.impProjectPrefs.length);
         currentProject.impProjectPrefs.forEach(pref => console.log("### pref: " + pref.pref + " = " + pref.val + ", largeVal: " + pref.largeVal));
      }
   }
 
}