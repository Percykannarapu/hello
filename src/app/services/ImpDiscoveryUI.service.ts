import { AppProjectService } from './app-project.service';
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
import { Observable } from 'rxjs/Observable';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpProjectService } from './../val-modules/targeting/services/ImpProject.service';

const dataUrl = '';

@Injectable()
export class ImpDiscoveryService extends DataStore<ImpDiscoveryUI>
{
   constructor(private restDataService: RestDataService,
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

      console.log ('ImpDiscoveryUI.service.mapDiscoveryFromProject - finished ', impDiscoveryUI);
      return impDiscoveryUI;
   }
   
   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}