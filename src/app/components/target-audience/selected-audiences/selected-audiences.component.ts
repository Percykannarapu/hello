import { Component, OnInit } from '@angular/core';
import { CategoryVariable, TopVarService } from '../../../services/top-var.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'val-selected-audiences',
  templateUrl: './selected-audiences.component.html'
})
export class SelectedAudiencesComponent implements OnInit {

  public selectedVars$: Observable<CategoryVariable[]>;

  constructor(private varService: TopVarService) { }

  ngOnInit() {
    this.selectedVars$ = this.varService.selectedTdaAudience$;
  }

  public submitAudiences() {
    this.varService.applyAudienceSelection();
  }
}
