import { SelectItem } from 'primeng/primeng';
import { Component } from '@angular/core';
import { AppConfig } from '../../app.config';
import { TradeAreaUIModel } from './trade-area-ui.model';
import { RadialTradeAreaDefaults, ValTradeAreaService } from '../../services/app-trade-area.service';

type SiteType = 'Site' | 'Competitor';
interface MergeType { value: string; }

@Component({
    selector: 'val-tradearea-define',
    templateUrl: './tradearea-define.component.html',
    styleUrls: ['./tradearea-define.component.css']
})
export class TradeareaDefineComponent {

    private siteTradeAreas: TradeAreaUIModel[];
    private siteMergeType: MergeType;
    private competitorTradeAreas: TradeAreaUIModel[];
    private competitorMergeType: MergeType;

    currentTradeAreas: TradeAreaUIModel[];
    currentMergeType: MergeType;
    currentSiteType: SiteType;
    tradeAreaMergeTypes: SelectItem[];

    constructor(private tradeAreaService: ValTradeAreaService, private config: AppConfig) {
      this.tradeAreaMergeTypes = [
        { label: 'No Merge', value: 'No Merge' },
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

    public onApplyBtnClick() {
      const tradeAreas: TradeAreaUIModel[] = this.currentTradeAreas.filter(ta => ta.isShowing) || [];
      const settings = new RadialTradeAreaDefaults(tradeAreas.map(ta => ta.tradeArea), this.currentMergeType.value);
      this.tradeAreaService.applyRadialDefaults(settings, this.currentSiteType);
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

    applyDisabled() : boolean {
        return this.currentTradeAreas.some(t => t.isValid === false) || this.currentTradeAreas.every(t => t.isValid == null);
    }
}
