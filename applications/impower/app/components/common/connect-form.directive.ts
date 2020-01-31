import { ChangeDetectorRef, Directive, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { FullAppState } from '../../state/app.interfaces';
import { updateNamedForm } from '../../state/forms/forms.actions';
import { FormsState } from '../../state/forms/forms.interfaces';
import { getNamedForm } from '../../state/forms/forms.selectors';

@Directive({
  selector: '[valConnectForm]'
})
export class ConnectFormDirective implements OnInit, OnDestroy {
  @Input('valConnectForm') path: keyof FormsState;
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
    this.store$.select(getNamedForm, { path: this.path }).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(formValue => {
      if (formValue != null) {
        this.formGroupDirective.form.patchValue(formValue, { emitEvent: false });
      } else {
        this.formGroupDirective.form.reset(undefined, { emitEvent: false });
      }
      this.formGroupDirective.form.markAsPristine();
    });

    this.formGroupDirective.form.valueChanges.pipe(
      takeUntil(this.destroyed$),
      debounceTime(this.debounce)
    ).subscribe(formData => this.store$.dispatch(updateNamedForm({ path: this.path, formData })));
  }
}
