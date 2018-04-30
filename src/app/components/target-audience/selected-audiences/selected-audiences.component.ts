import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CategoryVariable, TopVarService } from '../../../services/top-var.service';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromEvent';

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

  private selectedVarSubscription: Subscription;

  @ViewChild('applyButton') applyButton: ElementRef;
  selectedVars: ViewModel[] = [];

  constructor(private varService: TopVarService) { }

  ngOnInit() : void {
    this.selectedVarSubscription = this.varService.selectedTdaAudience$.pipe(
      map(selections => selections.map(audience => ({ isMapped: false, isOnGrid: true, isExported: true, audienceName: audience.fielddescr, audienceData: audience })))
    ).subscribe(vars => this.updateVars(vars));
  }

  ngAfterViewInit() : void {
    Observable.fromEvent(this.applyButton.nativeElement, 'click')
      .subscribe(() => this.processData(this.selectedVars));
  }

  public onMapped(pk: string) : void {
    const otherSelected = this.selectedVars.filter(v => v.audienceData.pk !== pk && v.isMapped);
    otherSelected.forEach(o => o.isMapped = false);
  }

  private processData(audience: ViewModel[]) {
    this.varService.applyAudienceSelection();
    const renderedData = audience.filter(a => a.isMapped === true)[0];
    this.varService.setRenderedData(renderedData ? renderedData.audienceData : null);
  }

  private updateVars(vars: ViewModel[]) : void {
    const currentPks = new Set(this.selectedVars.map(v => v.audienceData.pk));
    const newPks = new Set(vars.map(v => v.audienceData.pk));
    const addedVars = vars.filter(v => !currentPks.has(v.audienceData.pk));
    this.selectedVars.push(...addedVars);
    this.selectedVars = this.selectedVars.filter(v => newPks.has(v.audienceData.pk));
  }
}
