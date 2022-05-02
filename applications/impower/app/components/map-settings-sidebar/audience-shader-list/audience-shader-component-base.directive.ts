import { Directive, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ColorPalette, ShadingDefinitionBase } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';

/* tslint:disable:directive-class-suffix */
@Directive()
export abstract class AudienceShaderComponentBase<T extends ShadingDefinitionBase> implements OnInit, OnDestroy {

  @Input() definition: T;
  @Input() currentAnalysisLevel: string;
  @Output() applyShader: EventEmitter<T> = new EventEmitter<T>();
  @Output() deleteShader: EventEmitter<T> = new EventEmitter<T>();

  shaderForm: FormGroup;
  isEditing: boolean = false;
  numericThemes: SelectItem[] = [];
  textThemes: SelectItem[] = [];
  allThemes: SelectItem[] = [];

  protected destroyed$ = new Subject<void>();

  protected constructor() {
    this.allThemes = Object.keys(ColorPalette)
      .map(key => ({
        label: ColorPalette[key],
        value: ColorPalette[key]
      }));
    const gradientThemes = new Set([ ColorPalette.Blue, ColorPalette.Orange, ColorPalette.Red, ColorPalette.EsriPurple ]);
    this.numericThemes = this.allThemes.filter(k => k.value !== ColorPalette.CpqMaps);
    this.textThemes = this.allThemes.filter(k => !gradientThemes.has(k.value));
  }

  ngOnInit() {
    if (this.definition.sourcePortalId == null) {
      this.setupForm();
      this.isEditing = true;
    }
  }

  public ngOnDestroy() : void {
    this.destroyed$.next();
  }

  public edit() : void {
    this.setupForm();
    this.isEditing = true;
  }

  public cancel() : void {
    if (this.definition.sourcePortalId == null) {
      this.deleteShader.emit(this.definition);
    } else {
      this.isEditing = false;
    }
  }

  public apply(form: FormGroup) : void {
    if (form.valid) {
      const newDef: T = { ...this.definition, defaultSymbolDefinition: { ...this.definition.defaultSymbolDefinition } };
      Object.assign(newDef, form.value);
      this.applyShader.emit(newDef);
    }
  }

  protected abstract setupForm() : void;
}
