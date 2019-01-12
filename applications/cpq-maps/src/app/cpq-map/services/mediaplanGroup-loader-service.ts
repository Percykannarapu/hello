import { Injectable } from '@angular/core';
import { MediaPlanGroupPayload } from '../state/payload-models/MediaPlanGroup';
import { EMPTY, Observable } from 'rxjs';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { map } from 'rxjs/operators';
import { MediaPlanGroup } from '../../val-modules/mediaexpress/models/MediaPlanGroup';
import { MediaPlan } from '../../val-modules/mediaexpress/models/MediaPlan';
import { AdvertiserInfo } from '../../val-modules/mediaexpress/models/AdvertiserInfo';
import { Objective } from '../../val-modules/mediaexpress/models/Objective';
import { MediaPlanCommonMbu } from '../../val-modules/mediaexpress/models/MediaPlanCommonMbu';
import { MediaPlanLine } from '../../val-modules/mediaexpress/models/MediaPlanLine';
import { CbxReport } from '../../val-modules/mediaexpress/models/CbxReport';
import { ProductAllocation } from '../../val-modules/mediaexpress/models/ProductAllocation';
import { TargetAudiencePref } from '../../val-modules/mediaexpress/models/TargetAudiencePref';
import { simpleFlatten } from '@val/common';

export interface NormalizedPayload {
  mediaPlanGroup?: MediaPlanGroup;
  mediaPlans?: MediaPlan[];
  //targetingProfiles: 
  advertiserInfos?: AdvertiserInfo[];
  objectives?: Objective[];
  commonMbus?: MediaPlanCommonMbu[];
  lines?: MediaPlanLine[];
  reports?: CbxReport[];
  productAllocations?: ProductAllocation[];
  targetAudiencePrefs?: TargetAudiencePref[];
}

@Injectable({
  providedIn: 'root'
})
export class MediaPlanGroupLoaderService {

  readonly loadUrl: string = 'v1/mediaexpress/base/mediaplangroup/load';
  readonly saveUrl: string = 'v1/mediaexpress/base/mediaplangroup/save';

  constructor(private restService: RestDataService) {}

  loadMediaPlanGroup(id: number) : Observable<MediaPlanGroupPayload> {
    if (id == null || id < 0) return EMPTY;
    return this.restService.get(`${this.loadUrl}/${id}`).pipe(
      map(response => response.payload as MediaPlanGroupPayload)
    );
  }

  saveMediaPlanGroup(project: MediaPlanGroupPayload) : Observable<number> {
    return this.restService.post(this.saveUrl, project).pipe(
      map(response => response.payload)
    );
  }

  normalizeProject(payload: MediaPlanGroupPayload) : MediaPlanGroup {
    const mediaPlanGroup = new MediaPlanGroup();
    mediaPlanGroup.mediaPlanGroupId = payload.mediaPlanGroupId;
    mediaPlanGroup.createUser = payload.createUser;
    mediaPlanGroup.createDate = payload.createDate;
    mediaPlanGroup.groupName = payload.groupName;
    if (payload.advertiserInfos != null)
      payload.advertiserInfos.forEach(ai => mediaPlanGroup.advertiserInfos.push(ai.advertiserInfoId));
    if (payload.mediaPlans != null)
      payload.mediaPlans.forEach(mp => mediaPlanGroup.mediaPlans.push(mp.mediaPlanId));
    return mediaPlanGroup;
  }

  normalize2(payload: MediaPlanGroupPayload) : NormalizedPayload {
    if (payload == null) throw new Error('Cannot normalize a null or undefined payload');
    const mediaPlanGroup: MediaPlanGroup = Object.assign({}, payload, {advertiserInfos: null, mediaPlans: null, baseStatus: null});
    mediaPlanGroup.mediaPlans = payload.mediaPlans.map(m => m.mediaPlanId);
    /*const flatLocations = simpleFlatten((payload.impGeofootprintMasters || []).map(m => m.impGeofootprintLocations));
    const flatLocAttribs = simpleFlatten(flatLocations.map(l => l.impGeofootprintLocAttribs));
    const flatTradeAreas = simpleFlatten(flatLocations.map(l => l.impGeofootprintTradeAreas));
    const flatGeos = simpleFlatten(flatTradeAreas.map(ta => ta.impGeofootprintGeos));*/
    return {
      mediaPlanGroup: mediaPlanGroup,
      mediaPlans: this.normalizeMediaPlans(payload),
      commonMbus: this.normalizeCommonMbus(payload),
      lines: this.normalizeLines(payload),
    };
  }

  private normalizeMediaPlans(payload: MediaPlanGroupPayload) : MediaPlan[] {
    const mediaPlans: Array<MediaPlan> = [];
    for (let i = 0; i < payload.mediaPlans.length; i++) {
      const mediaPlan: MediaPlan = Object.assign({}, payload.mediaPlans[i], {
        baseStatus: null,
        objective: null,
        goal: null,
        advertiserInfo: null,
        amProfile: null, 
        commonMbus: null, 
        lines: null, 
        reports: null, 
        productAllocations: null, 
        targetAudiencePrefs: null, 
        mediaPlanGroup: null
      });
      mediaPlan.commonMbus = payload.mediaPlans[i].commonMbus.map(m => m.commonMbuId);
      mediaPlan.lines = payload.mediaPlans[i].lines.map(l => l.mbuHdrId);
      mediaPlan.reports = payload.mediaPlans[i].reports.map(r => r.reportRunId);
      mediaPlan.productAllocations = payload.mediaPlans[i].productAllocations.map(p => p.productAllocationId);
      mediaPlan.targetAudiencePrefs = payload.mediaPlans[i].targetAudiencePrefs.map(t => t.targetAudiencePrefId);
      mediaPlans.push(mediaPlan);
    }
    return mediaPlans;
  }

  private normalizeCommonMbus(payload: MediaPlanGroupPayload) : MediaPlanCommonMbu[] {
    const commonMbus: Array<MediaPlanCommonMbu> = [];
    for (let i = 0; i < payload.mediaPlans.length; i++) {
      for (let j = 0; j < payload.mediaPlans[i].commonMbus.length; j++) {
        const commonMbu: MediaPlanCommonMbu = Object.assign({}, payload.mediaPlans[i].commonMbus[j], {
          advertiserInfo: null,
          mediaPlan: null,
          mpCommonVersion: null,
          mediaPlanLine: null,
          setTreeProperty: null,
          removeTreeProperty: null,
          convertToModel: null,
          baseStatus: null
        });
        commonMbus.push(commonMbu);
      }
    }
    return commonMbus;
  }

  private normalizeLines(payload: MediaPlanGroupPayload) : MediaPlanLine[] {
    const lines: Array<MediaPlanLine> = [];
    for (let i = 0; i < payload.mediaPlans.length; i++) {
      for (let j = 0; j < payload.mediaPlans[i].lines.length; j++) {
        const line: MediaPlanLine = Object.assign({}, payload.mediaPlans[i].lines[j], {
          advertiserInfo: null,
          mediaPlan: null,
          getMpCommonMbus: null,
          getMpMbuDtls: null,
          setTreeProperty: null,
          removeTreeProperty: null,
          convertToModel: null,
          baseStatus: null
        });
        lines.push(line);
      }
    }
    return lines;
  }

  private normalizeReports(payload: MediaPlanGroupPayload) : CbxReport[] {
    const reports: Array<CbxReport> = [];
    return reports;
  }

  private normalizeProductAllocations(payload: MediaPlanGroupPayload) : ProductAllocation[] {
    const productAllocations: Array<ProductAllocation> = [];
    return productAllocations;
  }

  private normalizeTargetAudiencePrefs(payload: MediaPlanGroupPayload) : TargetAudiencePref[] {
    const targetAudiencePrefs: Array<TargetAudiencePref> = [];
    return targetAudiencePrefs;
  }

  /*denormalizeProject(state: MediaPlanGroup) : MediaPlanGroupPayload {
    return denormalize(state);
  }*/
}
