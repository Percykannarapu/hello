import { EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ShadingDefinitionBase } from '@val/esri';
import { Subject } from 'rxjs';

// @Component({
//   selector: 'shader-base',
//   template: ''
// })
export abstract class ShaderBaseComponent<T extends ShadingDefinitionBase> implements OnInit, OnDestroy {

  @Input() definition: T;
  @Output() applyShader: EventEmitter<T> = new EventEmitter<T>();
  @Output() deleteShader: EventEmitter<T> = new EventEmitter<T>();

  shaderForm: FormGroup;
  isEditing: boolean = false;

  protected destroyed$ = new Subject<void>();

  protected constructor() { }

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
      const newDef = { ...this.definition };
      Object.assign(newDef, form.value);
      this.applyShader.emit(newDef);
    }
  }

  protected abstract setupForm() : void;
}
