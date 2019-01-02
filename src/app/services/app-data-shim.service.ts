import { Injectable } from '@angular/core';
import { AppProjectService } from './app-project.service';
import { TargetAudienceService } from './target-audience.service';
import { AppStateService } from './app-state.service';
import { AppTradeAreaService } from './app-trade-area.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppState } from '../state/app.interfaces';
import { Store } from '@ngrx/store';
import { ErrorNotification } from '../messaging';

/**
 * This service is a temporary shim to aggregate the operations needed for saving & loading data
 * until the data is held natively in NgRx and can be removed after that
 */

@Injectable({
  providedIn: 'root'
})
export class AppDataShimService {

  constructor(private appProjectService: AppProjectService,
              private appStateService: AppStateService,
              private appTradeAreaService: AppTradeAreaService,
              private targetAudienceService: TargetAudienceService,
              private store$: Store<AppState>) { }

  save() : Observable<number> {
    return this.appProjectService.save();
  }

  load(id: number) : Observable<number> {
    this.targetAudienceService.clearAll();
    this.appStateService.clearUserInterface();
    return this.appProjectService.load(id);
  }

  onLoadSuccess() : void {
    this.targetAudienceService.applyAudienceSelection();
    this.appTradeAreaService.zoomToTradeArea();
  }

  createNew() : void {
    this.targetAudienceService.clearAll();
    this.appStateService.clearUserInterface();
    this.appProjectService.createNew();
  }

  validateProject(project: ImpProject) : boolean {
    const errors = this.appProjectService.validateProject(project);
    if (errors.length > 0) {
      this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Invalid Project', message: errors.join('\n') }));
      return false;
    }
    return true;
  }
}
