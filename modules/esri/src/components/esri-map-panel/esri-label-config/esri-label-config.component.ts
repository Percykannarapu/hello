import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { Store, select } from '@ngrx/store';
import { SetLabelConfiguration } from '../../../state/map/esri.map.actions';
import { AppState, internalSelectors, selectors } from '../../../state/esri.selectors';
import { EsriLabelConfiguration } from '../../../state/map/esri.map.reducer';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'val-esri-label-config',
  templateUrl: './esri-label-config.component.html',
  styleUrls: ['./esri-label-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriLabelConfigComponent implements OnInit {

  constructor(private store$: Store<AppState>,
              private changeDetector: ChangeDetectorRef) { }
  
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
  public pobEnabled = false;

  public selectedFont: string = 'sans-serif';
  public selectedSize: number = 10;

  ngOnInit() {
    this.store$.pipe(
      select(selectors.getEsriLabelConfiguration),
      filter(labelConfig => labelConfig != null && labelConfig.enabled != null && labelConfig.pobEnabled != null && labelConfig.font != null && labelConfig.size != null)
    ).subscribe(labelConfig => this.onLabelConfigChanged(labelConfig));
  }

  onLabelConfigChanged(labelConfig: EsriLabelConfiguration) {
    this.enabled = labelConfig.enabled;
    this.pobEnabled = labelConfig.pobEnabled;
    this.selectedFont = labelConfig.font;
    this.selectedSize = labelConfig.size;
    this.changeDetector.markForCheck();
  }

  onFontChanged(event: any) {
    if (!this.enabled) {
      return;
    }
    const labelConfig: EsriLabelConfiguration = { enabled: this.enabled, font: event.value, size: this.selectedSize, pobEnabled: this.pobEnabled };
    this.store$.dispatch(new SetLabelConfiguration({ labelConfiguration: labelConfig }));
  }

  onSizeChanged(event: any) {
    if (!this.enabled) {
      return;
    }
    const labelConfig: EsriLabelConfiguration = { enabled: this.enabled, font: this.selectedFont, size: event.value, pobEnabled: this.pobEnabled};
    this.store$.dispatch(new SetLabelConfiguration({ labelConfiguration: labelConfig }));
  }

  onEnabledChanged(event: any) {
    this.pobEnabled = event.checked ? this.pobEnabled : false;
    const labelConfig: EsriLabelConfiguration = { enabled: event.checked, font: this.selectedFont, size: this.selectedSize, pobEnabled: this.pobEnabled };
    this.store$.dispatch(new SetLabelConfiguration({ labelConfiguration: labelConfig }));
  }
  
  onPOBEnabledChanged(event: any) {
    const labelConfig: EsriLabelConfiguration = { enabled: this.enabled, font: this.selectedFont, size: this.selectedSize, pobEnabled: event.checked && this.enabled };
    this.store$.dispatch(new SetLabelConfiguration({ labelConfiguration: labelConfig }));
  }

}
