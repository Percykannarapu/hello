import {Component} from '@angular/core';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';


export class Model1 {
    public id: number;
    public name: string;
    public attr1: string;
    public attr2: string;
    public attr3: string;
    public attr4: string;
}

export class Model2 {
    public id: number;
    public name: string;
    public attr1: string;
    public attr2: string;
    public attr3: string;
    public attr4: string;
}

@Component({
    templateUrl: './poc.component.html'
})
export class PocComponent {
    public model1: Model1[];
    public model2: Model2[];

    constructor(public  impProjectService: ImpProjectService,
                public  impGeofootprintGeoService: ImpGeofootprintGeoService) {
        
        this.model1 = new Array<Model1>();
        this.model2 = new Array<Model2>();

        const tmpModel1: Model1 = new Model1();
        const tmpModel2: Model2 = new Model2();
        
        tmpModel1.id = 12345;
        tmpModel1.name = 'ImpGeoffotprintLocation';
        tmpModel1.attr1 = 'coffee';
        tmpModel1.attr2 = 'banana';
        tmpModel1.attr3 = 'cough drops';
        tmpModel1.attr4 = 'things on my desk';
        this.model1.push(tmpModel1);
        
        tmpModel2.id = 67890;
        tmpModel2.name = 'ImpGeofootprintLocationAttribute';
        tmpModel2.attr1 = 'super awesome geo';
        tmpModel2.attr2 = 'people here love dogs';
        tmpModel2.attr3 = 'utopia';
        tmpModel2.attr4 = 'livonia';
        this.model2.push(tmpModel2);
    }

    testFind() {
      console.log('--------------------------------------------------');
      console.log('testFind');
      console.log('--------------------------------------------------');
//      const foundGeos: ImpGeofootprintGeo[] =  [this.impGeofootprintGeoService.find(item => item.impGeofootprintLocation.glId === 1)];
//const foundGeos: ImpGeofootprintGeo[] =  [this.impGeofootprintGeoService.find(item => item.geocode === '48375C1')];
      const storeGeos: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.get();
      console.log ('Working with geos: ', storeGeos);
//      let  foundGeo = this.impGeofootprintGeoService.find(storeGeos[10]);
//      console.log('foundGeo', foundGeo);

      console.log('');
      console.log('Looking for geo: 48080');
      let searchGeo = new ImpGeofootprintGeo({geocode: '48080'});
      let foundGeo = this.impGeofootprintGeoService.find(searchGeo);
      console.log('foundGeo', foundGeo);

      // console.log('');
      // console.log('Looking for geos that belong to Grand Rapids');
      // let searchGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo({isActive: 0; impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'BUDDY\'S PIZZA - GRAND RAPIDS'})});
      // let foundGeo = this.impGeofootprintGeoService.find(searchGeo);
      // console.log('foundGeo', foundGeo);

      console.log('');
      console.log('Looking for geos for location: BUDDY\'S PIZZA - GRAND RAPIDS');
      searchGeo = new ImpGeofootprintGeo({impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'BUDDY\'S PIZZA - GRAND RAPIDS'})});
      const foundGeos: ImpGeofootprintGeo[] = [this.impGeofootprintGeoService.find(searchGeo)];
      console.log('foundGeos', foundGeos);

      console.log('');
      const site: ImpGeofootprintLocation = this.impGeofootprintGeoService.deepFind (searchGeo, 'impGeofootprintLocation', null);
      console.log ('site: ', site);

      console.log('');
      const siteName: String = this.impGeofootprintGeoService.deepFind (searchGeo, 'impGeofootprintLocation.locationName', null);
      console.log ('siteName: ', siteName);

      console.log('');
      console.log ('Test returning a default value when search is not found');
      const testDefault: String = this.impGeofootprintGeoService.deepFind (searchGeo, 'impGeofootprintLocation.locationName.cocopuffs', 'A default Value');
      console.log ('defaulted: ', testDefault);

      console.log('');
      console.log('Test getting a list of objects by a relationship property');
      const getByGeos: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.getListBy ('impGeofootprintLocation.locationName', 'BUDDY\'S PIZZA - GRAND RAPIDS');
      console.log ('findBy: ', getByGeos);

      console.log('');
      console.log('Test getting a list of objects by a relationship property using a comparator');
      //const getByGeosC: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.getListBy ('impGeofootprintLocation.locationName', 'BUDDY\'S PIZZA - GRAND RAPIDS', this.compare);
      console.log ('findBy: ', getByGeos);

      let foundIdx = -1;
      for (let i = 0; i < storeGeos.length; i++)
      {
         foundIdx = this.impGeofootprintGeoService.findIndex(storeGeos[i]);
         console.log('found geo(' + i + ') at index', foundIdx);
      }
   }

   testRemove()
   {
      console.log('--------------------------------------------------');
      console.log('testRemove - Database Removes');
      console.log('--------------------------------------------------');
      
//      this.impProjectService.removeGeosFromHierarchy(this.impGeofootprintGeoService.get().filter(geo => [220258, 220264, 220265].includes(geo.ggId)));
/*      
      console.log('--# TEST FILTERBY')
      let aLocation: ImpGeofootprintLocation = this.impGeofootprintLocationService.get().filter(location => location.glId = 17193)[0];
      
      console.log("A) TAs for glid: " + aLocation.glId, this.impGeofootprintTradeAreaService.filterByGlId(aLocation.glId, true));
      console.log("B) TAs for projectid: " + aLocation.projectId, this.impGeofootprintTradeAreaService.filterByProjectId(aLocation.projectId, true));
*/
/*
      console.log("--------------------------------------------");
      console.log("Remove 3 geos");
      console.log("--------------------------------------------");
      // Stage Geos removal
      let ggIds: number[] = [217729, 217730, 217731];

      let geoRemoves: ImpGeofootprintGeo[] = [];
      ggIds.forEach(ggId => {
         this.impGeofootprintGeoService.remove(this.impGeofootprintGeoService.get().filter(geo => geo.ggId === ggId));
         this.impGeofootprintGeoService.dbRemoves.filter(geo => geo.ggId === ggId).forEach(geo => geoRemoves.push(geo));
      });
      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",geoRemoves.length,"Geos");

      this.impGeofootprintGeoService.performDBRemoves(geoRemoves).subscribe(responseCode => {
         console.log("geofootprint-geo-list received responseCode: ", responseCode);
         console.log("If below are still here, we need to remove them from datastore");
         let removesLeft: number = 0;
         let inStore: number = 0;
         this.impGeofootprintGeoService.dbRemoves.filter(geo => removesLeft += (ggIds.includes(geo.ggId)) ? 1:0);
         this.impGeofootprintGeoService.get().filter    (geo => inStore     += (ggIds.includes(geo.ggId)) ? 1:0);
         
         console.log("geo db removes: ", removesLeft);
         console.log("geo data store: ", inStore);
         console.log("--------------------------------------------");
      });
*/
/*
      console.log("--------------------------------------------");
      console.log("Remove 2 Trade Areas");
      console.log("--------------------------------------------");
      // Stage a trade area removal
      let gtaIds: number[] = [37369, 37370];
      let taRemoves: ImpGeofootprintTradeArea[] = [];
      gtaIds.forEach(gtaId => {
         this.impGeofootprintTradeAreaService.remove(this.impGeofootprintTradeAreaService.get().filter(ta => ta.gtaId === gtaId));
         this.impGeofootprintTradeAreaService.dbRemoves.filter(ta => ta.gtaId === gtaId).forEach(ta => taRemoves.push(ta));
      });

      this.impGeofootprintTradeAreaService.performDBRemoves(taRemoves).subscribe(responseCode => {
         console.log("geofootprint-geo-list received responseCode: ", responseCode);
         console.log("If below are still here, we need to remove them from datastore");
         let removesLeft: number = 0;
         let inStore: number = 0;
         this.impGeofootprintTradeAreaService.dbRemoves.filter(ta => removesLeft += (gtaIds.includes(ta.gtaId)) ? 1:0);
         this.impGeofootprintTradeAreaService.get().filter    (ta => inStore     += (gtaIds.includes(ta.gtaId)) ? 1:0);
         
         console.log("geo db removes: ", removesLeft);
         console.log("geo data store: ", inStore);
         console.log("--------------------------------------------");
      });
*/
/*
      console.log("--------------------------------------------");
      console.log("Remove 2 Locations");
      console.log("--------------------------------------------");
      // Stage locations removal
      let glIds: number[] = [17194, 17196];
      let locRemoves: ImpGeofootprintLocation[] = [];
      glIds.forEach(glId => {
         this.impGeofootprintLocationService.remove(this.impGeofootprintLocationService.get().filter(loc => loc.glId === glId));
         this.impGeofootprintLocationService.dbRemoves.filter(loc => loc.glId === glId).forEach(loc => locRemoves.push(loc));
      });
      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",locRemoves.length,"locations");

      this.impGeofootprintLocationService.performDBRemoves(locRemoves).subscribe(responseCode => {
         console.log("responseCode: ", responseCode);
         console.log("If below are still here, delete didn't work");

         let locRemovesLeft: number = 0;
         let locInStore:     number = 0;
         let taRemovesLeft:  number = 0;
         let taInStore:      number = 0;  
         this.impGeofootprintLocationService.dbRemoves.filter (loc => locRemovesLeft += (glIds.includes(loc.glId)) ? 1:0);
         this.impGeofootprintLocationService.get().filter     (loc => locInStore     += (glIds.includes(loc.glId)) ? 1:0);
         this.impGeofootprintTradeAreaService.dbRemoves.filter(ta  => taRemovesLeft  += (glIds.includes(ta.gtaId)) ? 1:0);
         this.impGeofootprintTradeAreaService.get().filter    (ta  => taInStore      += (glIds.includes(ta.gtaId)) ? 1:0);

         console.log("loc db removes: ", locRemovesLeft);
         console.log("loc data store: ", locInStore);
         console.log("ta  db removes: ", taRemovesLeft);
         console.log("ta  data store: ", taInStore);
      });
*/
/*
      // Stage a master removal
      let cgmId: number = 2859;
      this.impGeofootprintMasterService.remove(this.impGeofootprintMasterService.get().filter(ma => ma.cgmId === cgmId));
      let masterRemoves: ImpGeofootprintMaster[] = this.impGeofootprintMasterService.dbRemoves.filter(ma => ma.cgmId === cgmId)
      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ", masterRemoves.length,"Geofootprint Master");

      this.impGeofootprintMasterService.performDBRemoves(masterRemoves).subscribe(responseCode => {
         console.log("responseCode: ", responseCode);
         console.log("If below are still here, delete didn't work");
         console.log("Master db removes: ", this.impGeofootprintMasterService.dbRemoves.filter(ma => ma.cgmId === cgmId));
         console.log("Master data store: ", this.impGeofootprintMasterService.get().filter(ma => ma.cgmId === cgmId));
         console.log("Loc    db removes: ", this.impGeofootprintLocationService.dbRemoves.filter(loc => loc.cgmId === cgmId));
         console.log("Loc    data store: ", this.impGeofootprintLocationService.get().filter(loc => loc.cgmId === cgmId));         
      });
*/
/*
      // Stage a project removal
      let projectId: number = 3033;
      
      this.impProjectService.remove(this.impProjectService.get().filter(project => project.projectId === projectId));
      let projectRemoves: ImpProject[] = this.impProjectService.dbRemoves.filter(project => project.projectId === projectId)

      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",projectRemoves.length,"Project");

      this.impProjectService.performDBRemoves(projectRemoves).subscribe(responseCode => {
         console.log("responseCode: ", responseCode);
         console.log("If below are still here, delete didn't work");
         console.log("Project db removes: ", this.impProjectService.dbRemoves.filter(project => project.projectId === projectId));
         console.log("Project data store: ", this.impProjectService.get().filter(project => project.projectId === projectId));
         console.log("Pref    db removes: ", this.impProjectPrefService.dbRemoves.filter(project => project.projectId === projectId));
         console.log("Pref    data store: ", this.impProjectPrefService.get().filter(project => project.projectId === projectId));
      });
*/

// AND NOW FOR THE WEIRD STUFF

      // Test staging geo removes and calling performDBRemoves on project
      // Stage Geos removal
      let ggIds: number[] = [220264, 220265];

      console.log("BEFORE project total removes: ", this.impProjectService.getTreeRemoveCount(this.impProjectService.get()));

      let geoRemoves: ImpGeofootprintGeo[] = [];
      ggIds.forEach(ggId => {
         this.impGeofootprintGeoService.remove(this.impGeofootprintGeoService.get().filter(geo => geo.ggId === ggId));
         this.impGeofootprintGeoService.dbRemoves.filter(geo => geo.ggId === ggId).forEach(geo => geoRemoves.push(geo));
      });
     
      console.log("AFTER project total removes: ", this.impProjectService.getTreeRemoveCount(this.impProjectService.get()));
      
      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",geoRemoves.length,"locations");

      this.impProjectService.performDBRemoves([this.impProjectService.get()[0]]).subscribe(responseCode => {
         console.log("geofootprint-geo-list received responseCode: ", responseCode);
         console.log("If below are still here, we need to remove them from datastore");
         let removesLeft: number = 0;
         let inStore: number = 0;
         this.impGeofootprintGeoService.dbRemoves.filter(geo => removesLeft += (ggIds.includes(geo.ggId)) ? 1:0);
         this.impGeofootprintGeoService.get().filter    (geo => inStore     += (ggIds.includes(geo.ggId)) ? 1:0);
         
         console.log("geo db removes: ", removesLeft);
         console.log("geo data store: ", inStore);
         console.log("--------------------------------------------");
      });

/*
      console.log('Remove geos, but not the TA & specifically remove some TAs');
      console.log('----------------------------------------------------------');

      // Stage some geos not in a TA that is being removed
      let ggIds: number[] = [217774, 217775];
      let geoRemoves: ImpGeofootprintGeo[] = [];
      ggIds.forEach(ggId => {
         this.impGeofootprintGeoService.remove(this.impGeofootprintGeoService.get().filter(geo => geo.ggId === ggId));
         this.impGeofootprintGeoService.dbRemoves.filter(geo => geo.ggId === ggId).forEach(geo => geoRemoves.push(geo));
      });

      // Stage trade area removals
      let gtaIds: number[] = [37375, 37376];
      let taRemoves: ImpGeofootprintTradeArea[] = [];
      gtaIds.forEach(gtaId => {
         this.impGeofootprintTradeAreaService.remove(this.impGeofootprintTradeAreaService.get().filter(ta => ta.gtaId === gtaId));
      });
      // Pickup any trade areas that have deletes
      taRemoves = this.impGeofootprintTradeAreaService.filterBy ((ta, b) => ta.gtaId === b, (ta) => this.impGeofootprintTradeAreaService.getTreeRemoveCount(ta), false, true, true);

      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",taRemoves.length,"trade areas");
      console.log("staged: ",geoRemoves.length,"geos");

      this.impGeofootprintTradeAreaService.performDBRemoves(taRemoves).subscribe(responseCode => {
         console.log("geofootprint-geo-list received responseCode: ", responseCode);
         console.log("If below are still here, we need to remove them from datastore");
         let removesLeft: number = 0;
         let inStore: number = 0;
         this.impGeofootprintTradeAreaService.dbRemoves.filter(ta => removesLeft += (gtaIds.includes(ta.gtaId)) ? 1:0);
         this.impGeofootprintTradeAreaService.get().filter    (ta => inStore     += (gtaIds.includes(ta.gtaId)) ? 1:0);
         
         console.log("ta db removes: ", removesLeft);
         console.log("ta data store: ", inStore);
//       console.log("ta db removes: ", this.impGeofootprintTradeAreaService.dbRemoves.filter(ta => ta.gtaId === gtaId));
//       console.log("ta data store: ", this.impGeofootprintTradeAreaService.get().filter(ta => ta.gtaId === gtaId));
         console.log("--------------------------------------------");
      });
*/
/*
      // Stage a project with children to remove (Nothing should happen)
      let projectId: number = 3033;
      let removes: ImpProject[] = this.impProjectService.get().filter(project => project.projectId === projectId)
      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",removes.length,"Project");

      this.impProjectService.performDBRemoves(removes).subscribe(responseCode => {
         console.log("responseCode: ", responseCode);
         console.log("If below are still here, delete didn't work");
         console.log("Project db removes: ", this.impProjectService.dbRemoves.filter(project => project.projectId === projectId));
         console.log("Project data store: ", this.impProjectService.get().filter(project => project.projectId === projectId));
         console.log("Pref    db removes: ", this.impProjectPrefService.dbRemoves.filter(project => project.projectId === projectId));
         console.log("Pref    data store: ", this.impProjectPrefService.get().filter(project => project.projectId === projectId));
      });
*/
   }

   testDeleteProject()
   {
      this.impProjectService.postDelete(this.impProjectService.get()[0].projectId).subscribe(restResponse => {
         console.log ("testDeleteProject - response: ", restResponse);
      });
   }
}
