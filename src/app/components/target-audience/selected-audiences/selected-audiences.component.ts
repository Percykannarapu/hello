import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CategoryVariable, TopVarService } from '../../../services/top-var.service';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromEvent';
import { SmartMappingTheme } from '../../../models/LayerState';
import { SelectItem } from 'primeng/primeng';
import { AppRendererService } from '../../../services/app-renderer.service';

interface ViewModel {
  isMapped: boolean;
  isOnGrid: boolean;
  isExported: boolean;
  audienceName: string;
  audienceData: CategoryVariable;
}

@Component({
  selector: 'val-selected-audiences',
  templateUrl: './selected-audiences.component.html',
  styleUrls: ['./selected-audiences.component.css']
})
export class SelectedAudiencesComponent implements OnInit {

  private selectedVarSubscription: Subscription;

  @ViewChild('applyButton') applyButton: ElementRef;
  selectedVars: ViewModel[] = [];
  allThemes: SelectItem[] = [];
  currentOpacity: number = 65;

  showRenderControls: boolean = false;

  constructor(private varService: TopVarService) {
    // this is how you convert an enum into a list of drop-down values
    const allThemes = SmartMappingTheme;
    const keys = Object.keys(allThemes);
    for (const key of keys) {
      this.allThemes.push({
        label: key,
        value: allThemes[key]
      });
    }
  }

  ngOnInit() : void {
    this.selectedVarSubscription = this.varService.selectedTdaAudience$.pipe(
      map(selections => selections.map(audience => ({ isMapped: false, isOnGrid: true, isExported: true, audienceName: audience.fielddescr, audienceData: audience })))
    ).subscribe(vars => this.updateVars(vars));
  }

  public onApplyClicked() {
    this.processData(this.selectedVars);
  }

  public onMapped(pk: string) : void {
    const otherSelected = this.selectedVars.filter(v => v.audienceData.pk !== pk && v.isMapped);
    otherSelected.forEach(o => o.isMapped = false);
    this.showRenderControls = this.selectedVars.some(v => v.isMapped);
  }

  onThemeChange(event: { value: SmartMappingTheme }) {
    console.log(event);
    AppRendererService.currentDefaultTheme = event.value;
  }

  onOpacityChange(newValue: number) {
    this.currentOpacity = newValue;
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
