import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { SelectItem } from 'primeng/api';
import { filter } from 'rxjs/operators';
import { AppState } from '../../../state/esri.reducers';
import { selectors } from '../../../state/esri.selectors';
import { SetLabelConfiguration } from '../../../state/map/esri.map.actions';
import { EsriLabelConfiguration } from '../../../state/map/esri.map.reducer';

@Component({
  selector: 'val-esri-label-config',
  templateUrl: './esri-label-config.component.html',
  styleUrls: ['./esri-label-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
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
  public siteEnabled = false;

  public selectedFont: string = 'sans-serif';
  public selectedSize: number = 10;

  ngOnInit() {
    this.store$.pipe(
      select(selectors.getEsriLabelConfiguration),
      filter(labelConfig => labelConfig != null && labelConfig.enabled != null && labelConfig.pobEnabled != null && labelConfig.siteEnabled != null && labelConfig.size != null)
    ).subscribe(labelConfig => this.onLabelConfigChanged(labelConfig));
  }

  onLabelConfigChanged(labelConfig: EsriLabelConfiguration) {
    this.enabled = labelConfig.enabled;
    this.pobEnabled = labelConfig.pobEnabled;
    this.siteEnabled = labelConfig.siteEnabled;
    //this.selectedFont = labelConfig.font;
    this.selectedSize = labelConfig.size;
    this.changeDetector.markForCheck();
  }

  onSizeChanged(event: any) {
    if (!this.enabled) {
      return;
    }
    const labelConfig: EsriLabelConfiguration = { enabled: this.enabled, size: event.value, pobEnabled: this.pobEnabled, siteEnabled: this.siteEnabled };
    this.store$.dispatch(new SetLabelConfiguration({ labelConfiguration: labelConfig }));
  }

  onEnabledChanged(event: any) {
    this.pobEnabled = event.checked ? this.pobEnabled : false;
    const labelConfig: EsriLabelConfiguration = { enabled: event.checked, size: this.selectedSize, pobEnabled: this.pobEnabled, siteEnabled: this.siteEnabled };
    this.store$.dispatch(new SetLabelConfiguration({ labelConfiguration: labelConfig }));
  }

  onPOBEnabledChanged(event: any) {
    this.pobEnabled = (!this.enabled && event.checked) ? false : event.checked && this.enabled;
    const labelConfig: EsriLabelConfiguration = { enabled: this.enabled, size: this.selectedSize, pobEnabled: this.pobEnabled, siteEnabled: this.siteEnabled };
    this.store$.dispatch(new SetLabelConfiguration({ labelConfiguration: labelConfig }));
  }
}
