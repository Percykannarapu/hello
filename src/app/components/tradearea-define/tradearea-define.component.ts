import { MapService } from '../../services/map.service';
import { SelectItem } from 'primeng/primeng';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from 'primeng/components/common/messageservice';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { AppConfig } from '../../app.config';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { Subscription } from 'rxjs/Subscription';
import { TradeAreaUIModel } from './trade-area-ui.model';

type SiteType = 'Site' | 'Competitor';
interface MergeType { value: string; }

@Component({
    selector: 'val-tradearea-define',
    templateUrl: './tradearea-define.component.html',
    styleUrls: ['./tradearea-define.component.css']
})
export class TradeareaDefineComponent implements OnInit, OnDestroy {

    private geofootprintSubscription: Subscription;

    private siteTradeAreas: TradeAreaUIModel[];
    private siteMergeType: MergeType;
    private competitorTradeAreas: TradeAreaUIModel[];
    private competitorMergeType: MergeType;

    currentTradeAreas: TradeAreaUIModel[];
    currentMergeType: MergeType;
    currentSiteType: SiteType;
    tradeAreaMergeTypes: SelectItem[];

    constructor(
        public mapService: MapService,
        private messageService: MessageService,
        private impGeofootprintLocationService: ImpGeofootprintLocationService,
        private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
        private config: AppConfig,
        private esriMapService: EsriMapService
    ) {
      this.tradeAreaMergeTypes = [
        //{ label: 'No Merge', value: 'No Merge' }, //Commented out for DE1591 :nallana
        { label: 'Merge Each', value: 'Merge Each' },
        { label: 'Merge All', value: 'Merge All' }
      ];

      this.siteTradeAreas = [
        new TradeAreaUIModel(this.config.maxBufferRadius),
        new TradeAreaUIModel(this.config.maxBufferRadius),
        new TradeAreaUIModel(this.config.maxBufferRadius)
      ];
      this.siteMergeType = { value: this.tradeAreaMergeTypes[0].value };
      this.competitorTradeAreas = [
        new TradeAreaUIModel(this.config.maxBufferRadius),
        new TradeAreaUIModel(this.config.maxBufferRadius),
        new TradeAreaUIModel(this.config.maxBufferRadius)
      ];
      this.competitorMergeType = { value: this.tradeAreaMergeTypes[0].value };

      this.currentSiteType = 'Site';
      this.currentTradeAreas = this.siteTradeAreas;
      this.currentMergeType = this.siteMergeType;
    }

    ngOnInit() : void {
         // Subscribe to the sites data store
         this.geofootprintSubscription = this.impGeofootprintLocationService.storeObservable.subscribe(storeData => this.onChangeLocation(storeData));
    }

    ngOnDestroy() : void {
      this.geofootprintSubscription.unsubscribe();
    }

    /**
    * Respond to changes in the locations service
    *
    * @param impGeofootprintLocations The array of locations received from the observable
    */
    onChangeLocation(impGeofootprintLocations: ImpGeofootprintLocation[]) : void {
      this.mapService.displayDBSpinner = true;

      console.log('----------------------------------------------------------------------------------------');
      console.log('tradearea-define.component - onChangeLocation - :  ', impGeofootprintLocations);
      console.log('----------------------------------------------------------------------------------------');

     this.drawBuffer('Site');
     this.mapService.displayDBSpinner = false;
    }

    public drawBuffer(tradeAreaType: SiteType) {
        this.messageService.clear();
        this.mapService.displayDBSpinner = true;

        const isSiteBuffer = (tradeAreaType === 'Site');
        const layerPrefix = `${tradeAreaType} - `;
        const currentLayerGroup: __esri.GroupLayer = (isSiteBuffer ? MapService.SitesGroupLayer : MapService.CompetitorsGroupLayer);
        const workingTradeAreas: TradeAreaUIModel[] = this.currentTradeAreas.filter(t => t.isShowing);

        if (workingTradeAreas.length === 0) return;

        const hasDuplicates: boolean = new Set(workingTradeAreas.map(t => t.tradeArea)).size !== workingTradeAreas.length;
        if (hasDuplicates) {
            this.messageService.add({ severity: 'error', summary: 'Draw Buffer Error', detail: `You must enter a unique value for each trade area you want to apply.` });
            return;
        }

        const maxRadius = Math.max(...workingTradeAreas.map(t => t.tradeArea));
        const maxRadiusModel = workingTradeAreas.find(t => t.tradeArea === maxRadius);

        try {
            this.clearLayers(currentLayerGroup, layerPrefix);
            const color = { a: 0, r: 0, g: 0, b: 0 };
            const outlineColor = (isSiteBuffer ? [0, 0, 255, 2.50] : [255, 0, 0, 2.50]);
            switch (this.currentMergeType.value) {
                case 'Merge Each':
                    let siteId: number = 0;  // This is temporary until we connect trade areas to sites
                    for (const model of workingTradeAreas) {
                        this.mapService.bufferMergeEach(color, model.tradeAreaInKm, layerPrefix + model.layerName, outlineColor, tradeAreaType, ++siteId)
                          .then(res => {
                            if (model.tradeArea === maxRadius && isSiteBuffer) {
                              this.mapService.displaySpinnerMessage = 'Selecting geography...';
                             //const resp = this.mapService.selectCentroid(res);
                             //this.displaySpinnerMessage = 'Shading the geofootprint...';
                             return this.mapService.selectCentroid(res).then(() => {
                              //this.displayDBSpinner = false;
                              this.mapService.displaySpinnerMessage = 'Drawing Buffer...';
                              //console.log('display', this.displayDBSpinner);
                             });
                            }
                          });
                      MapService.tradeAreaInfoMap.set('lyrName', layerPrefix + model.layerName);
                    }
                    MapService.tradeAreaInfoMap.set('mergeType', 'MergeEach');
                    MapService.tradeAreaInfoMap.set('miles', workingTradeAreas.map(t => t.tradeArea));
                    MapService.tradeAreaInfoMap.set('color', color);
                    MapService.tradeAreaInfoMap.set('outlneColor', outlineColor);
                    MapService.tradeAreaInfoMap.set('selector', tradeAreaType);
                    break;
                case 'Merge All':
                    this.mapService.bufferMergeEach(color, maxRadiusModel.tradeAreaInKm, layerPrefix + maxRadiusModel.layerName, outlineColor, tradeAreaType)
                      .then(res => {
                        if (isSiteBuffer) {
                          this.mapService.displaySpinnerMessage = 'Selecting geography...';
                          return this.mapService.selectCentroid(res).then(() => {
                            //this.displayDBSpinner = false;
                            this.mapService.displaySpinnerMessage = 'Drawing Buffer...';
                            //console.log('display', this.displayDBSpinner);
                           });
                          }
                        });
                    MapService.tradeAreaInfoMap.set('lyrName', layerPrefix + maxRadiusModel.layerName);
                    MapService.tradeAreaInfoMap.set('mergeType', 'MergeAll');
                    MapService.tradeAreaInfoMap.set('milesMax', maxRadius);
                    MapService.tradeAreaInfoMap.set('color', color);
                    MapService.tradeAreaInfoMap.set('outlneColor', outlineColor);
                    MapService.tradeAreaInfoMap.set('selector', tradeAreaType);
                    break;
                case 'No Merge':
                //var meTitle = 'Trade Area ';
                // due to time constraintes we had not done the changes need to replace this logic DE1591
                // console.log('About to draw trade area circles');
                // let i: number = 0;
                // let siteId: number = 0;  // This is temporary until we connect trade areas to sites
                // let graphicList: __esri.Graphic[];
                // const max = Math.max(this.tradeArea1, this.tradeArea2, this.tradeArea3);
                // for (const miles1 of this.milesList) {
                //     i++;
                //     const kmsNomerge = miles1 / 0.62137;
                //     for (const point of this.impGeofootprintLocationService.get()) {
                //         if (point.impClientLocationType.toString() == 'Site' && this.currentSiteType === 'Site') {
                //                     await this.mapService.drawCircle(point.ycoord, point.xcoord, color, kmsNomerge, layerPrefix + miles1 + lyrNme, outlneColor, this.currentSiteType, siteId++)
                //                     .then( res => {
                //                         graphicList = res;
                //                         if (max == miles1 && this.currentSiteType === 'Site' ){
                //                             this.mapService.selectCentroid(graphicList);
                //                         }
                //                     }) ;
                //                 MapService.tradeAreaInfoMap.set('lyrName', layerPrefix + miles1 + lyrNme);
                //         }
                //         else if (point.impClientLocationType.toString() == 'Competitor' && this.currentSiteType === 'Competitor') {
                //             await this.mapService.drawCircle(point.ycoord, point.xcoord, color, kmsNomerge, layerPrefix + miles1 + lyrNme, outlneColor, this.currentSiteType, siteId++)
                //                     .then( res => {
                //                         graphicList = res;
                //                         // if (max == miles1 && this.selectedValue === 'Competitor' ){
                //                         //     this.mapService.selectCentroid(graphicList);
                //                         // }
                //                     }) ;
                //                 MapService.tradeAreaInfoMap.set('lyrName', layerPrefix + miles1 + lyrNme);
                //         }
                //     }
                // }
                // MapService.tradeAreaInfoMap.set('mergeType', 'NoMerge');
                // MapService.tradeAreaInfoMap.set('miles', this.milesList);
                // MapService.tradeAreaInfoMap.set('color', color);
                // MapService.tradeAreaInfoMap.set('outlneColor', outlneColor);
                // MapService.tradeAreaInfoMap.set('selector', this.currentSiteType);
                break;
              default:
                console.error(`Trade Area Define component encountered an unknown merge type: ${this.currentMergeType.value}`);
            }
        } catch (ex) {
            this.messageService.add({ severity: 'error', summary: 'Draw Buffer Error', detail: `An unknown error has occurred, please check log for details.` });
            console.error(ex);
        }
    }

    public onApplyBtnClick() {
      //Show the DBSpinner on Apply
      this.mapService.displayDBSpinner = true;
      this.drawBuffer(this.currentSiteType);

      // --------------------------------------------------------------------------------
      // THIS IS TEMPORARY
      // TODO: Implement real solution when we have time
      // Add the trade areas to the ImpGeofootprintTradeArea data store manually for now
      // --------------------------------------------------------------------------------
      const siteGFTradeAreas: ImpGeofootprintTradeArea[] =
        this.siteTradeAreas
          .filter(t => t.isShowing)
          .map((t, index) => {
            return new ImpGeofootprintTradeArea({ gtaId: index + 1, taNumber: index + 1, taName: `Site Trade Area ${index + 1}`, taRadius: t.tradeArea });
          });
      const compGFTradeAreas: ImpGeofootprintTradeArea[] =
        this.competitorTradeAreas
          .filter(t => t.isShowing)
          .map((t, index) => {
            return new ImpGeofootprintTradeArea({ gtaId: index + 1, taNumber: index + 1, taName: `Competitor Trade Area ${index + 1}`, taRadius: t.tradeArea });
          });

      this.impGeofootprintTradeAreaService.clearAll();
      if (siteGFTradeAreas && siteGFTradeAreas.length > 0) {
        this.impGeofootprintTradeAreaService.add(siteGFTradeAreas);
      }
      if (compGFTradeAreas && compGFTradeAreas.length > 0) {
        this.impGeofootprintTradeAreaService.add(compGFTradeAreas);
      }
    }

    public onChangeSiteType(event: SiteType) : void {
        switch (event) {
          case 'Site':
            this.currentTradeAreas = this.siteTradeAreas;
            this.currentMergeType = this.siteMergeType;
            break;
          case 'Competitor':
            this.currentTradeAreas = this.competitorTradeAreas;
            this.currentMergeType = this.competitorMergeType;
        }
    }

    public clearLayers(groupLayer: __esri.GroupLayer, prefix: string) {
        const layersToRemove = groupLayer.layers.filter(l => l.title.startsWith(prefix)).toArray();
        for (const layer of layersToRemove) {
          groupLayer.remove(layer);
          MapService.layers.delete(layer);
          MapService.layerNames.delete(layer.title);
          this.esriMapService.map.remove(layer);
        }
    }

    private displayTradeAreaError(type) {
        this.messageService.clear();
        this.messageService.add({ severity: 'error', summary: 'Draw Buffer Error', detail: `You must add at least 1 ${type} before attempting to apply a trade area to ${type}s`});
    }

    applyDisabled() : boolean {
        return this.currentTradeAreas.some(t => t.isValid === false) || this.currentTradeAreas.every(t => t.isValid == null);
    }
}
