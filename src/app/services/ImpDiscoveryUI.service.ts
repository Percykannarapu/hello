//import { AppProjectService } from './app-project.service';
/** A temporary service to manage the ImpDiscoveryUI model data
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 **/
import { RestDataService } from '../../../src/app/val-modules/common/services/restdata.service';
import { DataStore } from '../../../src/app/val-modules/common/services/datastore.service';
import { Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpProjectService } from './../val-modules/targeting/services/ImpProject.service';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';

const dataUrl = '';

export class CounterMetrics{
      constructor(public usageMetricName: ImpMetricName, public metricText: string, public metricValue: number
      ){}
}

@Injectable()
export class ImpDiscoveryService extends DataStore<ImpDiscoveryUI>
{
   constructor(private restDataService: RestDataService
//               private impProjectService: ImpProjectService
//              private appProjectService: AppProjectService
            ) {
      super(restDataService, dataUrl, null, 'ImpDiscovery');
//      impProjectService.storeObservable.subscribe(discoveryData => this.onChangeProject());
   }

   public onInit()
   {
      console.log('ImpDiscoveryService - onInit - fired');

      let defaultDiscovery: ImpDiscoveryUI = new ImpDiscoveryUI(ImpDiscoveryUI.defaults);
      this.add([defaultDiscovery]);
   }

   private onChangeProject()
   {
      console.log('ImpDiscoveryService.onChangeProject - fired');

   }

   public mapDiscoveryFromProject(impProject: ImpProject): ImpDiscoveryUI
   {
      console.log ('ImpDiscoveryUI.service.mapDiscoveryFromProject - fired');
      let impDiscoveryUI: ImpDiscoveryUI = new ImpDiscoveryUI(ImpDiscoveryUI.defaults);

      // Bail if there is no project to map from
      if (impProject == null || impProject.projectId == null)
      {
         console.log('ImpDiscoveryUI.service.mapDiscoveryFromProject cannot proceed with an empty project');
         return impDiscoveryUI;
      }
      else
         console.log ('Mapping from project: ', impProject);

      impDiscoveryUI.industryCategoryCode = impProject.industryCategoryCode;
//d      this.selectedCategory = this.categories.filter(category => category.code === impProject.industryCategoryCode)[0];

      impDiscoveryUI.analysisLevel        = impProject.methAnalysis;
//d      this.selectedAnalysisLevel               = this.analysisLevels.filter(level => level.value === impProject.methAnalysis)[0];
      // TODO: This belongs in product allocations, which doesn't exist yet.  Using project description
      impDiscoveryUI.productCode          = impProject.description;
//    this.selectedProduct = this.products.filter(product => product.productCode = this.impProject.description)[0];
      console.log('impDiscoveryUI.productCode: ', impDiscoveryUI.productCode);

      if (impProject.isCircBudget)
      {
         impDiscoveryUI.circBudget = impProject.totalBudget;
         impDiscoveryUI.totalBudget = null;
      }
      else
      {
         impDiscoveryUI.circBudget = null;
         impDiscoveryUI.totalBudget = impProject.totalBudget;
      }

      // Map flags
      impDiscoveryUI.includeNonWeekly = impProject.isIncludeNonWeekly;
      impDiscoveryUI.includeValassis  = impProject.isIncludeValassis;
      impDiscoveryUI.includePob       = !impProject.isExcludePob;
      impDiscoveryUI.includeAnne      = impProject.isIncludeAnne;
      impDiscoveryUI.includeSolo      = impProject.isIncludeSolo;
      impDiscoveryUI.projectTrackerId = impProject.projectTrackerId;
      
      
      impDiscoveryUI.cpm = impProject.estimatedBlendedCpm;
      impDiscoveryUI.valassisCPM = impProject.smValassisCpm;
      impDiscoveryUI.anneCPM = impProject.smAnneCpm;
      impDiscoveryUI.soloCPM = impProject.smSoloCpm;

      if (impProject.estimatedBlendedCpm != null){
            impDiscoveryUI.selectCpmType = 'isBlended';
      } else impDiscoveryUI.selectCpmType = 'isDefinedbyOwnerGroup';

      console.log ('ImpDiscoveryUI.service.mapDiscoveryFromProject - finished ', impDiscoveryUI);
      return impDiscoveryUI;
   }

   public discoveryUsageMetricsCreate(actionName: string){
      const discoverUIData: ImpDiscoveryUI = this.get()[0];
      const counterMetrics = [];
      let usageMetricName = null;

      if (discoverUIData.productCode != null || discoverUIData.productCode != ''){
            usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'product', action: actionName });
            counterMetrics.push(new CounterMetrics(usageMetricName, discoverUIData.productCode, null));
      }
      if (discoverUIData.industryCategoryName != null || discoverUIData.industryCategoryName != ''){
            usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'category', action: actionName });
            counterMetrics.push(new CounterMetrics(usageMetricName, discoverUIData.industryCategoryName, null));
      }
      if (discoverUIData.analysisLevel){
            usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'analysis-level', action: actionName });
            counterMetrics.push(new CounterMetrics(usageMetricName, discoverUIData.analysisLevel, null));
      }
      if (discoverUIData.cpm != null){
            const blendedCpm = discoverUIData.cpm != null ? discoverUIData.cpm : null;
            usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'blended-cpm', action: actionName });
            counterMetrics.push(new CounterMetrics(usageMetricName, null, blendedCpm));
      }
      if (discoverUIData.valassisCPM != null){
            const valassisCpm = discoverUIData.valassisCPM != null ? discoverUIData.valassisCPM : null;
            usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'valassis-cpm', action: actionName });
            counterMetrics.push(new CounterMetrics(usageMetricName, null, valassisCpm));
      }
      if (discoverUIData.anneCPM != null){
            const anneCPM = discoverUIData.anneCPM != null ? discoverUIData.anneCPM : null;
            usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'anne-cpm', action: actionName });
            counterMetrics.push(new CounterMetrics(usageMetricName, null, anneCPM));
      }
      if (discoverUIData.soloCPM != null){
            const soloCpm = discoverUIData.soloCPM != null ? discoverUIData.soloCPM : null;  
            usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'solo-cpm', action: actionName });
            counterMetrics.push(new CounterMetrics(usageMetricName, null, soloCpm));
      }
      if (discoverUIData.totalBudget != null){
            const totalBudget = discoverUIData.totalBudget != null ? discoverUIData.totalBudget : null;
            usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'dollar-budget', action: actionName });
            counterMetrics.push(new CounterMetrics(usageMetricName, null, totalBudget));
      }
      if (discoverUIData.circBudget != null){
            const circBudget = discoverUIData.circBudget != null ? discoverUIData.circBudget : null;
            usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'circ-budget', action: actionName });
            counterMetrics.push(new CounterMetrics(usageMetricName, null, circBudget));
      }
      if (discoverUIData.selectedSeason != null){
            usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'season', action: actionName });
            counterMetrics.push(new CounterMetrics(usageMetricName, discoverUIData.selectedSeason, null));
      } 
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-pob-geo', action: actionName });
      const ispob = discoverUIData.includePob ? 1 : 0;
      counterMetrics.push(new CounterMetrics(usageMetricName, ispob.toString() , null));

      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-valassis-geo', action: actionName });
      const isvalGeo = discoverUIData.includeValassis ? 1 : 0;
      counterMetrics.push(new CounterMetrics(usageMetricName, isvalGeo.toString() , null));

      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-anne-geo', action: actionName });
      const isAnneGeo = discoverUIData.includeAnne ? 1 : 0;
      counterMetrics.push(new CounterMetrics(usageMetricName, isAnneGeo.toString() , null));

      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'colorbox-input', target: 'include-solo-geo', action: actionName });
      const isSoloGeo = discoverUIData.includeAnne ? 1 : 0;
      counterMetrics.push(new CounterMetrics(usageMetricName, isSoloGeo.toString() , null));

      return counterMetrics;
   }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}
