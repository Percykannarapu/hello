import { ChangeDetectorRef, Directive, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { FullAppState } from '../../state/app.interfaces';
import { updateNamedForm, updateNestedForm } from '../../state/forms/forms.actions';
import { FormsState } from '../../state/forms/forms.interfaces';
import { FormSelectorProps, getNamedForm } from '../../state/forms/forms.selectors';

@Directive({
  selector: '[valConnectForm]'
})
export class ConnectFormDirective implements OnInit, OnDestroy {
  @Input('valConnectForm') path: keyof FormsState;
  @Input() nestedIdentifier: string;
  @Input() debounce: number = 300;

  private destroyed$ = new Subject<void>();

  constructor(private formGroupDirective: FormGroupDirective,
              private cd: ChangeDetectorRef,
              private store$: Store<FullAppState>) {}

  public ngOnDestroy() : void {
    this.destroyed$.next();
  }

  ngOnInit() {
    // Update the form value based on the state
    const props: FormSelectorProps =  { path: this.path };
    if (this.nestedIdentifier != null) {
      props.nestedIdentifier = this.nestedIdentifier;
    }
    this.store$.select(getNamedForm, props).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(formValue => {
      if (formValue != null) {
        this.formGroupDirective.form.patchValue(formValue, { emitEvent: false });
        this.formGroupDirective.form.markAsPristine();
      } else {
        this.formGroupDirective.form.reset(undefined, { emitEvent: false });
      }
    });

    this.formGroupDirective.form.valueChanges.pipe(
      takeUntil(this.destroyed$),
      debounceTime(this.debounce)
    ).subscribe(formData => {
      if (this.nestedIdentifier == null) {
        this.store$.dispatch(updateNamedForm({ path: this.path, formData }));
      } else {
        this.store$.dispatch(updateNestedForm({ root: this.path, identifier: this.nestedIdentifier, formData }));
      }
    });
  }
}
