import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { LocalState } from '../../state';
import { localSelectors } from '../../state/app.selectors';
import { withLatestFrom, filter, tap } from 'rxjs/operators';
import { SetLegendHTML } from '../../state/shared/shared.actions';
import { shadingType } from '../../state/shared/shared.reducers';
import { RfpUiEdit } from 'src/app/val-modules/mediaexpress/models/RfpUiEdit';
import { RfpUiEditDetail } from 'src/app/val-modules/mediaexpress/models/RfpUiEditDetail';

@Component({
  selector: 'val-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.css']
})
export class LegendComponent implements OnInit {

  @ViewChild('legendNode')
  public legendNode: ElementRef;
  public color: string = 'ffff00';
  public legendData: Array<{key: string, value: string, hhc: string}> = [];
  myStyles = {
    'background-color': 'lime',
    'font-size': '20px',
    'font-weight': 'bold'
    };

  constructor(private store$: Store<LocalState>, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.store$.pipe(
      select(localSelectors.getShadingData),
      withLatestFrom(
        this.store$.pipe(select(localSelectors.getShadingType)),
        this.store$.pipe(select(localSelectors.getRfpUiEditEntities)),
        this.store$.pipe(select(localSelectors.getRfpUiEditDetailEntities)),
      )
    ).subscribe(([shadingData, legendType, uiEditEntities, uiEditDetailEntities]) => {
      this.setupLegend(shadingData, legendType, uiEditEntities, uiEditDetailEntities);
    });
    this.store$.pipe(
      select(localSelectors.getRfpUiEditDetailEntities),
      withLatestFrom(
        this.store$.pipe(select(localSelectors.getRfpUiEditEntities)),
        this.store$.pipe(select(localSelectors.getShadingData)),
        this.store$.pipe(select(localSelectors.getShadingType))
      )
    ).subscribe(([uiEditDetailEntities, uiEditEntities, shadingData, legendType]) => {
      this.setupLegend(shadingData, legendType, uiEditEntities, uiEditDetailEntities);
    });
  }

  private setupLegend(shadingData: Array<{key: string | Number, value: number[]}>, legendType: shadingType, uiEditEntities: RfpUiEdit[], uiEditDetailEntities: RfpUiEditDetail[]) {
    this.legendData = [];
      shadingData.forEach(sd => {
        const color = this.colorToHex(sd.value[0], sd.value[1], sd.value[2]);
        const hhc = this.getHHC(legendType, sd.key.toString(), uiEditEntities, uiEditDetailEntities);
        this.legendData.push({ key: sd.key.toString(), value: color, hhc: hhc.toLocaleString() });
      });
      this.cd.markForCheck();
      setTimeout(() => {
        const event = new Event('change');
        this.store$.dispatch(new SetLegendHTML());
      }, 0);
  }

  private getHHC(legendType: shadingType, shadingKey: string, uiEditEntities: RfpUiEdit[], uiEditDetailEntities: RfpUiEditDetail[]) : number {
    switch (legendType) {
      case shadingType.ZIP :
        return this.getZipHHC(uiEditDetailEntities, shadingKey);
      case shadingType.SITE:
        return this.getSiteHHC(uiEditEntities, uiEditDetailEntities, shadingKey);
      case shadingType.ATZ_DESIGNATOR:
        return this.getAtzHHC(uiEditDetailEntities, shadingKey);
      case shadingType.WRAP_ZONE:
        return this.getWrapHHC(uiEditDetailEntities, shadingKey);
      default:
        return 0;
    }
  }

  private getAtzDesignator(geocode: string) : string {
    if (geocode.length === 5)
      return geocode;
    else
      return geocode.substring(5, geocode.length);
  }

  private getWrapHHC(uiEditDetailEntities: RfpUiEditDetail[], wrapZone: string) : number {
    let hhc = 0;
    for (const entity of uiEditDetailEntities) {
      if (entity.wrapZone === wrapZone && entity.isSelected)
        hhc += entity.distribution;
    }
    return hhc;
  }

  private getAtzHHC(uiEditDetailEntities: RfpUiEditDetail[], designator: string) : number{
    let hhc = 0;
    for (const entity of uiEditDetailEntities) {
      if (this.getAtzDesignator(entity.geocode) === designator && entity.isSelected )
        hhc += entity.distribution;
    }
    return hhc;
  }

  private getSiteHHC(uiEditEntities: RfpUiEdit[], uiEditDetailEntities: RfpUiEditDetail[], site: string) : number {
    let hhc = 0;
    for (const editEntity of uiEditEntities) {
      if (editEntity.siteName !== site)
        continue;
      for(const editDetailEntity of uiEditDetailEntities) {
        if (editDetailEntity.fkSite === editEntity.siteId && editDetailEntity.isSelected)
          hhc += editDetailEntity.distribution;
      }
    }
    return hhc;
  }

  private getZipHHC(uiEditDetailEntities: RfpUiEditDetail[], zip: string) : number {
    let hhc: number = 0;
    for (const entity of uiEditDetailEntities) {
      if (entity.zip === zip && entity.isSelected)
        hhc += entity.distribution;
    }
    return hhc;
  }

  private colorToHex(r: number, g: number, b: number) {
    const red = this.singleValueToHex(r);
    const green = this.singleValueToHex(g);
    const blue = this.singleValueToHex(b);
    return '#' + red + green + blue + '99';
  }

  private singleValueToHex (value: number) : string {
    let hex: string = Number(value).toString(16);
    if (hex.length < 2) {
         hex = '0' + hex;
    }
    return hex;
  }

}
