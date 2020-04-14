import { EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ColorPalette, PoiConfiguration } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';

// @Component({
//   selector: 'shader-base',
//   template: ''
// })
export abstract class PoiBaseComponent<T extends PoiConfiguration> implements OnDestroy {

  @Input() configuration: T;
  @Output() applyConfiguration: EventEmitter<T> = new EventEmitter<T>();

  configForm: FormGroup;
  isEditing: boolean = false;
  poiThemes: SelectItem[] = [];
  allThemes: SelectItem[] = [];

  protected destroyed$ = new Subject<void>();

  protected constructor() {
    this.allThemes = Object.keys(ColorPalette)
      .map(key => ({
        label: ColorPalette[key],
        value: ColorPalette[key]
      }));
    const gradientThemes = new Set([ ColorPalette.Blue, ColorPalette.Orange, ColorPalette.Red, ColorPalette.EsriPurple ]);
    this.poiThemes = this.allThemes.filter(k => !gradientThemes.has(k.value));
  }

  public ngOnDestroy() : void {
    this.destroyed$.next();
  }

  public edit() : void {
    this.setupForm();
    this.isEditing = true;
  }

  public cancel() : void {
    this.isEditing = false;
  }

  public apply(form: FormGroup) : void {
    if (form.valid) {
      const newDef: T = { ...this.configuration, labelDefinition: { ...this.configuration.labelDefinition } };
      Object.assign(newDef, form.value);
      this.applyConfiguration.emit(newDef);
    }
  }

  protected abstract setupForm() : void;
}
