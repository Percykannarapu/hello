import { Component, OnInit, ChangeDetectionStrategy, Input, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { Store } from '@ngrx/store';
import { AppState, getEsriMapState, getEsriLabelConfiguration } from '../../../state/esri.selectors';
import { EsriLabelConfiguration } from '../../../state/map/esri.map.reducer';
import { SetLabelConfiguration } from '../../../state/map/esri.map.actions';

@Component({
  selector: 'val-esri-label-config',
  templateUrl: './esri-label-config.component.html',
  styleUrls: ['./esri-label-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriLabelConfigComponent implements OnInit {

  constructor(private store$: Store<AppState>) { }
  
  public fonts: SelectItem[] = [
    { label: 'Serif', value: 'serif' },
    { label: 'Sans-Serif', value: 'sans-serif' },
    { label: 'Monospace', value: 'monospace' },
    { label: 'Cursive', value: 'cursive' },
    { label: 'Pacifico', value: 'pacifico' },
    { label: 'Tangerine', value: 'tangerine' },
    { label: 'Merriweather', value: 'merriweather' }];
  
    public sizes: SelectItem[] = [
    { label: '8', value: 8 },
    { label: '10', value: 10 },
    { label: '12', value: 12 },
    { label: '14', value: 14 },
    { label: '16', value: 16 },
    { label: '18', value: 18 },
    { label: '20', value: 20 },
    { label: '22', value: 22 },
    { label: '24', value: 24 },
    { label: '26', value: 26 },
    { label: '28', value: 28 },
    { label: '30', value: 30 },
    { label: '32', value: 32 },
    { label: '34', value: 34 },
    { label: '36', value: 36 },
    { label: '38', value: 38 },
    { label: '40', value: 40 }];
  
  public enabled = false;

  public selectedFont: string = 'serif';
  public selectedSize: number = 12;

  ngOnInit() {
  }

  onFontChanged(event: any) {
    if (!this.enabled) {
      return;
    }
    const labelConfig: EsriLabelConfiguration = { enabled: this.enabled, font: event.value, size: this.selectedSize };
    this.store$.dispatch(new SetLabelConfiguration({ labelConfiguration: labelConfig }));
  }

  onSizeChanged(event: any) {
    if (!this.enabled) {
      return;
    }
    const labelConfig: EsriLabelConfiguration = { enabled: this.enabled, font: this.selectedFont, size: event.value };
    this.store$.dispatch(new SetLabelConfiguration({ labelConfiguration: labelConfig }));
  }

  onEnabledChanged(event: any) {
    const labelConfig: EsriLabelConfiguration = { enabled: event.checked, font: this.selectedFont, size: this.selectedSize };
    this.store$.dispatch(new SetLabelConfiguration({ labelConfiguration: labelConfig }));
  }


}
