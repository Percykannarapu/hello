import { createSelector } from '@ngrx/store';
import { mapByExtended } from '@val/common';
import { RfpUiEdit } from '../../../val-modules/mediaexpress/models/RfpUiEdit';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { RfpUiEditWrap } from '../../../val-modules/mediaexpress/models/RfpUiEditWrap';
import { localSelectors } from '../app.selectors';
import { SharedState } from '../shared/shared.reducers';

export interface GridRowBase {
  id: number;
  selectionIdentifier: string;
  siteName: string;
  distributionQuantity: number;
  ownerGroup: string;
  investment: number;
  isSelected: boolean;
}

export interface GridRow extends GridRowBase {
  geocode: string;
  distance: number;
  var1Value?: string | number;
  var2Value?: string | number;
  var3Value?: string | number;
}

export interface GridWrapRow extends GridRowBase {
  wrapZone: string;
}

export interface GridColumn {
  field: string;
  header: string;
}

const gridRowProjector = (shared: SharedState, detailEntities: RfpUiEditDetail[], wrapEntities: RfpUiEditWrap[], editEntities: RfpUiEdit[]) : GridRowBase[] => {
  if (shared.isWrap) {
    return wrapEntities.map(w => ({
      id: Number(w['@ref']),
      selectionIdentifier: w.wrapZone,
      wrapZone: w.wrapZone,
      distributionQuantity: Number(w.distribution),
      investment: Number(w.investment),
      ownerGroup: w.ownerGroup,
      siteName: w.siteName,
      isSelected: w.isSelected
    } as GridWrapRow));
  } else {
    const siteNamesByFk = mapByExtended(editEntities, e => e.siteId, e => e.siteName);
    return detailEntities.map(d => ({
      id: Number(d['@ref']),
      selectionIdentifier: d.geocode,
      geocode: d.geocode,
      distributionQuantity: Number(d.distribution),
      distance: Number(d.distance),
      investment: Number(d.investment),
      ownerGroup: d.ownerGroup,
      siteName: siteNamesByFk.get(d.fkSite),
      isSelected: d.isSelected,
      var1Value: d.var1IsNumber === 1 ? Number(d.var1Value) : d.var1Value,
      var2Value: d.var2IsNumber === 1 ? Number(d.var2Value) : d.var2Value,
      var3Value: d.var3IsNumber === 1 ? Number(d.var3Value) : d.var3Value
    } as GridRow));
  }
};

const smallGridColumnProjector = (shared: SharedState) : GridColumn[] => {
  if (shared.isWrap) {
    return [
      { field: 'wrapZone', header: 'Wrap Zone' },
      { field: 'distributionQuantity', header: 'Distr Qty' },
      { field: 'investment', header: 'Investment' }
    ];
  } else {
    return [
      { field: 'geocode', header: 'Geocode' },
      { field: 'distributionQuantity', header: 'Distr Qty' },
      { field: 'investment', header: 'Investment' }
    ];
  }
};

const largeGridColumnProjector = (shared: SharedState, detailEntities: RfpUiEditDetail[]) : GridColumn[] => {
  if (detailEntities.length === 0) return [];
  if (shared.isWrap) {
    return [
      { field: 'siteName', header: 'Site Name' },
      { field: 'wrapZone', header: 'Wrap Zone' },
      { field: 'distributionQuantity', header: 'Distr Qty' },
      { field: 'ownerGroup', header: 'Owner' },
      { field: 'investment', header: 'Investment' }
    ];
  } else {
    const arbitraryDetail = detailEntities[0];
    const result = [
      { field: 'siteName', header: 'Site Name' },
      { field: 'geocode', header: 'Geocode' },
      { field: 'distance', header: 'Distance' },
      { field: 'distributionQuantity', header: 'Distr Qty' },
      { field: 'ownerGroup', header: 'Owner' },
      { field: 'investment', header: 'Investment' }
    ];
    if (arbitraryDetail.var1Name != null) {
      result.push({ field: 'var1Value', header: arbitraryDetail.var1Name });
    }
    if (arbitraryDetail.var2Name != null) {
      result.push({ field: 'var2Value', header: arbitraryDetail.var2Name });
    }
    if (arbitraryDetail.var3Name != null) {
      result.push({ field: 'var3Value', header: arbitraryDetail.var3Name });
    }
    return result;
  }
};

export const getSmallGridColumns = createSelector(localSelectors.getSharedState, smallGridColumnProjector);
export const getLargeGridColumns = createSelector(localSelectors.getSharedState, localSelectors.getRfpUiEditDetailEntities, largeGridColumnProjector);
export const getGridRows = createSelector(localSelectors.getSharedState,
                                          localSelectors.getRfpUiEditDetailEntities,
                                          localSelectors.getRfpUiEditWrapEntities,
                                          localSelectors.getRfpUiEditEntities,
                                          gridRowProjector);
