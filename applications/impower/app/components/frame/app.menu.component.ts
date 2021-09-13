/* tslint:disable:component-selector */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmationPayload, ErrorNotification, ShowConfirmation, SuccessNotification } from '@val/messaging';
import { AppStateService } from 'app/services/app-state.service';
import { BatchMapService } from 'app/services/batch-map.service';
import { CreateMapExportUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../../worker-shared/data-model/impower.data-model.enums';
import { UserService } from '../../services/user.service';
import { LocalAppState } from '../../state/app.interfaces';
import { BatchMapAdminDialogOpen, OpenBatchMapDialog } from '../../state/batch-map/batch-map.actions';
import {
  ClientNmaeForValassisDigitalDialog,
  DiscardAndCreateNew,
  ExportApioNationalData,
  ExportGeofootprint,
  ExportLocations,
  OpenExistingProjectDialog,
  OpenExportCrossbowSitesDialog,
  SaveAndCreateNew,
  SaveAndReloadProject
} from '../../state/menu/menu.actions';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { BatchMapStatusComponent } from '../dialogs/batch-map-status/batch-map-status.component';

@Component({
  selector: 'app-menu',
  templateUrl: './app.menu.component.html',
  styleUrls: ['./app.menu.component.scss'],
  providers: [DialogService]
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
              private batchService: BatchMapService) {
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
        {label: 'Save', id: 'saveProject', icon: PrimeIcons.SAVE, command: () => this.saveProject()},
        {
          label: 'Projects',
          icon: PrimeIcons.BOOK,
          items: [
            {label: 'Create New', icon: PrimeIcons.FILE_O, command: () => this.refreshPage()}, // temporarily re-wire create new button to refresh page
            {label: 'Open Existing', icon: PrimeIcons.FOLDER_OPEN, command: () => this.store$.dispatch(new OpenExistingProjectDialog())},
            {label: 'Save', icon: PrimeIcons.SAVE, command: () => this.saveProject()}
          ]
        },
        {
          label: 'Export',
          icon: PrimeIcons.DOWNLOAD,
          styleClass: 'val-export-menu',
          items: [
            {
              label: 'Export Geofootprint - All',
              icon: PrimeIcons.TABLE,
              command: () => this.exportGeofootprint(false),
              visible: this.userService.userHasGrants(['IMPOWER_EXPORT_GEOFOOTPRINT'])
            },
            {
              label: 'Export Geofootprint - Selected Only',
              icon: PrimeIcons.TABLE,
              command: () => this.exportGeofootprint(true),
              visible: this.userService.userHasGrants(['IMPOWER_EXPORT_GEOFOOTPRINT'])
            },
            {
              label: 'Export Sites',
              icon: PrimeIcons.FILE_EXCEL,
              command: () => this.exportLocations(ImpClientLocationTypeCodes.Site)
            },
            {
              label: 'Export Competitors',
              icon: PrimeIcons.FILE_EXCEL,
              command: () => this.exportLocations(ImpClientLocationTypeCodes.Competitor)
            },
            {
              label: 'Export Online Audience National Data',
              icon: PrimeIcons.CLOUD_DOWNLOAD,
              command: () => this.store$.dispatch(new ExportApioNationalData()),
              visible: this.userService.userHasGrants(['IMPOWER_EXPORT_NATIONAL'])
            },
            {
              label: 'Send Custom Sites to Valassis Digital',
              icon: PrimeIcons.SEND,
              command: () => this.exportToValassisDigital(),
              visible: this.userService.userHasGrants(['IMPOWER_INTERNAL_FEATURES'])
            },
            {
              label: 'Export Crossbow Sites',
              icon: PrimeIcons.CLOUD_UPLOAD,
              command: () => this.store$.dispatch(new OpenExportCrossbowSitesDialog())
            },
            {
              label: 'Export Map PDFs',
              icon: PrimeIcons.FILE_PDF,
              command: () => this.createBatchMap(),
              visible: this.userService.userHasGrants(['IMPOWER_PDF_FULL', 'IMPOWER_PDF_LIMITED'])
            },
            {
              label: 'Copy All Geos to Clipboard',
              icon: PrimeIcons.COPY,
              command: () => this.copyGeosToClipboard(),
            }
          ]
        },
        {
          label: 'Batch Map Status',
          icon: PrimeIcons.INFO_CIRCLE,
          command: () => this.getBatchMapStatus(),
          visible: this.userService.userHasGrants(['IMPOWER_PDF_FULL', 'IMPOWER_PDF_LIMITED'])
        },
        {
          label: 'Admin Console',
          icon: PrimeIcons.INFO_CIRCLE,
          command: () => this.getAdminStats(),
          visible: this.userService.userHasGrants(['ACS_COMPONENT_MANAGE'])
        }
      ];
      this.isLoggedIn = true;
    });
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  private getBatchMapStatus() {
    this.dialogService.open(BatchMapStatusComponent, {
      width: '90vw',
      header: 'Batch Map Status',
      data: {
        user: this.userService.getUser()
      }
    });
  }

    private getAdminStats(){
       this.store$.dispatch(new BatchMapAdminDialogOpen());
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
    this.store$.dispatch(new ExportLocations({locationType}));
  }

  private createBatchMap() {
    const currentProject = this.stateService.currentProject$.getValue();
    const isProjectSaved = this.batchService.validateProjectReadiness(currentProject);
    if (isProjectSaved) {
      this.store$.dispatch(new CreateMapExportUsageMetric('targeting', 'map', 'batch~map', this.locationService.get().length));
      this.store$.dispatch(new OpenBatchMapDialog());
    }
  }

  private copyGeosToClipboard() {
    const currentGeos = this.stateService.uniqueSelectedGeocodes$.getValue();
    currentGeos.sort();
    const clipString = currentGeos.join(', ');
    window.navigator.clipboard.writeText(clipString).then(() => {
      this.store$.dispatch(SuccessNotification({ message: `Copied ${currentGeos.length} geos to the clipboard`, sticky: false, life: 5000 }));
    }).catch(err => {
      this.store$.dispatch(ErrorNotification({ message: 'There was an error trying to copy the data to your system clipboard.', additionalErrorInfo: err }));
    });
  }

  private exportToValassisDigital() {
    this.store$.dispatch(new ClientNmaeForValassisDigitalDialog());
  }

  public refreshPage() {
    window.location.reload();
  }

  public createNewProject() {
    const payload: ConfirmationPayload = {
      title: 'Save Work',
      message: 'Would you like to save your work before proceeding?',
      canBeClosed: false,
      accept: {
        result: new SaveAndCreateNew()
      },
      reject: {
        result: new DiscardAndCreateNew()
      }
    };
    this.store$.dispatch(new ShowConfirmation(payload));
  }
}
