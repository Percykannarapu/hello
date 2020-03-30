import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray } from '@val/common';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { LocalAppState } from '../state/app.interfaces';
import { MetricService } from '../val-modules/common/services/metric.service';
import { ImpProjectPref } from '../val-modules/targeting/models/ImpProjectPref';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpProjectPrefService } from '../val-modules/targeting/services/ImpProjectPref.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';

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

   public createPref(group: string, pref: string, value: string, type: string = 'STRING', forceLOB: boolean = false) {
      const currentProject = this.appStateService.currentProject$.getValue();
      if (currentProject == null) return;

      const impProjectPref: ImpProjectPref = this.domainFactory.createProjectPref(currentProject, group, pref, type, value, forceLOB);

      // Add the new pref to the project
      if (currentProject.impProjectPrefs.filter(p => p.prefGroup === group || p.pref === pref).length === 0)
      {
         //this.logger.debug.log("### Added pref: ", impProjectPref);
         currentProject.impProjectPrefs.push(impProjectPref);
      }

      // Add the new pref to the ImpProjectPref data store
      if (this.impProjectPrefService.get().filter(p => p.prefGroup === group && p.pref === pref).length === 0)
      {
         //this.logger.debug.log("### Added pref: ", impProjectPref);
         this.impProjectPrefService.add([impProjectPref]);
      }
   }

   private debugTestPrefs() {
      this.logger.debug.log('### getPref: Must Cover Upload = ' + this.getPref('Must Cover Upload'));
      this.logger.debug.log('### getPref: CPM_TYPE          = ' + this.getPref('CPM_TYPE'));
      this.logger.debug.log('### getPref: FAKE              = ' + this.getPref('fake'));

      this.logger.debug.log('### getPrefVal: Must Cover Upload ', this.getPrefVal('Must Cover Upload', true));
      this.logger.debug.log('### getPrefVal: CPM_TYPE          ', this.getPrefVal('CPM_TYPE', true));
      this.logger.debug.log('### getPrefVal: FAKE              ', this.getPrefVal('FAKE', true));

      this.logger.debug.log('### getPref:    Test Project JSON ', this.getPref('Test Project JSON'));
      this.logger.debug.log('### getPrefVal: Test Project JSON ', this.getPrefVal('Test Project JSON', false));
   }

   public getAllPrefs(mustBeActive: boolean = true) : ImpProjectPref[] {
      let prefs: ImpProjectPref[];
      try
      {
         prefs = this.impProjectPrefService.get();
         if (prefs === undefined)
            prefs = null;
      }
      catch (e)
      {
         this.logger.error.log(e);
         prefs = null;
      }
      finally
      {
         if (prefs === null)
            this.logger.warn.log('Could not find ' + (mustBeActive ? 'active' : '') + ' preferences');
      }

      return prefs;
   }

   public getPrefsByGroup(prefGroup: string, mustBeActive: boolean = true) : ImpProjectPref[] {
      let prefs: ImpProjectPref[];
      try
      {
         //this.debugTestPrefs();
         prefs = this.impProjectPrefService.get().filter(p => p.prefGroup != null && p.prefGroup.toUpperCase().trim() === prefGroup.toUpperCase().trim()
                                                           && (mustBeActive === false || (mustBeActive && p.isActive)));
         if (prefs === undefined)
            prefs = null;
         // this.impProjectPrefService.get().forEach(pref => this.logger.debug.log("### prefservice: " + pref));
      }
      catch (e)
      {
         this.logger.error.log(e);
         prefs = null;
      }
      finally
      {
         if (prefs === null)
            this.logger.warn.log('Could not find ' + (mustBeActive ? 'active' : '') + ' preferences for group: [' + prefGroup + ']');
      }

      return prefs;
   }


   public getPref(prefKey: string, mustBeActive: boolean = true) : ImpProjectPref {
      let pref: ImpProjectPref;
      try
      {
         pref = this.impProjectPrefService.get().filter(p => p.pref.toUpperCase().trim() === prefKey.toUpperCase().trim()
                                                          && (mustBeActive === false || (mustBeActive && p.isActive)))[0];
         if (pref === undefined)
            pref = null;
      }
      catch (e)
      {
         this.logger.error.log(e);
         pref = null;
      }
      finally
      {
         if (pref === null)
            this.logger.warn.log('Could not find ' + (mustBeActive ? 'an active' : '') + ' preference by key: [' + prefKey + ']');
      }

      return pref;
   }

   public getPrefVal(prefKey: string, mustBeActive: boolean = true) : string {
      let pref: ImpProjectPref;
      let prefVal: string = null;
      try
      {
         pref = this.getPref(prefKey, mustBeActive);
         if (pref === null)
            return null;
         else
            prefVal = (pref.largeVal != null) ? pref.largeVal : pref.val;
      }
      catch (e)
      {
         this.logger.error.log(e);
      }

      return prefVal;
   }

   public debugShowPrefs()
   {
      this.impProjectPrefService.debugLogStore('Project Prefs');
   }
}
