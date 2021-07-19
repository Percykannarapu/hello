/* tslint:disable:max-line-length */
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { WarningNotification } from '@val/messaging';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { BehaviorSubject } from 'rxjs';
// import { AppConfig } from '../app.config';
// import { AudienceDataDefinition } from '../models/audience-data.model';
// import { LocalAppState } from '../state/app.interfaces';
// import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
// import { RestDataService } from '../val-modules/common/services/restdata.service';
// import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
// import { FieldContentTypeCodes } from '../val-modules/targeting/targeting.enums';
// import { AppLoggingService } from './app-logging.service';
// import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';

// interface OnlineCategoryResponse {
//   categoryId: string;
//   digCategoryId: string;
//   source: string;
//   categoryName: string;
//   categoryDescr: string;
//   taxonomy: string;
//   isActive: 0 | 1;
// }

// export interface OnlineBulkDataResponse {
//   geocode: string;
//   dmaScore: string;
//   nationalScore: string;
//   digCategoryId: string;
// }

// export class OnlineAudienceDescription {
//   private childMap: Map<string, OnlineAudienceDescription> = new Map<string, OnlineAudienceDescription>();
//   isLeaf: boolean;
//   categoryId: number;
//   digLookup: Map<string, number> = new Map<string, number>();
//   categoryName: string;
//   taxonomyParsedName: string;
//   categoryDescription: string;
//   taxonomy: string;
//   fieldconte: FieldContentTypeCodes;
//   get children() : OnlineAudienceDescription[] {
//     const currentRoot: OnlineAudienceDescription = this.childMap.has('root') ? this.childMap.get('root') : this;
//     return Array.from(currentRoot.childMap.values());
//   }
//
//   constructor(categories?: OnlineCategoryResponse[], parseTaxonomy: boolean = true) {
//     if (categories != null) {
//       for (const category of categories) {
//         let pathItems: string[];
//         if (parseTaxonomy) {
//           category.taxonomy = `root/${category.taxonomy}`;
//           pathItems = category.taxonomy.split('/').filter(s => s != null && s.length > 0);
//         } else {
//           pathItems = [category.taxonomy];
//         }
//         this.createSubTree(pathItems, category);
//       }
//     }
//   }
//
//   hasSource(source: OnlineSourceTypes) : boolean {
//     return this.digLookup.has(FuseSourceMap[source]);
//   }
//
//   createSubTree(treeItems: string[], response: OnlineCategoryResponse) {
//     const currentCategory = treeItems.shift();
//     const child = new OnlineAudienceDescription();
//     child.taxonomyParsedName = currentCategory;
//     if (treeItems.length === 0) {
//       // we're at the bottom of the taxonomy chain
//       if (this.childMap.has(response.taxonomy)) {
//         // this category has already been added once - just need to append the source
//         const localCategory = this.childMap.get(response.taxonomy);
//         localCategory.digLookup.set(response.source, Number(response.digCategoryId));
//       } else {
//         child.isLeaf = true;
//         child.categoryId = Number(response.categoryId);
//         child.digLookup.set(response.source, Number(response.digCategoryId));
//         child.categoryDescription = response.categoryDescr;
//         child.categoryName = response.categoryName;
//         child.taxonomy = response.taxonomy;
//         this.childMap.set(response.taxonomy, child);
//       }
//     } else {
//       // we're still at a folder level of the taxonomy
//       if (!this.childMap.has(currentCategory)) {
//         // if the folder doesn't exist, create it as a child
//         child.isLeaf = false;
//         this.childMap.set(currentCategory, child);
//       }
//       this.childMap.get(currentCategory).createSubTree(treeItems, response);
//     }
//   }
// }

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceOnlineService {
  // private allAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
  //
  // constructor(private config: AppConfig,
  //             private restService: RestDataService,
  //             private audienceService: TargetAudienceService,
  //             private domainFactory: ImpDomainFactoryService,
  //             private appStateService: AppStateService,
  //             private store$: Store<LocalAppState>,
  //             private logger: AppLoggingService) {
  //   this.appStateService.applicationIsReady$.subscribe(ready => this.onLoadProject());
  //   this.store$.select(fromAudienceSelectors.getAllAudiences).subscribe(this.allAudiencesBS$);
  // }
  //
  // private static createDataDefinition(source: OnlineSourceTypes, name: string, pk: number, digId: number) : AudienceDataDefinition {
  //  const audience: AudienceDataDefinition = {
  //     audienceName: name,
  //     audienceIdentifier: `${digId}`,
  //     audienceSourceType: 'Online',
  //     audienceSourceName: source,
  //     exportInGeoFootprint: true,
  //     showOnGrid: false,
  //     allowNationalExport: true,
  //     exportNationally: false,
  //     selectedDataSet: 'nationalScore',
  //     dataSetOptions: [{ label: 'National', value: 'nationalScore' }, { label: 'DMA', value: 'dmaScore' }],
  //     secondaryId: digId.toLocaleString(),
  //     fieldconte: FieldContentTypeCodes.Index,
  //     requiresGeoPreCaching: true,
  //     sortOrder: null
  //   };
  //   return audience;
  // }
  //
  // public rehydrateAudience() {
  //   try {
  //     const project = this.appStateService.currentProject$.getValue();
  //     if (project == null || project.impProjectVars == null)
  //        return;
  //     let projectVars = project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'online' && v.isActive);
  //     projectVars = projectVars.filter(v => !v.source.split('_')[1].toLowerCase().includes('audience'));
  //     if (projectVars.length > 0) {
  //       for (const projectVar of projectVars) {
  //         const audience: AudienceDataDefinition = {
  //           allowNationalExport: true,
  //           exportNationally: projectVar.isNationalExtract,
  //           audienceIdentifier: projectVar.varPk.toString(),
  //           audienceName: projectVar.fieldname,
  //           audienceSourceName: projectVar.source.replace(/^Online_/, ''),
  //           audienceSourceType: 'Online',
  //           dataSetOptions: [{ label: 'National', value: 'nationalScore' }, { label: 'DMA', value: 'dmaScore' }],
  //           exportInGeoFootprint: projectVar.isIncludedInGeofootprint,
  //           showOnGrid: projectVar.isIncludedInGeoGrid,
  //           selectedDataSet: projectVar.indexBase,
  //           secondaryId: projectVar.varPk.toString(),
  //           fieldconte: FieldContentTypeCodes.parse(projectVar.fieldconte),
  //           requiresGeoPreCaching: true,
  //           sortOrder: projectVar.sortOrder
  //         };
  //
  //         // this.logger.debug.log('### target-audience-online - onLoadProject - adding audience:', audience);
  //         if (projectVar.source.toLowerCase().match('interest')) {
  //           this.audienceService.addAudience(audience, null, true);
  //         } else if (projectVar.source.toLowerCase().match('in-market')) {
  //           this.audienceService.addAudience(audience, null, true);
  //         } else if (projectVar.source.toLowerCase().match('vlh')) {
  //           this.audienceService.addAudience(audience, null, true);
  //         } else {
  //           this.audienceService.addAudience(audience, null, true);
  //         }
  //       }
  //     }
  //   }
  //   catch (error) {
  //     this.logger.error.log(error);
  //   }
  // }
  //
  // private onLoadProject() {
  //   this.rehydrateAudience();
  //   const project = this.appStateService.currentProject$.getValue();
  //     if (project == null || project.impProjectVars == null)
  //        return;
  //     const projectVars = project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'online' && !v.isActive);
  //     if (projectVars.length > 0){
  //       let msg = 'The following audience selections are no longer available, and have been removed from the Selected Audiences grid: \n\n';
  //       projectVars.forEach(v => msg += `● ${v.fieldname}`);
  //
  //       this.store$.dispatch(WarningNotification({ notificationTitle: 'Audience Issues', message: msg}));
  //     }
  // }
  //
  // public addAudience(audience: OnlineAudienceDescription, source: OnlineSourceTypes) {
  //   this.usageMetricCheckUncheckApio('checked', audience, source);
  //   const model = TargetAudienceOnlineService.createDataDefinition(source, audience.categoryName, audience.categoryId, audience.digLookup.get(FuseSourceMap[source]));
  //   this.audienceService.addAudience(model);
  // }
  //
  // public removeAudience(audience: OnlineAudienceDescription, source: OnlineSourceTypes) {
  //   this.usageMetricCheckUncheckApio('unchecked', audience, source);
  //   this.audienceService.removeAudience('Online', source, audience.digLookup.get(FuseSourceMap[source]).toString());
  // }
  //
  // private usageMetricCheckUncheckApio(checkType: string, audience: OnlineAudienceDescription, source: OnlineSourceTypes) {
  //   const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
  //   let metricText = null;
  //   if (source === OnlineSourceTypes.Pixel)
  //     metricText = audience.digLookup.get(FuseSourceMap[source]) + '~' + audience.categoryName + '~' + source + '~' + currentAnalysisLevel;
  //   else
  //     metricText = audience.digLookup.get(FuseSourceMap[source]) + '~' + audience.taxonomyParsedName.replace('~', ':') + '~' + source + '~' + currentAnalysisLevel;
  //   this.store$.dispatch(new CreateAudienceUsageMetric('online', checkType, metricText));
  // }
}
