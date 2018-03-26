import { Component, OnInit } from '@angular/core';
import { DemographicVariable, TopVarService } from '../../../services/top-var.service';
import { Observable } from 'rxjs/Observable';
import { SmartMappingTheme } from '../../../models/LayerState';
import { ValLayerService } from '../../../services/app-layer.service';
import { SelectItem } from 'primeng/primeng';

@Component({
  selector: 'val-demo-variables',
  templateUrl: './demo-variables.component.html',
  styleUrls: ['./demo-variables.component.css']
})
export class DemoVariablesComponent implements OnInit {
  public selectedTopVar$: Observable<DemographicVariable>;
  public allTopVars$: Observable<DemographicVariable[]>;
  public allThemes: SelectItem[] = [];
  public selectedTheme$: Observable<SmartMappingTheme>;
  public currentOpacity$: Observable<number>;

  constructor(private topVars: TopVarService, private layerService: ValLayerService) {
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
    this.allTopVars$ = this.topVars.getAllTopVars();
    this.selectedTopVar$ = this.topVars.selectedTopVar$;
    this.selectedTheme$ = this.layerService.currentSmartTheme$;
    this.currentOpacity$ = this.layerService.currentThemeOpacity$;
  }

  onTopVarChange(newValue: DemographicVariable) {
    this.topVars.selectTopVar(newValue);
  }

  onThemeChange(newValue: SmartMappingTheme) {
    this.layerService.changeSmartTheme(newValue);
  }

  onOpacityChange(newValue: number) {
    this.layerService.changeOpacity(newValue);
  }
}
