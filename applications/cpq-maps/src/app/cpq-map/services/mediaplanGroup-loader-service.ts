import { Injectable } from '@angular/core';
import { MediaPlanGroupPayload } from '../state/payload-models/MediaPlanGroup';
import { EMPTY, Observable } from 'rxjs';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { map } from 'rxjs/operators';
import { MediaPlanGroup } from '../../val-modules/mediaexpress/models/MediaPlanGroup';
import { MediaPlan } from '../../val-modules/mediaexpress/models/MediaPlan';
import { AdvertiserInfo } from '../../val-modules/mediaexpress/models/AdvertiserInfo';
import { MediaPlanCommonMbu } from '../../val-modules/mediaexpress/models/MediaPlanCommonMbu';
import { MediaPlanLine } from '../../val-modules/mediaexpress/models/MediaPlanLine';
import { CbxReport } from '../../val-modules/mediaexpress/models/CbxReport';
import { ProductAllocation } from '../../val-modules/mediaexpress/models/ProductAllocation';
import { TargetAudiencePref } from '../../val-modules/mediaexpress/models/TargetAudiencePref';
import { NormalizedPayload } from '../models/NormalizedPayload';


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

  normalize(payload: MediaPlanGroupPayload) : NormalizedPayload {
    if (payload == null) throw new Error('Cannot normalize a null or undefined payload');
    const mediaPlanGroup: MediaPlanGroup = Object.assign({}, payload, {advertiserInfos: null, mediaPlans: null, baseStatus: null});
    mediaPlanGroup.mediaPlans = payload.mediaPlans.map(m => m.mediaPlanId);
    return {
      mediaPlanGroup: mediaPlanGroup,
      mediaPlans: this.normalizeMediaPlans(payload),
      commonMbus: this.normalizeCommonMbus(payload),
      lines: this.normalizeLines(payload),
      productAllocations: this.normalizeProductAllocations(payload),
      targetAudiencePrefs: this.normalizeTargetAudiencePrefs(payload),
      advertiserInfos: this.normalizeAdvertiserInfos(payload),
      reports: this.normalizeReports(payload)
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
    for (let i = 0; i < payload.mediaPlans.length; i++) {
      for (let j = 0; j < payload.mediaPlans[i].reports.length; j++) {
        const report: CbxReport = Object.assign({}, payload.mediaPlans[i].reports[j], {
          advertiserInfo: null,
          mediaPlan: null,
          cbxReportType: null,
          cbxReportParams: null,
          baseStatus: null
        });
        reports.push(report);
      }
    }
    return reports;
  }

  private normalizeProductAllocations(payload: MediaPlanGroupPayload) : ProductAllocation[] {
    const productAllocations: Array<ProductAllocation> = [];
    for (let i = 0; i < payload.mediaPlans.length; i++) {
      for (let j = 0; j < payload.mediaPlans[i].productAllocations.length; j++) {
        const productAllocation: ProductAllocation = Object.assign({}, payload.mediaPlans[i].productAllocations[j], {
          advertiserInfo: null,
          ppToWrapPages: null,
          baseStatus: null
        });
        if (payload.mediaPlans[i].productAllocations[j].ppToWrapPages != null) {
          productAllocation.ppToWrapPages = payload.mediaPlans[i].productAllocations[j].ppToWrapPages.map(pp => pp.pptwpId);
        }
        productAllocations.push(productAllocation);
      }
    }
    return productAllocations;
  }

  private normalizeTargetAudiencePrefs(payload: MediaPlanGroupPayload) : TargetAudiencePref[] {
    const targetAudiencePrefs: Array<TargetAudiencePref> = [];
    for (let i = 0; i < payload.mediaPlans.length; i++) {
      for (let j = 0; j < payload.mediaPlans[i].targetAudiencePrefs.length; j++) {
        const targetAudiencePref: TargetAudiencePref = Object.assign({}, payload.mediaPlans[i].targetAudiencePrefs[j], {
          advertiserInfo: null,
          setTreeProperty: null,
          removeTreeProperty: null,
          convertToModel: null,
          baseStatus: null
        });
        targetAudiencePrefs.push(targetAudiencePref);
      }
    }
    return targetAudiencePrefs;
  }

  private normalizeAdvertiserInfos(payload: MediaPlanGroupPayload) : AdvertiserInfo[] {
    const advertiserInfos: Array<AdvertiserInfo> = [];
    for (const mediaPlan of payload.mediaPlans) {
      const advertiserInfo: AdvertiserInfo = Object.assign({}, mediaPlan.advertiserInfo, {
        goal: null,
        mediaPlanGroup: null,
        objective: null,
        getMediaPlans: null,
        getMediaPlanCommonMbus: null,
        getMediaPlanLines: null,
        getCbxReports: null,
        getProductAllocations: null,
        getTargetAudiencePrefs: null,
        setTreeProperty: null,
        removeTreeProperty: null,
        convertToModel: null,
        amProfile: null,
        baseStatus: null
      });
      advertiserInfos.push(advertiserInfo);
    }
    return advertiserInfos;
  }

  /*denormalizeProject(state: MediaPlanGroup) : MediaPlanGroupPayload {
    return denormalize(state);
  }*/
}
