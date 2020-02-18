import { EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ColorPalette, ShadingDefinitionBase } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { Audience } from '../../../../impower-datastore/state/transient/audience/audience.model';

// @Component({
//   selector: 'variable-base',
//   template: ''
// })
export abstract class VariableBaseComponent<T extends ShadingDefinitionBase> implements OnInit, OnDestroy {

  @Input() definition: T;
  @Input() parentForm: FormGroup;
  @Input() isEditing: boolean;
  @Input() currentAudience: Audience;

  @Output() cancelForm: EventEmitter<void> = new EventEmitter<void>();

  numericThemes: SelectItem[] = [];
  allThemes: SelectItem[] = [];
  allExtents: SelectItem[] = [];

  protected destroyed$ = new Subject<void>();

  protected constructor() {
    this.allThemes = Object.keys(ColorPalette)
      .map(key => ({
        label: ColorPalette[key],
        value: ColorPalette[key]
      }));
    this.numericThemes = this.allThemes.filter(k => k.value !== ColorPalette.Cpqmaps);
    this.allExtents = [
      {label: 'Whole Map', value: false },
      {label: 'Selected Geos only', value: true }
    ];
  }

  ngOnInit() {
    if (this.isEditing) this.setupForm();
  }

  public ngOnDestroy() : void {
    this.destroyed$.next();
  }

  protected abstract setupForm() : void;
}
