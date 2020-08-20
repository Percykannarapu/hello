import { Component, OnInit } from '@angular/core';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'val-target-audience',
  templateUrl: './target-audience.component.html'
})
export class TargetAudienceComponent implements OnInit {

  activeTabIndex = 0;

  constructor(private appStateService: AppStateService) { }

  ngOnInit() {
    this.appStateService.clearUI$.subscribe(() => {
      this.activeTabIndex = 0;
    });
  }
}
