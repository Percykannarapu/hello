import { Component, OnInit } from '@angular/core';
import { TargetAudienceService } from '../../services/target-audience.service';
import { Observable } from 'rxjs';
import { AudienceDataDefinition } from '../../models/audience-data.model';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'val-target-audience',
  templateUrl: './target-audience.component.html'
})
export class TargetAudienceComponent implements OnInit {
  public audiences$: Observable<AudienceDataDefinition[]>;
  public analysisLevel$: Observable<string>;

  constructor(private audienceService: TargetAudienceService, private appStateService: AppStateService) { }

  ngOnInit() {
    this.audiences$ = this.audienceService.audiences$;
    this.analysisLevel$ = this.appStateService.analysisLevel$;
  }
}
