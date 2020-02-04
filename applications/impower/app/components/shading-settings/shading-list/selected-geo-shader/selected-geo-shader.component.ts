import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormConfig, rgbToHex } from '@val/common';
import { fillTypeFriendlyNames } from '@val/esri';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { GfpSelectionForm } from '../../../../state/forms/forms.interfaces';
import { UIShadingDefinition } from '../../shading-ui-helpers';

@Component({
  selector: 'val-selected-geo-shader',
  templateUrl: './selected-geo-shader.component.html',
  styleUrls: ['./selected-geo-shader.component.scss']
})
export class SelectedGeoShaderComponent implements OnInit, OnDestroy {

  @Input() definition: UIShadingDefinition;

  @Output() applyShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  @Output() editShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  shaderForm: FormGroup;

  get currentFillColorInHex() : string {
    return rgbToHex(this.definition.defaultSymbolDefinition.fillColor);
  }
  get currentFriendlyFillType() : string {
    return fillTypeFriendlyNames[this.definition.defaultSymbolDefinition.fillType];
  }

  private destroyed$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
  }

  public ngOnDestroy() : void {
    this.destroyed$.next();
  }

  ngOnInit() {
    const formSetup: FormConfig<GfpSelectionForm> = {
      layerName: [this.definition.layerName, Validators.required],
      opacity: new FormControl(this.definition.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
      defaultSymbolDefinition: this.definition.defaultSymbolDefinition
    };
    this.shaderForm = this.fb.group(formSetup, { updateOn: 'blur' });

    this.shaderForm.get('defaultSymbolDefinition').valueChanges.pipe(
      takeUntil(this.destroyed$),
      map(value => value.fillType),
      distinctUntilChanged()
    ).subscribe(value => this.styleChanged(value));
  }

  edit(def: UIShadingDefinition) : void {
    this.definition = { ...def, isEditing: true };
    this.editShader.emit(this.shaderForm.value);
  }

  apply() : void {
    this.shaderForm.updateValueAndValidity();
    if (this.shaderForm.status === 'VALID') {
      const values: GfpSelectionForm = this.shaderForm.value;
      Object.assign(this.definition, values);
      this.applyShader.emit(this.definition);
    }
  }

  styleChanged(newValue: string) : void {
    if (newValue === 'solid') {
      this.shaderForm.get('opacity').setValue(0.25);
    } else {
      this.shaderForm.get('opacity').setValue(0.75);
    }
  }
}
