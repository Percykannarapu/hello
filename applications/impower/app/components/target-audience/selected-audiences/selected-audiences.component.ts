import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { WarningNotification } from '@val/messaging';
import { MoveAudienceDn, MoveAudienceUp } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { RemoveVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { AppLoggingService } from 'app/services/app-logging.service';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AppStateService } from '../../../services/app-state.service';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { LocalAppState } from '../../../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../../../state/usage/targeting-usage.actions';

@Component({
  selector: 'val-selected-audiences',
  templateUrl: './selected-audiences.component.html',
  styleUrls: ['./selected-audiences.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SelectedAudiencesComponent implements OnInit {
  audiences$: Observable<Audience[]>;
  hasAudiences: boolean = false;
  public showDialog: boolean = false;
  public audienceUnselect: Audience;
  public dialogboxWarningmsg: string = '';
  public dialogboxHeader: string = '';
  public gridFilter: boolean;
  public gfpFilter: boolean;

  private nationalAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
  public audienceCount: number = 0;

  private combineAudiences;
  private allAudiences: Audience[] = [];
  constructor(private varService: TargetAudienceService,
              private appStateService: AppStateService,
              private confirmationService: ConfirmationService,
              private logger: AppLoggingService,
              private store$: Store<LocalAppState>) {
    this.store$.select(fromAudienceSelectors.getAudiencesNationalExtract).subscribe(this.nationalAudiencesBS$);
  }

  public ngOnInit() : void {
    this.gfpFilter = true;
    // Setup an observable to watch the store for audiences
    this.audiences$ = this.store$.select(fromAudienceSelectors.allAudiences).pipe(
      filter(audiences => audiences != null),
    );
    this.audiences$.pipe(
      filter(a => a.length > 0),
    ).subscribe(a => this.audienceCount = a.length);

    this.audiences$.subscribe(audiences => {
      this.hasAudiences = audiences.length > 0;
    });

    this.appStateService.analysisLevel$.subscribe(() => {
      this.nationalAudiencesBS$.value.forEach(aud => {
        aud.exportNationally = false;
        this.varService.updateProjectVars(aud);
      });
    });

    this.store$.select(fromAudienceSelectors.getAllAudiences).pipe(
      filter(allAudiences => allAudiences != null ),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Combined' || aud.audienceSourceType === 'Converted' || aud.audienceSourceType === 'Combined/Converted' || aud.audienceSourceType === 'Composite')),
    ).subscribe(audiences => {
      this.combineAudiences =  Array.from(new Set(audiences));
    });

    this.store$.select(fromAudienceSelectors.getAllAudiences).pipe(
      filter(allAudiences => allAudiences != null)
    ).subscribe(audiences => this.allAudiences = audiences);
  }

  public onApplyClicked() {
    if (this.appStateService.analysisLevel$.getValue() == null || this.appStateService.analysisLevel$.getValue().length === 0) {
      this.store$.dispatch(new WarningNotification({ message: 'You must select an Analysis Level in order to apply the selected audience variable(s)', notificationTitle: 'Apply Selected Audience' }));
    } else {
      this.varService.applyAudienceSelection();
    }
  }

  public closeDialog(){
    this.audiences$.pipe(
         map(all => all.filter(a => this.audienceUnselect != null && a.audienceIdentifier === this.audienceUnselect.audienceIdentifier)),
         take(1),
     ).subscribe(unMapped => unMapped.forEach(a => {
      a.exportNationally = false;
      this.varService.updateProjectVars(a);
         }));

    this.showDialog = false;
  }

  onShowGridSelected(audience: Audience) : void {
    this.varService.updateProjectVars(audience);
    /*this.audiences$.pipe(
      map(a => a.filter(a2 => a2.audienceIdentifier === audience.audienceIdentifier)),
      take(1),
    ).subscribe(selected => selected[0].showOnGrid = audience.showOnGrid);*/

    this.allAudiences.forEach(aud => {
      if (aud.audienceIdentifier === audience.audienceIdentifier){
          aud.showOnGrid = audience.showOnGrid;
      }
    });
    this.gridFilter =  this.allAudiences.filter(aud => aud.showOnGrid).length == this.allAudiences.length ? true : false;
  }

  onExportInGeoFootprintSelected(audience: Audience) : void {
    this.varService.updateProjectVars(audience);
    /*this.audiences$.pipe(
      map(a => a.filter(a2 => a2.audienceIdentifier === audience.audienceIdentifier)),
      take(1),
    ).subscribe(selected => selected[0].exportInGeoFootprint = audience.exportInGeoFootprint);*/
    this.allAudiences.forEach(aud => {
      if (aud.audienceIdentifier === audience.audienceIdentifier){
          aud.exportInGeoFootprint = audience.exportInGeoFootprint;
      }
    });
    this.gfpFilter =  this.allAudiences.filter(aud => aud.exportInGeoFootprint).length == this.allAudiences.length ? true : false;
   }

  onNationalSelected(audience: Audience) : void {
    //const audiences = Array.from(this.varService.audienceMap.values()).filter(a => a.exportNationally === true);
    this.varService.updateProjectVars(audience);

    if (this.appStateService.analysisLevel$.getValue() === 'PCR' && this.nationalAudiencesBS$.value.length > 1){
      this.audienceUnselect = audience;
      this.dialogboxHeader = 'Selected Audiences Error';
      this.dialogboxWarningmsg = 'Only 1 variable can be selected at one time for PCR level National exports.';
      this.showDialog = true;
    }

    if (this.nationalAudiencesBS$.value.length > 5) {
      this.audienceUnselect = audience;
      this.dialogboxHeader = 'Selected Audiences Error';
      this.dialogboxWarningmsg = 'Only 5 variables can be selected at one time for the National export.';
      this.showDialog = true;
    }
  }

  onIndexBaseChange(audience: Audience) : void {
    this.varService.updateProjectVars(audience);
  }

  onRemove(audience) {
  const deleteAudience = this.combineAudiences.filter(combineAud => combineAud.audienceSourceType !== 'Custom' && (combineAud.combinedAudiences.includes(audience.audienceIdentifier) || 
                                                      combineAud.compositeSource.includes(audience.audienceIdentifier)));
  if (deleteAudience.length > 0){
      this.dialogboxHeader = 'Invalid Delete!';
      this.dialogboxWarningmsg = 'Audiences used to create a Combined or Converted Audience can not be deleted.';
      this.showDialog = true;
    }
    else{
   const message = 'Do you want to delete the following audience from your project? <br/> <br/>' +
                    `${audience.audienceName}  (${audience.audienceSourceType}: ${audience.audienceSourceName})`;
   this.confirmationService.confirm({
    message: message,
    header: 'Delete Confirmation',
    icon: 'ui-icon-delete',
    accept: () => {
      this.varService.addDeletedAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
      this.varService.removeAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
      this.store$.dispatch(new RemoveVar({varPk: audience.audienceIdentifier}));

      let metricText = null;
      switch (audience.audienceSourceType) {
        case 'Custom':
          metricText = `CUSTOM~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}`;
          break;
        case 'Offline':
          metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~Offline~${this.appStateService.analysisLevel$.getValue()}` ;
          break;
        case 'Online':
          metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}` ;
          break;
        case 'Combined/Converted':
           metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}` ;
           break;
        case 'Combined':
            metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}` ;
            break;
        case 'Converted':
             metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}` ;
             break;     
        case 'Composite':
          metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}` ;
          break;

    }
      this.store$.dispatch(new CreateAudienceUsageMetric('audience', 'delete', metricText));
      this.varService.applyAudienceSelection();
    },
    reject: () => {}
   });
  }
  }
   

  public onMoveUp(audience: Audience) {
    this.store$.dispatch(new MoveAudienceUp({ audienceIdentifier: audience.audienceIdentifier }));
    this.varService.syncProjectVars();
  }

  public onMoveDn(audience: Audience) {
    this.store$.dispatch(new MoveAudienceDn({ audienceIdentifier: audience.audienceIdentifier }));
    this.varService.syncProjectVars();
  }

  public formatString(audienceSourceType: string) : string{
    const charsToReplace = {'+': '+<wbr>', '_': '_<wbr>', '.': '.<wbr>', '-' : '-<wbr>'};
    let formattedString = audienceSourceType;
    formattedString = formattedString.replace(/[+_.-]/g, char => charsToReplace[char]);
    return formattedString;
  }

  public onSelectShowOnGrid(gridFilter: boolean){
    const auds: Audience[] = [];
   
    this.audiences$.pipe(
      map(audiences => audiences.filter(aud => aud.showOnGrid != gridFilter))
    ).subscribe(audiences => {
      audiences.forEach(aud => {
        aud.showOnGrid = gridFilter;
        auds.push(aud);
      });
    }).unsubscribe();

    setTimeout(() => {
        auds.forEach(aud => this.varService.updateProjectVars(aud), 50);
    });
  }

  public onSelectShowOnGFP(gfpFilter: boolean){
    const auds: Audience[] = [];

    this.audiences$.pipe(
      map(audiences => audiences.filter(aud => aud.exportInGeoFootprint != gfpFilter))
    ).subscribe(audiences => {
      audiences.forEach(aud => {
        aud.exportInGeoFootprint = gfpFilter;
        auds.push(aud);
      });
    }).unsubscribe();

    setTimeout(() => {
        auds.forEach(aud => this.varService.updateProjectVars(aud), 50);
    });
  }

}
