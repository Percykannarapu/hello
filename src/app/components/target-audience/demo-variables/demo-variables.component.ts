import { Component, OnInit } from '@angular/core';
import { DemographicVariable, TopVarService } from '../../../services/top-var.service';
import { Observable } from 'rxjs/Observable';
import { SmartMappingTheme } from '../../../models/LayerState';
import { EsriLayerService } from '../../../services/esri-layer.service';
import { SelectItem } from 'primeng/primeng';

@Component({
  selector: 'val-demo-variables',
  templateUrl: './demo-variables.component.html',
  styleUrls: ['./demo-variables.component.css']
})
export class DemoVariablesComponent implements OnInit {
  public selectedTopVar: DemographicVariable;
  public allTopVars$: Observable<DemographicVariable[]>;
  public allThemes: SelectItem[] = [];
  public selectedTheme: string = SmartMappingTheme.HighToLow;
  public currentOpacity: number = 65;

  constructor(private topVars: TopVarService, private layerService: EsriLayerService) {
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

  ngOnInit() {
    this.allTopVars$ = this.topVars.allTopVars$;
    // set up this sub in case someone else changes the value out from under me
    this.topVars.selectedTopVar$.subscribe(tv => {
      this.selectedTopVar = tv;
    });
  }

  onTopVarChange(data: DemographicVariable) {
    this.topVars.selectTopVar(data);
  }

  onThemeChange(value: string) {
    this.layerService.changeSmartTheme(<SmartMappingTheme>value);
  }

  onOpacityChange() {
    this.layerService.changeOpacity(this.currentOpacity / 100);
  }
}
