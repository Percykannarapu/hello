import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Audience } from '../../impower-datastore/state/transient/audience/audience.model';
import { AppStateService } from '../../services/app-state.service';
import { TargetAudienceService } from '../../services/target-audience.service';

@Component({
  selector: 'val-target-audience',
  templateUrl: './target-audience.component.html'
})
export class TargetAudienceComponent implements OnInit {
  public audiences$: Observable<Audience[]>;
  public analysisLevel$: Observable<string>;

  constructor(private audienceService: TargetAudienceService, private appStateService: AppStateService) { }

  ngOnInit() {
    this.audiences$ = this.audienceService.allAudiencesBS$;
    this.analysisLevel$ = this.appStateService.analysisLevel$;
  }
}
