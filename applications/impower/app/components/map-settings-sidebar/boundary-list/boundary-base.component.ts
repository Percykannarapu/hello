import { EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BoundaryConfiguration, ColorPalette } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';

export abstract class BoundaryBaseComponent<T extends BoundaryConfiguration> implements OnDestroy {

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
    const gradientThemes = new Set([ColorPalette.Blue, ColorPalette.Orange, ColorPalette.Red, ColorPalette.EsriPurple]);
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
      const newDef: T = {
        ...this.configuration,
        labelDefinition: {...this.configuration.labelDefinition},
        pobLabelDefinition: {...this.configuration.pobLabelDefinition},
        popupDefinition: {...this.configuration.popupDefinition}
      };
      const convertedForm = this.convertForm(form);
      Object.assign(newDef, convertedForm);
      this.applyConfiguration.emit(newDef);
    }
  }

  protected abstract setupForm() : void;
  protected abstract convertForm(form: FormGroup) : T;

}
