/* tslint:disable:component-selector */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { isNotNil, isString } from '@val/common';
import { ErrorNotification, MessageBoxService, SuccessNotification } from '@val/messaging';
import { AppStateService } from 'app/services/app-state.service';
import { BatchMapService } from 'app/services/batch-map.service';
import { CreateMapExportUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../../../worker-shared/data-model/impower.data-model.enums';
import { AppProjectPrefService } from '../../../services/app-project-pref.service';
import { UserService } from '../../../services/user.service';
import { LocalAppState } from '../../../state/app.interfaces';
import {
  DiscardThenLoadProject,
  ExportApioNationalData,
  ExportGeofootprint,
  ExportLocations,
  ExportToValassisDigital,
  SaveAndReloadProject, SaveThenLoadProject
} from '../../../state/menu/menu.actions';
import { ImpProject } from '../../../val-modules/targeting/models/ImpProject';
import { BatchMapAdminComponent } from '../../dialogs/batch-map-admin/batch-map-admin.component';
import { BatchMapRequestComponent } from '../../dialogs/batch-map-request/batch-map-request.component';
import { BatchMapStatusComponent } from '../../dialogs/batch-map-status/batch-map-status.component';
import { ExistingProjectComponent, ExistingProjectResponse } from '../../dialogs/existing-project/existing-project.component';
import { ExportCrossbowSitesComponent } from '../../dialogs/export-crossbow-sites/export-crossbow-sites.component';
import { SendSitesDigitalComponent } from '../../dialogs/send-sites-digital/send-sites-digital.component';

@Component({
  selector   : 'app-menu',
  templateUrl: './app.menu.component.html',
  styleUrls  : ['./app.menu.component.scss'],
  providers  : [DialogService]
})
export class AppMenuComponent implements OnInit, OnDestroy {

  model: MenuItem[];
  isLoggedIn: boolean = false;
  currentProject: ImpProject;

  private destroyed$ = new Subject<void>();

  constructor(private store$: Store<LocalAppState>,
              private userService: UserService,
              private stateService: AppStateService,
              private locationService: ImpGeofootprintLocationService,
              private dialogService: DialogService,
              private messageService: MessageBoxService,
              private batchService: BatchMapService,
              private projectPrefService: AppProjectPrefService) {
  }

  ngOnInit() {
    this.model = [];

    this.stateService.currentProject$.pipe(
      takeUntil(this.destroyed$),
      filter(project => project != null)
    ).subscribe(project => {
      this.currentProject = project;
    });

    this.userService.userObservable.pipe(
      filter(user => user != null && user.username != null && user.username.length > 0),
      take(1)
    ).subscribe(() => {
      this.model = [
        { label: 'Save', id: 'saveProject', icon: PrimeIcons.SAVE, command: () => this.saveProject() },
        {
          label: 'Projects',
          icon : PrimeIcons.BOOK,
          items: [
            { label: 'Create New', icon: PrimeIcons.FILE_O, command: () => this.createNewProject() }, // temporarily re-wire create new button to refresh page
            { label: 'Open Existing', icon: PrimeIcons.FOLDER_OPEN, command: () => this.openExistingProject() },
            { label: 'Save', icon: PrimeIcons.SAVE, command: () => this.saveProject() }
          ]
        },
        {
          label     : 'Export',
          icon      : PrimeIcons.DOWNLOAD,
          styleClass: 'val-export-menu',
          items     : [
            {
              label  : 'Export Geofootprint - All',
              icon   : PrimeIcons.TABLE,
              command: () => this.exportGeofootprint(false),
              visible: this.userService.userHasGrants(['IMPOWER_EXPORT_GEOFOOTPRINT'])
            },
            {
              label  : 'Export Geofootprint - Selected Only',
              icon   : PrimeIcons.TABLE,
              command: () => this.exportGeofootprint(true),
              visible: this.userService.userHasGrants(['IMPOWER_EXPORT_GEOFOOTPRINT'])
            },
            {
              label  : 'Export Sites',
              icon   : PrimeIcons.FILE_EXCEL,
              command: () => this.exportLocations(ImpClientLocationTypeCodes.Site)
            },
            {
              label  : 'Export Competitors',
              icon   : PrimeIcons.FILE_EXCEL,
              command: () => this.exportLocations(ImpClientLocationTypeCodes.Competitor)
            },
            {
              label  : 'Export Online Audience National Data',
              icon   : PrimeIcons.CLOUD_DOWNLOAD,
              command: () => this.exportNationalExtract(),
              visible: this.userService.userHasGrants(['IMPOWER_EXPORT_NATIONAL'])
            },
            {
              label  : 'Send Custom Sites to Valassis Digital',
              icon   : PrimeIcons.SEND,
              command: () => this.exportToValassisDigital(),
              visible: this.userService.userHasGrants(['IMPOWER_INTERNAL_FEATURES'])
            },
            {
              label  : 'Export Crossbow Sites',
              icon   : PrimeIcons.CLOUD_UPLOAD,
              command: () => this.exportCrossbowSites()
            },
            {
              label  : 'Export Map PDFs',
              icon   : PrimeIcons.FILE_PDF,
              command: () => this.createBatchMap(),
              visible: this.userService.userHasGrants(['IMPOWER_PDF_FULL', 'IMPOWER_PDF_LIMITED'])
            },
            {
              label  : 'Copy All Geos to Clipboard',
              icon   : PrimeIcons.COPY,
              command: () => this.copyGeosToClipboard(),
            }
          ]
        },
        {
          label  : 'Batch Map Status',
          icon   : PrimeIcons.INFO_CIRCLE,
          command: () => this.getBatchMapStatus(),
          visible: this.userService.userHasGrants(['IMPOWER_PDF_FULL', 'IMPOWER_PDF_LIMITED'])
        },
        {
          label  : 'Admin Console',
          icon   : PrimeIcons.INFO_CIRCLE,
          command: () => this.getBatchMapAdminStats(),
          visible: this.userService.userHasGrants(['ACS_COMPONENT_MANAGE'])
        }
      ];
      this.isLoggedIn = true;
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  public createNewProject() {
    // this.messageService.showTwoButtonModal('Would you like to save your work before proceeding?', 'Save Work', PrimeIcons.QUESTION_CIRCLE, 'Yes', 'No')
    //     .subscribe(result => {
    //       if (result) {
    //         this.store$.dispatch(new SaveAndCreateNew());
    //       } else {
    //         this.store$.dispatch(new DiscardAndCreateNew());
    //       }
    //     });
    window.location.reload();
  }

  private openExistingProject() {
    const ref = this.dialogService.open(ExistingProjectComponent, {
      header: 'Existing Projects',
      width: '90vw',
      data: {
        user: this.userService.getUser(),
        hasExistingData: this.stateService.currentProject$.getValue().getImpGeofootprintLocations().length > 0
      }
    });
    ref.onClose.pipe(take(1)).subscribe((result: ExistingProjectResponse) => {
      if (isNotNil(result)) {
        if (result.saveFirst) {
          this.store$.dispatch(new SaveThenLoadProject({ projectToLoad: result.projectToLoad }));
        } else {
          this.store$.dispatch(new DiscardThenLoadProject({ projectToLoad: result.projectToLoad }));
        }
      }
    });
  }

  private saveProject() {
    this.stateService.closeOverlays();
    setTimeout(() => {
      this.store$.dispatch(new SaveAndReloadProject());
    }, 500);
  }

  private exportGeofootprint(selectedOnly: boolean) {
    this.store$.dispatch(new ExportGeofootprint({ selectedOnly }));
  }

  private exportLocations(locationType: SuccessfulLocationTypeCodes) {
    this.store$.dispatch(new ExportLocations({ locationType }));
  }

  private exportNationalExtract() {
    this.store$.dispatch(new ExportApioNationalData());
  }

  private exportToValassisDigital() {
    const currentProject = this.stateService.currentProject$.getValue();
    const ref = this.dialogService.open(SendSitesDigitalComponent, {
      header: 'Send Sites to Valassis Digital',
      width : '33vw',
      data  : {
        project: currentProject
      }
    });
    ref.onClose.subscribe((result: boolean | string) => {
      if (isString(result)) currentProject.clientIdentifierName = result;
      if (result) {
        this.store$.dispatch(new ExportToValassisDigital());
      }
    });
  }

  private exportCrossbowSites() {
    this.dialogService.open(ExportCrossbowSitesComponent, {
      header: 'Export Crossbow Site List',
      width : '50vw',
      data  : {
        user: this.userService.getUser()
      }
    });
  }

  private createBatchMap() {
    const currentProject = this.stateService.currentProject$.getValue();
    const isProjectSaved = this.batchService.validateProjectReadiness(currentProject, this.userService.userHasGrants(['IMPOWER_PDF_FULL']));
    if (isProjectSaved) {
      const pref = this.projectPrefService.getPref('batchMapPayload');
      const batchMapPref = pref?.largeVal ?? pref?.val ?? null;
      const batchMapPayload = JSON.parse(batchMapPref);
      this.store$.dispatch(new CreateMapExportUsageMetric('targeting', 'map', 'batch~map', this.locationService.get().length));
      const ref = this.dialogService.open(BatchMapRequestComponent, {
        width: '75vw',
        header: 'Export Map PDFs',
        data: {
          batchMapPayload,
          user: this.userService.getUser(),
          userHasFullPDFGrant: this.userService.userHasGrants(['IMPOWER_PDF_FULL']),
          projectAnalysisLevel: currentProject.methAnalysis
        }
      });
      ref.onClose.subscribe(prefs => {
        if (isNotNil(prefs)) {
          const data = JSON.stringify(prefs);
          this.projectPrefService.createPref('createsites', 'batchMapPayload', data, 'string');
        }
      });
    }
  }

  private copyGeosToClipboard() {
    const currentGeos = this.stateService.uniqueSelectedGeocodes$.getValue();
    currentGeos.sort();
    const clipString = currentGeos.join(', ');
    window.navigator.clipboard.writeText(clipString).then(() => {
      this.store$.dispatch(SuccessNotification({ message: `Copied ${currentGeos.length} geos to the clipboard`, sticky: false, life: 5000 }));
    }).catch(err => {
      this.store$.dispatch(ErrorNotification({
        message            : 'There was an error trying to copy the data to your system clipboard.',
        additionalErrorInfo: err
      }));
    });
  }

  private getBatchMapStatus() {
    this.dialogService.open(BatchMapStatusComponent, {
      width : '90vw',
      header: 'Batch Map Status',
      data  : {
        user: this.userService.getUser()
      }
    });
  }

  private getBatchMapAdminStats() {
    this.dialogService.open(BatchMapAdminComponent, {
      width : '90vw',
      header: 'Batch Map Administration'
    });
  }
}
