import { ColorBoxComponent } from '../color-box/color-box.component';
import { Points } from '../../models/Points';
import { MapService } from '../../services/map.service';
import { SelectItem, Message } from 'primeng/primeng';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/components/common/messageservice';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { AppConfig } from '../../app.config';
import { ImpGeofootprintTradeArea } from './../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';

@Component({
    selector: 'val-tradearea-define',
    templateUrl: './tradearea-define.component.html',
    styleUrls: ['./tradearea-define.component.css'],
    providers: [MessageService]
})
export class TradeareaDefineComponent implements OnInit {

    mapView: __esri.MapView;

    ta1Miles: number;
    ta2Miles: number;
    ta3Miles: number;
    milesList: number[];
    selectedValue: String = 'Site';
    checked2: boolean = false;
    checked1: boolean = false;
    checked3: boolean = false;
    kms: number;

    kmsList: number[] = [];
    editedta1: boolean = false;
    editedta2: boolean = false;
    editedta3: boolean = false;

    competitorsMap: Map<string, string> = new Map<string, string>();
    sitesMap: Map<string, string> = new Map<string, string>();

    public tradeAreaMergeTypes: SelectItem[];
    public selectedMergeTypes: string;
    public displayDBSpinner: boolean = false;
    public growlMessages: Message[] = new Array();

    @ViewChild('campaineDetailsBox')
    private campaignDetailsBox: ColorBoxComponent;

    constructor(
        private mapService: MapService,
        private messageService: MessageService,
        private impGeofootprintLocationService: ImpGeofootprintLocationService,
        private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
        private config: AppConfig
    ) { }

    ngOnInit() {

        this.tradeAreaMergeTypes = [];
        this.tradeAreaMergeTypes.push({ label: 'No Merge', value: 'No Merge' });
        this.tradeAreaMergeTypes.push({ label: 'Merge Each', value: 'Merge Each' });
        this.tradeAreaMergeTypes.push({ label: 'Merge All', value: 'Merge All' });
        this.selectedMergeTypes = 'Merge Each';

    }

    public async drawBuffer() {
        this.messageService.clear();
        MapService.tradeAreaInfoMap.clear();
        //MapService.tradeAreaInfoMap.set('siteType', 'Advertisers');
        console.log('ta1miles::' + this.ta1Miles + 'ta2miles::' + this.ta2Miles + 'ta3Miles:: ' + this.ta3Miles);
        if (this.ta1Miles === undefined)
            this.ta1Miles = 0;
        if (this.ta2Miles === undefined)
            this.ta2Miles = 0;
        if (this.ta3Miles === undefined)
            this.ta3Miles = 0;

        const lyrNme: string = ' Mile Trade Area';

        let meTitle = 'Site - ';
        if (this.selectedValue === 'Competitor') {
            meTitle = 'Competitor - ';
            if (this.checked1) {
                this.competitorsMap.set('editedta1', String(this.editedta1));
                this.competitorsMap.set('checked1', String(this.checked1));
                this.competitorsMap.set('ta1Miles', String(this.ta1Miles));
            } else {
                this.competitorsMap.delete('editedta1');
                this.competitorsMap.delete('checked1');
                this.competitorsMap.delete('ta1Miles');
            }

            if (this.checked2) {
                this.competitorsMap.set('editedta2', String(this.editedta2));
                this.competitorsMap.set('checked2', String(this.checked2));
                this.competitorsMap.set('ta2Miles', String(this.ta2Miles));
            } else {
                this.competitorsMap.delete('editedta2');
                this.competitorsMap.delete('checked2');
                this.competitorsMap.delete('ta2Miles');
            }
            if (this.checked3) {
                this.competitorsMap.set('editedta3', String(this.editedta3));
                this.competitorsMap.set('checked3', String(this.checked3));
                this.competitorsMap.set('ta3Miles', String(this.ta3Miles));
            } else {
                this.competitorsMap.delete('editedta3');
                this.competitorsMap.delete('checked3');
                this.competitorsMap.delete('ta3Miles');
            }
        }
        if (this.selectedValue === 'Site') {
            if (this.checked1 && this.ta1Miles != null) {
                this.sitesMap.set('editedta1', String(this.editedta1));
                this.sitesMap.set('checked1', String(this.checked1));
                this.sitesMap.set('ta1Miles', String(this.ta1Miles));
            } else {
                this.sitesMap.delete('editedta1');
                this.sitesMap.delete('checked1');
                this.sitesMap.delete('ta1Miles');
            }
            if (this.checked2 && this.ta2Miles != null) {
                this.sitesMap.set('editedta2', String(this.editedta2));
                this.sitesMap.set('checked2', String(this.checked2));
                this.sitesMap.set('ta2Miles', String(this.ta2Miles));
            } else {
                this.sitesMap.delete('editedta2');
                this.sitesMap.delete('checked2');
                this.sitesMap.delete('ta2Miles');
            }
            if (this.checked3 && this.ta3Miles != null) {
                this.sitesMap.set('editedta3', String(this.editedta3));
                this.sitesMap.set('checked3', String(this.checked3));
                this.sitesMap.set('ta3Miles', String(this.ta3Miles));
            } else {
                this.sitesMap.delete('editedta3');
                this.sitesMap.delete('checked3');
                this.sitesMap.delete('ta3Miles');
            }
        }
        let mergeEachBool: boolean = false;
        let mergeAllBool: boolean = false;

        if (this.selectedValue === 'Site') {
            this.sitesMap.set('siteMerge', this.selectedMergeTypes);
        } else {
            this.competitorsMap.set('compMerge', this.selectedMergeTypes);
        }
        if (this.selectedMergeTypes.match('Merge Each')) {
            mergeEachBool = true;
        }
        if (this.selectedMergeTypes.match('Merge All')) {
            mergeAllBool = true;
        }

        this.milesList = [];
        this.messageService.clear();
        if ((this.ta1Miles != null && this.checked1) || (this.ta2Miles != null && this.checked2) || (this.ta3Miles != null && this.checked3)) {
            let isValid = false;
            ['ta1Miles', 'ta2Miles', 'ta3Miles'].forEach((model) => {
                if (this[model] < 0 || this[model] > this.config.maxBufferRadius) {
                    isValid = true;
                }
            });
            if (isValid) {
                //message
                this.messageService.add({ severity: 'error', summary: 'Draw Buffer Error', detail: `You must enter a numeric value > 0 and <= 50 for trade areas you want to apply.` });
                this.removeCheck();
            }
            else if (this.ta1Miles == 0 && this.checked1 || this.ta2Miles == 0 && this.checked2 || this.ta3Miles == 0 && this.checked3){
                //message
                this.messageService.add({ severity: 'error', summary: 'Draw Buffer Error', detail: `You must enter a numeric value > 0 and <= 50 for trade areas you want to apply.` });
                this.removeCheck();
            }
            else if ((this.ta1Miles === this.ta2Miles && this.checked1 && this.checked2) || (this.ta2Miles === this.ta3Miles && this.checked2 && this.checked3) || (this.ta3Miles === this.ta1Miles && this.checked3 && this.checked1)) {
                this.messageService.add({ severity: 'error', summary: 'Draw Buffer Error', detail: `You must enter a unique value for each trade area you want to apply.` });
                this.removeCheck();
            }
            else if (this.ta1Miles === this.ta2Miles && this.ta3Miles === this.ta1Miles && this.ta2Miles === this.ta3Miles && this.checked1 && this.checked2 && this.checked3) {
                this.messageService.add({ severity: 'error', summary: 'Draw Buffer Error', detail: `You must enter a unique value for each trade area you want to apply.` });
                this.removeCheck();
            }
            else {
                if (this.ta1Miles != null && this.checked1) {
                    this.milesList.push(this.ta1Miles);
                    MapService.tradeAreaInfoMap.set('TA1', this.ta1Miles);
                    this.editedta1 = true;
                }

                if (this.ta2Miles != null && this.checked2) {
                    this.milesList.push(this.ta2Miles);
                    MapService.tradeAreaInfoMap.set('TA2', this.ta2Miles);
                    this.editedta2 = true;
                }

                if (this.ta3Miles != null && this.checked3) {
                    this.milesList.push(this.ta3Miles);
                    MapService.tradeAreaInfoMap.set('TA3', this.ta3Miles);
                    this.editedta3 = true;
                }
                if (this.ta3Miles == null) { this.ta3Miles = 0; }
                if (this.ta2Miles == null) { this.ta2Miles = 0; }
                if (this.ta1Miles == null) { this.ta1Miles = 0; }
            }
        } else {
            this.messageService.add({ severity: 'error', summary: 'Draw Buffer Error', detail: `Please select at least one trade area to apply` });
            this.removeCheck();
        }

        try {
            this.mapView = this.mapService.getMapView();
            const pointsArray: Points[] = [];
            let existingGraphics: __esri.Collection<__esri.Graphic>;
            let lyrTitle: string;
            // let fLyrList: __esri.FeatureLayer[] = [];
            await this.mapService.getAllFeatureLayers().then(list => {
                //fLyrList = list;
                for (const layer of list) {
                    if (this.selectedValue.includes ('Site')) {
                        if (layer.title.startsWith('Site -')) {
                            this.disableLyr(MapService.SitesGroupLayer, layer);
                        }
                    }
                    if (this.selectedValue.includes('Competitor')) {
                        if (layer.title.startsWith('Competitor -')) {
                            this.disableLyr(MapService.CompetitorsGroupLayer, layer);
                        }
                    }

                  /*
                  *This code is commented as a part of US6635 points array will no longer be used
                  */
                  existingGraphics = (<__esri.FeatureLayer>layer).source;
                    if (layer.title.includes(this.selectedValue.toString())) {
                        lyrTitle = layer.title;
                       /*   existingGraphics.forEach(function (current: any) {
                            const points = new Points();
                            points.latitude = current.geometry.latitude;
                            points.longitude = current.geometry.longitude;
                            points.popup = current.popupTemplate;
                            pointsArray.push(points);
                        });*/
                    }
                }
            });

            let color = null;
            let outlneColor = null;
            if (lyrTitle.includes('Site')) {
                color = { a: 0, r: 0, g: 0, b: 255 };
                outlneColor = ([0, 0, 255, 2.50]);
            } else if (lyrTitle.includes('Competitor')) {
                color = { a: 0, r: 255, g: 0, b: 0 };
                outlneColor = ([255, 0, 0, 2.50]);
            }
            else {
                if (this.selectedValue.includes('Site')) {
                    this.displayTradeAreaError('Site');
                } else {
                    this.displayTradeAreaError('Competitor');
                }
                // hide the spinner after drawing buffer
                // this.displayDBSpinner = false;
            }
            //this.mapService.callTradeArea();
            if (mergeAllBool) {
                console.log('inside merge All');
                const max = Math.max(this.ta1Miles, this.ta2Miles, this.ta3Miles);
                if (max != null) {
                    this.kms = max / 0.62137;
                    await this.mapService.bufferMergeEach( color, this.kms, meTitle + max + lyrNme, outlneColor, this.selectedValue)
                        .then(res => {
                            if (this.selectedValue === 'Site'){
                            this.mapService.selectCentroid(res);
                        }
                        });
                    MapService.tradeAreaInfoMap.set('lyrName', meTitle + max + lyrNme);
                    MapService.tradeAreaInfoMap.set('mergeType', 'MergeAll');
                    MapService.tradeAreaInfoMap.set('milesMax', this.kms);
                    MapService.tradeAreaInfoMap.set('color', color);
                    MapService.tradeAreaInfoMap.set('outlneColor', outlneColor);
                    MapService.tradeAreaInfoMap.set('selector', this.selectedValue);
                }
            } else if (mergeEachBool) {
                console.log('inside merge Each');
                let siteId: number = 0;  // This is temporary until we connect trade areas to sites
                let graphicList: __esri.Graphic[];
                const max = Math.max(this.ta1Miles, this.ta2Miles, this.ta3Miles);
                this.mapService.displayDBSpinner = true;
                //  for(let point of pointsArray){
                for (const miles1 of this.milesList) {
                    const kmsMereEach = miles1 / 0.62137;
                    await this.mapService.bufferMergeEach(color, kmsMereEach, meTitle + miles1 + lyrNme, outlneColor, this.selectedValue, ++siteId)
                        .then(res => {
                            graphicList = res;
                        });
                    if (max == miles1 && this.selectedValue === 'Site' ){
                        this.mapService.selectCentroid(graphicList);
                    }
                    MapService.tradeAreaInfoMap.set('lyrName', meTitle + miles1 + lyrNme);
                }
                //MapService.SitesGroupLayer.layers.reverse();
                MapService.tradeAreaInfoMap.set('mergeType', 'MergeEach');
                MapService.tradeAreaInfoMap.set('miles', this.milesList);
                MapService.tradeAreaInfoMap.set('color', color);
                MapService.tradeAreaInfoMap.set('outlneColor', outlneColor);
                MapService.tradeAreaInfoMap.set('selector', this.selectedValue);

                // }
            } else {
                //var meTitle = 'Trade Area ';
                console.log('About to draw trade area circles');
                let i: number = 0;
                let siteId: number = 0;  // This is temporary until we connect trade areas to sites
                for (const miles1 of this.milesList) {
                    i++;
                    const kmsNomerge = miles1 / 0.62137;
                    for (const point of this.impGeofootprintLocationService.get()) {
                        await this.mapService.drawCircle(point.ycoord, point.xcoord, color, kmsNomerge, meTitle + miles1 + lyrNme, outlneColor, this.selectedValue, siteId++);
                        MapService.tradeAreaInfoMap.set('lyrName', meTitle + miles1 + lyrNme);
                    }

                }
                MapService.tradeAreaInfoMap.set('mergeType', 'NoMerge');
                MapService.tradeAreaInfoMap.set('miles', this.milesList);
                MapService.tradeAreaInfoMap.set('color', color);
                MapService.tradeAreaInfoMap.set('outlneColor', outlneColor);
                MapService.tradeAreaInfoMap.set('selector', this.selectedValue);
            }
            //this.appService.closeOverLayPanel.next(true);
        } catch (ex) {
            console.error(ex);
        }

    }

    public onApplyBtnClick() {
        //Show the DBSpinner on Apply
        this.displayDBSpinner = true;
        let promises: Promise<void>[];
        promises = [];

        promises.push(this.drawBuffer());

        Promise.all(promises)
            .then(() => {
                //Show the DBSpinner on Apply
                this.displayDBSpinner = false;
            });

      // --------------------------------------------------------------------------------
      // THIS IS TEMPORARY
      // TODO: Implement real solution when we have time
      // Add the trade areas to the ImpGeofootprintTradeArea data store manually for now
      // --------------------------------------------------------------------------------
      const tradeAreas: ImpGeofootprintTradeArea[] = 
          [new ImpGeofootprintTradeArea({ gtaId: 1, taNumber: 1, taName: 'Trade Area 1', taRadius: this.ta1Miles }),
           new ImpGeofootprintTradeArea({ gtaId: 2, taNumber: 2, taName: 'Trade Area 2', taRadius: this.ta2Miles }),
           new ImpGeofootprintTradeArea({ gtaId: 3, taNumber: 3, taName: 'Trade Area 3', taRadius: this.ta3Miles })];

      this.impGeofootprintTradeAreaService.clearAll();
      this.impGeofootprintTradeAreaService.add(tradeAreas);
    }

    /*
    Manage icons is fired when ever we change the values on the trade area text fields
    Turn the flags on and off
    */
    public async manageIcons(eventVal: string, taType: string) {
        console.log('manageIcons fired:: ');
        if (taType === 'ta1miles') {
            if (this.editedta1 && !this.ta1Miles) {
                this.editedta1 = false;
                this.checked1 = false;
            } else if (!this.editedta1 && this.ta1Miles) {
                this.editedta1 = false;
                this.checked1 = true;
            } else if (!this.editedta1 && !this.ta1Miles) {
                this.checked1 = false;
                this.editedta1 = false;
            }
            else if (this.editedta1) {
                this.editedta1 = false;
            }
        }
        if (taType === 'ta2miles') {
            if (this.editedta2 && !this.ta2Miles) {
                this.editedta2 = false;
                this.checked2 = false;
            } else if (!this.editedta2 && this.ta2Miles) {
                this.editedta2 = false;
                this.checked2 = true;
            } else if (!this.editedta2 && !this.ta2Miles) {
                this.checked2 = false;
                this.editedta2 = false;
            }
            else if (this.editedta2) {
                this.editedta2 = false;
            }
        }
        if (taType === 'ta3miles') {
            if (this.editedta3 && !this.ta3Miles) {
                this.editedta3 = false;
                this.checked3 = false;
            } else if (!this.editedta3 && this.ta3Miles) {
                this.editedta3 = false;
                this.checked3 = true;
            } else if (!this.editedta3 && !this.ta3Miles) {
                this.checked3 = false;
                this.editedta3 = false;
            }
            else if (this.editedta3) {
                this.editedta3 = false;
            }
        }
    }

    public async clearFields(eventVal: string, taType: string) {
        console.log('clearFields fired:: ');

        this.editedta1 = false;
        this.checked1 = false;
        this.ta1Miles = null;

        this.editedta2 = false;
        this.checked2 = false;
        this.ta2Miles = null;

        this.editedta3 = false;
        this.checked3 = false;
        this.ta3Miles = null;
        if (this.selectedValue === 'Competitor') {
            if (this.competitorsMap.get('ta3Miles') != null) {
                this.ta3Miles = Number(this.competitorsMap.get('ta3Miles'));
                this.checked3 = true;
                this.editedta3 = true;
            }
            if (this.competitorsMap.get('ta2Miles') != null) {
                this.ta2Miles = Number(this.competitorsMap.get('ta2Miles'));
                this.checked2 = true;
                this.editedta2 = true;
            }
            if (this.competitorsMap.get('ta1Miles') != null) {
                this.ta1Miles = Number(this.competitorsMap.get('ta1Miles'));
                this.checked1 = true;
                this.editedta1 = true;
            }
            if (this.competitorsMap.size !== 0) {
                this.selectedMergeTypes = this.competitorsMap.get('compMerge');
            } else {
                this.selectedMergeTypes = 'Merge Each';
            }
        }
        if (this.selectedValue === 'Site') {
            if (this.sitesMap.get('ta3Miles') != null) {
                this.ta3Miles = Number(this.sitesMap.get('ta3Miles'));
                this.checked3 = true;
                this.editedta3 = true;
            }
            if (this.sitesMap.get('ta2Miles') != null) {
                this.ta2Miles = Number(this.sitesMap.get('ta2Miles'));
                this.checked2 = true;
                this.editedta2 = true;
            }
            if (this.sitesMap.get('ta1Miles') != null) { // || this.sitesMap.get('ta1Miles') !== '0'
                this.ta1Miles = Number(this.sitesMap.get('ta1Miles'));
                this.checked1 = true;
                this.editedta1 = true;
            }
            if (this.sitesMap.size !== 0) {
                this.selectedMergeTypes = this.sitesMap.get('siteMerge');
            } else {
                this.selectedMergeTypes = 'Merge Each';
            }
        }
    }

    public async disableLyr(groupLayer: __esri.GroupLayer, layer: __esri.Layer) {
        console.log('disable Layer:');
        groupLayer.remove(layer);
        MapService.layers.delete(layer);
        MapService.layerNames.delete(layer.title);
        this.mapView = this.mapService.getMapView();
        this.mapView.map.remove(layer);
    }
    public async removeBuffer() {
        await this.mapService.removeMapLayers();
    }
    private displayTradeAreaError(type) {
        this.messageService.clear();
        this.messageService.add({ severity: 'error', summary: 'Draw Buffer Error', detail: `You must add at least 1 ${type} before attempting to apply a trade area to ${type}s`});
        this.removeCheck();

    }
    private removeCheck(){
        this.editedta1 = false;
        this.editedta2 = false;
        this.editedta3 = false;
    }
}
