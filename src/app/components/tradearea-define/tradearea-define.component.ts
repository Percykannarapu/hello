import { ColorBoxComponent } from '../color-box/color-box.component';
import { Points } from '../../Models/Points';
import { MapService } from '../../services/map.service';
import { SelectItem, GrowlModule, Message } from 'primeng/primeng';
import { Component, OnInit, ViewChild} from '@angular/core';

@Component({
  selector: 'val-tradearea-define',
  templateUrl: './tradearea-define.component.html',
  styleUrls: ['./tradearea-define.component.css']
})
export class TradeareaDefineComponent implements OnInit {

  mapView: __esri.MapView;
  
  ta1Miles: number;
  ta2Miles: number;
  ta3Miles: number;
  milesList: number[];
  selectedValue: String = 'Sites';
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
  ) { }

  ngOnInit() {

    this.tradeAreaMergeTypes = [];
    this.tradeAreaMergeTypes.push({ label: 'No Merge', value: 'No Merge' });
    this.tradeAreaMergeTypes.push({ label: 'Merge Each', value: 'Merge Each' });
    this.tradeAreaMergeTypes.push({ label: 'Merge All', value: 'Merge All' });
    this.selectedMergeTypes = 'Merge Each';

  }


  public async drawBuffer() {
    console.log('ta1miles::' + this.ta1Miles + 'ta2miles::' + this.ta2Miles + 'ta3Miles:: ' + this.ta3Miles);
    //show the spinner while we do our work
    this.displayDBSpinner = true;
    const lyrNme: string = ' Mile Trade Area';
    let meTitle = 'Site - ';
    if (this.selectedValue === 'Competitors') {
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
    if (this.selectedValue === 'Sites') {
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

    if (this.selectedValue === 'Sites') {
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
    if (this.ta1Miles != null && this.checked1) {
        this.milesList.push(this.ta1Miles);
        this.editedta1 = true;
    }

    if (this.ta2Miles != null && this.checked2) {
        this.milesList.push(this.ta2Miles);
        this.editedta2 = true;
    }

    if (this.ta3Miles != null && this.checked3) {
        this.milesList.push(this.ta3Miles);
        this.editedta3 = true;
    }

    if (this.ta3Miles == null) { this.ta3Miles = 0; }
    if (this.ta2Miles == null) { this.ta2Miles = 0; }
    if (this.ta1Miles == null) { this.ta1Miles = 0; }

    try {
        this.mapView = this.mapService.getMapView();
        const pointsArray: Points[] = [];
        let existingGraphics: __esri.Collection<__esri.Graphic>;
        let lyrTitle: string;
        await MapService.layers.forEach(layer => {
            if (this.selectedValue === 'Sites') {
                if (layer.title.startsWith('Site -')) {
                    this.disableLyr(layer);
                }
            }
            if (this.selectedValue === 'Competitors') {
                if (layer.title.startsWith('Competitor -')) {
                    this.disableLyr(layer);
                }
            }

            existingGraphics = (<__esri.FeatureLayer>layer).source;
            if (layer.title === this.selectedValue) {
                lyrTitle = layer.title;
                existingGraphics.forEach(function (current: any) {
                    const points = new Points();
                    points.latitude = current.geometry.latitude;
                    points.longitude = current.geometry.longitude;
                    pointsArray.push(points);
                });
            }
        });
        let color = null;
        let outlneColor = null;
        if (lyrTitle === 'Sites') {
            color = { a: 0, r: 0, g: 0, b: 255 };
            outlneColor = ([0, 0, 255, 2.50]);
        } else if (lyrTitle === 'Competitors') {
            color = { a: 0, r: 255, g: 0, b: 0 };
            outlneColor = ([255, 0, 0, 2.50]);
        }
        else{
            if (this.selectedValue === 'Sites'){
                this.displayTradeAreaError('Sites');
            }else{
                this.displayTradeAreaError('Competitors');
            }
            //hide the spinner after drawing buffer
            this.displayDBSpinner = false;
        }
        if (mergeAllBool) {
            console.log('inside merge All');
            const max = Math.max(this.ta1Miles, this.ta2Miles, this.ta3Miles);
            if (max != null) {
                this.kms = max / 0.62137;
                await this.mapService.bufferMergeEach(pointsArray, color, this.kms, meTitle + max + lyrNme, outlneColor);
            }
        } else if (mergeEachBool) {
            console.log('inside merge Each');
            let siteId: number = 0;  // This is temporary until we connect trade areas to sites
            
            //  for(let point of pointsArray){
            for (const miles1 of this.milesList) {
                const kmsMereEach = miles1 / 0.62137;
                console.log('Kms in Merge Each:::' + kmsMereEach + ',  Title: ' + meTitle + miles1 + lyrNme);
                console.log('meTitle: ' + meTitle + ', miles1: ' + miles1 + ', lyrNme: ' + lyrNme);
                await this.mapService.bufferMergeEach(pointsArray, color, kmsMereEach, meTitle + miles1 + lyrNme, outlneColor, ++siteId);
            }
            // }
        } else {
            //var meTitle = 'Trade Area ';
            console.log('About to draw trade area circles');
            let i: number = 0;
            let siteId: number = 0;  // This is temporary until we connect trade areas to sites
            for (const miles1 of this.milesList) {
                i++;
                const kmsNomerge = miles1 / 0.62137;
                for (const point of pointsArray) {
                  console.log('Kms in No Merge:::' + kmsNomerge + ',  Title: ' + meTitle + miles1 + lyrNme);
                  console.log('meTitle: ' + meTitle + ', miles1: ' + miles1 + ', lyrNme: ' + lyrNme);
                  await this.mapService.drawCircle(point.latitude, point.longitude, color, kmsNomerge, meTitle + miles1 + lyrNme, outlneColor, siteId++);
                }
            }
        }
        //hide the spinner after drawing buffer
        this.displayDBSpinner = false;
        //this.appService.closeOverLayPanel.next(true);
    } catch (ex) {
        console.error(ex);
    }
}

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
    if (this.selectedValue === 'Competitors') {
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
        if (this.competitorsMap.size !== 0){
            this.selectedMergeTypes = this.competitorsMap.get('compMerge');
        } else{
            this.selectedMergeTypes = 'Merge Each';
        }
    }
    if (this.selectedValue === 'Sites') {
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
        if (this.sitesMap.get('ta1Miles') != null) {
            this.ta1Miles = Number(this.sitesMap.get('ta1Miles'));
            this.checked1 = true;
            this.editedta1 = true;
        }
        if (this.sitesMap.size !== 0){
            this.selectedMergeTypes = this.sitesMap.get('siteMerge');
        } else {
            this.selectedMergeTypes = 'Merge Each';
        }
    }
}

public async disableLyr(layer: __esri.Layer) {
  console.log('disable Layer:');
  MapService.layers.delete(layer); 
  MapService.layerNames.delete(layer.title);
  this.mapView = this.mapService.getMapView();
  this.mapView.map.remove(layer);
}
public async removeBuffer() {
  await this.mapService.removeMapLayers();
}
private displayTradeAreaError(type) {
    const growlMessage: Message = {
        summary: 'DrawBuffer error',
        severity: 'error',
        detail: `No ${type} plotted points on the map`
    };
    this.growlMessages.push(growlMessage);
  }

}
