import { Injectable } from '@angular/core';
import { RfpUiEditLoaderService } from './rfpUiEdit-loader-service';
import { RfpUiEditDetailLoaderService } from './RfpUiEditDetail-loader-service';
import { RfpUiReviewLoaderService } from './rfpUiReview-loader-service';
import { RfpUiEditWrapLoaderService } from './rfpUiEditWrap-loader-service';
import { LocalState } from '../state';
import { Store } from '@ngrx/store';
import { AddRfpUiReviews } from '../state/rfpUiReview/rfp-ui-review.actions';
import { RfpUiReviewLoaded, RfpUiEditLoaded, RfpUiEditDetailLoaded, RfpUiEditWrapLoaded, EntitiesLoading, SetAppReady, SetIsWrap } from '../state/shared/shared.actions';
import { AddRfpUiEdits } from '../state/rfpUiEdit/rfp-ui-edit.actions';
import { AddRfpUiEditDetails } from '../state/rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { AddRfpUiEditWraps } from '../state/rfpUiEditWrap/rfp-ui-edit-wrap.actions';
import { ConfigService } from './config.service';
import { SetSelectedLayer } from '@val/esri';


@Injectable({
   providedIn: 'root'
 })
 export class EntityHelper {

   constructor(private rfpUiEditLoader: RfpUiEditLoaderService,
      private rfpUiEditDetailLoader: RfpUiEditDetailLoaderService,
      private rfpUiReviewLoader: RfpUiReviewLoaderService,
      private rfpUiEditWrapLoader: RfpUiEditWrapLoaderService,
      private store$: Store<LocalState>,
      private configService: ConfigService) {}

   public loadEntities(state: LocalState) {
      
      // Load the RfpUiReview entities
      this.rfpUiReviewLoader.loadRfpUiReview(state.shared.activeMediaPlanId).subscribe(result => {
         const normalizedEntities = this.rfpUiReviewLoader.normalize(result);
         this.store$.dispatch(new AddRfpUiReviews({ rfpUiReviews: normalizedEntities.rfpUiReviews }));
         this.store$.dispatch(new RfpUiReviewLoaded({ rfpUiReviewLoaded: true }));
      }, (error) => {
         console.error('Error loading RfpUiReview Entity', error);
      });

      // Load the RfpUiEdit entities
      this.rfpUiEditLoader.loadRfpUiEdit(state.shared.activeMediaPlanId).subscribe(result => {
         const normalizedEntities = this.rfpUiEditLoader.normalize(result);
         this.store$.dispatch(new AddRfpUiEdits({ rfpUiEdits: normalizedEntities.rfpUiEdits }));
         this.store$.dispatch(new RfpUiEditLoaded({ rfpUiEditLoaded: true }));
      }, (error) => {
         console.error('Error loading RfpUiEdit Entity', error);
      });

      // Load the RfpUiEditDetail entities
      this.rfpUiEditDetailLoader.loadRfpUiEditDetail(state.shared.activeMediaPlanId).subscribe(result => {
         const normalizedEntities = this.rfpUiEditDetailLoader.normalize(result);
         this.store$.dispatch(new AddRfpUiEditDetails({ rfpUiEditDetails: normalizedEntities.rfpUiEditDetails }));
         this.store$.dispatch(new RfpUiEditDetailLoaded({ rfpUiEditDetailLoaded: true }));
      }, (error) => {
         console.error('Error loading RfpUiEditDetail Entity', error);
      });

      // Load the RfpUiEditWrap entities
      this.rfpUiEditWrapLoader.loadRfpUiEditWrap(state.shared.activeMediaPlanId).subscribe(result => {
         const normalizedEntities = this.rfpUiEditWrapLoader.normalize(result);
         this.store$.dispatch(new AddRfpUiEditWraps({ rfpUiEditWraps: normalizedEntities.rfpUiEditWraps }));
         this.store$.dispatch(new RfpUiEditWrapLoaded({ rfpUiEditWrapLoaded: true }));
      }, (error) => {
         console.error('Error loading RfpUiEditWrap Entity', error);
      });
   }

   public checkLoadingStatus(state: LocalState) {
      try {
         if (state.shared.rfpUiEditLoaded && state.shared.rfpUiReviewLoaded && state.shared.rfpUiEditDetailLoaded && state.shared.rfpUiEditWrapLoaded) {
            this.store$.dispatch(new EntitiesLoading({ entitiesLoading: false }));
            this.store$.dispatch(new SetAppReady(true));

            // check to see if this is a wrap plan
            if (state.rfpUiEdit.entities[state.rfpUiEdit.ids[0]].sfdcProductCode === 'WRAP') {
               this.store$.dispatch(new SetSelectedLayer({ layerId: this.configService.layers['zip'].boundaries.id }));
               this.store$.dispatch(new SetIsWrap({ isWrap: true }));
            }
         }
      } catch (error) {
         console.error('Error while checking entity loading status', error);
      }
   }

 }