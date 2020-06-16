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
  index: number  = -1;
  tabViewIndex: number = 0;
  customIndex: number = -1;
  offlineIndex: number = -1;
  

  constructor(private audienceService: TargetAudienceService, private appStateService: AppStateService) { }

  ngOnInit() {
    this.audiences$ = this.audienceService.allAudiencesBS$;
    this.analysisLevel$ = this.appStateService.analysisLevel$;
    this.appStateService.clearUI$.subscribe(() => {
      this.index = -1;
      this.tabViewIndex = 0;
      this.customIndex = -1;
      this.offlineIndex = -1;
    });
  }

  onTabOpen(e: any) {
     this.index = e.index;
  }

  handleChange(e: any){
    this.tabViewIndex = e.tabViewIndex;
  }
  onTabCustom(e: any){
    this.customIndex = e.customIndex;
  }
  onTabOffline(e: any){
    this.offlineIndex = e.offlineIndex;
  }
}
