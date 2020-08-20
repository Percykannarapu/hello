import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap } from 'rxjs/operators';
import { RestDataService } from '../../../../../val-modules/common/services/restdata.service';
import { OnlineAudienceDefinition } from '../audience-definitions.model';
import { actionFamily, loadAudienceDefinitions } from './interest-audience.actions';

@Injectable()
export class InterestAudienceEffects {

  fetchDefinitions$ = createEffect(() => this.actions$.pipe(
    ofType(`[${actionFamily}Audience/API] Fetch ${actionFamily}Audience Definitions`),
    switchMap(() => this.restService.get(`v1/targeting/base/impdigcategory/search?q=impdigcategory&source=interest&isActive=1`)),
    map(response => response.payload.rows as OnlineAudienceDefinition[]),
    map(definitions => loadAudienceDefinitions({ definitions }))
  ));

  constructor(private actions$: Actions,
              private restService: RestDataService) {}

}
