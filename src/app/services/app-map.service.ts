import { Injectable } from '@angular/core';
import { ValSiteListService } from './app-site-list.service';
import { Subscription } from 'rxjs/Subscription';
import { LocationUiModel } from '../models/location-ui.model';
import { EsriLayerService } from '../esri-modules/layers/esri-layer.service';
import { EsriMapService } from '../esri-modules/core/esri-map.service';

@Injectable()
export class ValMapService {
  private siteSubscription: Subscription;
  private currentSiteList: LocationUiModel[];

  constructor(private siteService: ValSiteListService, private layerService: EsriLayerService,
              private mapService: EsriMapService) {
    this.currentSiteList = [];
    this.mapService.onReady$.subscribe(ready => {
      if (ready) {
        this.siteSubscription = this.siteService.allUiSites$.subscribe(sites => {
          const clientSites = sites.filter(s => s.location.impClientLocationType.clientLocationType === 'Site');
          const competitorSites = sites.filter(s => s.location.impClientLocationType.clientLocationType === 'Competitor');
          if (clientSites.length > 0) {
            this.onSiteListChanged(clientSites, 'Site');
          }
          if (competitorSites.length > 0) {
            this.onSiteListChanged(competitorSites, 'Competitor');
          }
        });
      }
    });
  }

  private onSiteListChanged(sites: LocationUiModel[], siteType: string) {
    const oldSites = new Set(this.currentSiteList);
    const newSites = new Set(sites);
    const addedPoints = sites.filter(s => !oldSites.has(s)).map(s => s.point);
    const removedPoints = this.currentSiteList.filter(s => !newSites.has(s)).map(s => s.point);
    const updatedPoints = sites.filter(s => oldSites.has(s)).map(s => s.point);
    if (this.mapService.map.layers.map(l => l.title).includes(`${siteType}s`)) {
      this.layerService.addGraphicsToLayer(`Project ${siteType}s`, addedPoints);
      this.layerService.removeGraphicsFromLayer(`Project ${siteType}s`, removedPoints);
      this.layerService.setGraphicVisibility(`Project ${siteType}s`, updatedPoints);
    } else {
      this.layerService.createClientLayer(`${siteType}s`, `Project ${siteType}s`, sites.map(s => s.point), 'point');
    }
    this.currentSiteList = Array.from(sites);
  }
}
