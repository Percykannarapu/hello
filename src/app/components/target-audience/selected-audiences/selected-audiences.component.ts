import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CategoryVariable, TopVarService } from '../../../services/top-var.service';
import { Observable } from 'rxjs/Observable';
import { map, switchMap, take } from 'rxjs/operators';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/switch';

interface ViewModel {
  isMapped: boolean;
  isOnGrid: boolean;
  isExported: boolean;
  audienceName: string;
  audienceData: CategoryVariable;
}

@Component({
  selector: 'val-selected-audiences',
  templateUrl: './selected-audiences.component.html'
})
export class SelectedAudiencesComponent implements OnInit, AfterViewInit {

  @ViewChild('applyButton') applyButton: ElementRef;
  selectedVars$: Observable<ViewModel[]>;

  constructor(private varService: TopVarService) { }

  ngOnInit() : void {
    this.selectedVars$ = this.varService.selectedTdaAudience$.pipe(
      map(selections => selections.map(audience => ({ isMapped: false, isOnGrid: true, isExported: true, audienceName: audience.fielddescr, audienceData: audience })))
    );
  }

  ngAfterViewInit() : void {
    Observable.fromEvent(this.applyButton.nativeElement, 'click').pipe(
      switchMap(() => this.selectedVars$.pipe(take(1)))
    ).subscribe(audience => this.processData(audience));
  }

  private processData(audience: ViewModel[]) {
    this.varService.applyAudienceSelection();
    const renderedData = audience.filter(a => a.isMapped === true)[0];
    //this.varService.setRenderedData(renderedData ? renderedData.audienceData : null);
    this.varService.setRenderedData(audience[0].audienceData);
  }
}
