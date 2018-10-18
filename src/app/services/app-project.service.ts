import { Injectable } from '@angular/core';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { TransactionManager } from '../val-modules/common/services/TransactionManager.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { AppMessagingService } from './app-messaging.service';
import { AppLoggingService } from './app-logging.service';

@Injectable()
export class AppProjectService {

  private projectIsLoading = new BehaviorSubject<boolean>(false);
  public projectIsLoading$: Observable<boolean> = this.projectIsLoading.asObservable();
  public currentProject$: Observable<ImpProject>;

  constructor(private impProjectService: ImpProjectService,
              private messagingService: AppMessagingService,
              private domainFactory: ImpDomainFactoryService,
              private logger: AppLoggingService,
              private projectTransactionManager: TransactionManager,
              private restService: RestDataService) {
    this.currentProject$ = this.impProjectService.storeObservable.pipe(
      filter(projects => projects != null && projects.length > 0 && projects[0] != null),
      map(projects => projects[0]),
    );
  }

  load(id: number, setLoadFlag: boolean = true) : Observable<void> {
    const inExistingTransaction: boolean = this.projectTransactionManager.inTransaction();
    if (!inExistingTransaction) this.projectTransactionManager.startTransaction();
    if (setLoadFlag) this.projectIsLoading.next(true);
    this.messagingService.startSpinnerDialog('LOAD_PROJECT', `Loading Project ${id}`);
    return Observable.create(observer => {
      this.impProjectService.loadFromServer(id).subscribe(
        null,
        err => {
          this.messagingService.stopSpinnerDialog('LOAD_PROJECT');
          observer.error(err);
        },
        () => {
          this.messagingService.stopSpinnerDialog('LOAD_PROJECT');
          if (!inExistingTransaction) this.projectTransactionManager.stopTransaction();
          if (setLoadFlag) this.projectIsLoading.next(false);
          observer.next();
          observer.complete();
        });
    });
  }

  save(project?: ImpProject, reloadAfter: boolean = true) : Observable<number> {
    const localProject = project == null ? this.impProjectService.get()[0] : project;
    const saveUrl = 'v1/targeting/base/impproject/deleteSave';
    this.projectTransactionManager.startTransaction();
    let newProjectId: number = null;
    if (reloadAfter) this.projectIsLoading.next(true);
    this.messagingService.startSpinnerDialog('SAVE_PROJECT', 'Saving Project');
    return Observable.create(observer => {
      this.cleanupProject(localProject);
      this.logger.info('Project being saved', JSON.stringify(localProject));
      this.restService.post(saveUrl, localProject).subscribe(
        response => newProjectId = response.payload,
        err => {
          this.projectTransactionManager.stopTransaction();
          this.messagingService.stopSpinnerDialog('SAVE_PROJECT');
          observer.error(err);
        },
        () => {
          this.messagingService.stopSpinnerDialog('SAVE_PROJECT');
          if (newProjectId != null && reloadAfter) {
            this.load(newProjectId, false).subscribe(
              null,
              err => {
                this.projectTransactionManager.stopTransaction();
                observer.error(err);
              },
              () => {
                this.projectIsLoading.next(false);
                this.projectTransactionManager.stopTransaction();
                observer.next(newProjectId);
                observer.complete();
              }
            );
          } else {
            // no reload - just complete the transaction
            this.projectTransactionManager.stopTransaction();
            observer.next(newProjectId);
            observer.complete();
          }
        });
    });
  }

  createNew() : void {
    this.projectIsLoading.next(true);
    const newProject = this.domainFactory.createProject();
    this.impProjectService.load([newProject]);
    this.projectIsLoading.next(false);
  }

  projectIsValid() : boolean {
    const impProject = this.impProjectService.get()[0];
    let errorString = '';
    if (impProject.projectName == null || impProject.projectName === '')
      errorString = 'imPower Project Name is required';
    if (impProject.methAnalysis == null || impProject.methAnalysis === '')
      errorString  = errorString + '\n Analysis Level is required';
    if (errorString !== ''){
      this.messagingService.showErrorNotification('Error Saving Project', errorString);
      return false;
    }
    return true;
  }

  private cleanupProject(localProject: ImpProject) {
    // not saving project prefs right now
    localProject.impProjectPrefs = [];
    // filter out empty location attributes
    localProject.getImpGeofootprintLocations().forEach(loc => {
      loc.impGeofootprintLocAttribs = loc.impGeofootprintLocAttribs.filter(atr => atr.attributeValue !== '');
    });
    // remove geovars
    localProject.getImpGeofootprintTradeAreas().forEach(ta => {
      ta.impGeofootprintVars = [];
    });
  }

}
