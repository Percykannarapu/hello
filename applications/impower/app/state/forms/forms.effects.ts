import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';


@Injectable()
export class FormsEffects {


  // loadForms$ = createEffect(() => this.actions$.pipe(
  //   ofType(FormsActions.loadForms),
  //   /** An EMPTY observable only emits completion. Replace with your own observable API request */
  //   concatMap(() => EMPTY)
  // ));


  constructor(private actions$: Actions) {}

}
