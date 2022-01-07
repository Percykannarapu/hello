import { CommonSort, convertValues, isArray, isEmpty, isNil, isNotNil, isString, mapByExtended, toNullOrNumber } from '@val/common';
import { FilterService } from 'primeng/api';
import { getCpmForGeo } from '../../app/common/complex-rules';
import { WorkerResponse, WorkerStatus } from '../common/core-interfaces';
import { createCsvString, prepareRowData } from '../common/papa-export';
import {
  ActiveTypedGridColumn,
  GeoGridColumnsStats,
  GeoGridMetaData,
  GeoGridResponse,
  GeoGridRow,
  GeoGridStats,
  SubTotalTypes,
  TypedGridColumn
} from '../data-model/custom/grid';
import { WorkerAudience } from '../data-model/custom/worker-audience';
import { FieldContentTypeCodes } from '../data-model/impower.data-model.enums';
import { ImpGeofootprintGeoPayload } from '../data-model/payloads/imp-geofootprint-geo-payload';
import { ImpGeofootprintLocationPayload } from '../data-model/payloads/imp-geofootprint-location-payload';
import { ImpGeofootprintTradeAreaPayload } from '../data-model/payloads/imp-geofootprint-trade-area-payload';
import { FilterInfo, GeoGridExportRequest, GeoGridPayload, WorkerGridData, WorkerGridEvent } from './payloads';

let stateInstance: GeoGridState;

export function requestGridRows(payload: GeoGridPayload) : WorkerResponse<GeoGridResponse> {
  if (isNil(stateInstance)) stateInstance = new GeoGridState();
  return stateInstance.getRows(payload);
}

export function requestGridExport(payload: GeoGridExportRequest) : WorkerResponse<string> {
  if (isNil(stateInstance)) {
    return {
      status: WorkerStatus.Error,
      value: null,
      rowsProcessed: 0,
      message: 'A grid export cannot be executed prior to building an initial grid'
    };
  }
  return stateInstance.getExport(payload);
}

export class GeoGridState {

  private primeFilterService = new FilterService();

  private currentDataState: WorkerGridData = {};
  private currentTableState: WorkerGridEvent = {};

  private locations = new Map<number, ImpGeofootprintLocationPayload>();
  private tradeAreas = new Map<number, ImpGeofootprintTradeAreaPayload>();
  private mustCovers = new Set<string>();
  private audiences = new Map<string, WorkerAudience>();
  private geoGroups = new Map<string, GeoGridRow[]>();
  private geoSites = new Map<string, Set<string>>();

  private allGeoRows: GeoGridRow[];
  private additionalAudienceColumns: ActiveTypedGridColumn<GeoGridRow>[];
  private stats: GeoGridStats;
  private multiSelectOptions: Record<string, Set<string>>;
  private metaData: GeoGridMetaData;

  constructor() {
    this.allGeoRows = [];
    this.additionalAudienceColumns = [];
    this.multiSelectOptions = {};
    this.stats = {
      currentGeoCount: 0,
      currentActiveGeoCount: 0,
      geoCount: 0,
      activeGeoCount: 0,
      locationCount: 0,
      activeLocationCount: 0,
      columnStats: {}
    };
    this.metaData = {
      allHomeGeocodes: [],
      allMustCoverGeocodes: [],
      allFilteredGeocodes: []
    };
  }

  public getRows(request: GeoGridPayload) : WorkerResponse<GeoGridResponse> {
    const data = this.produceOutput(request);
    return {
      status: WorkerStatus.Running,
      value: data,
      rowsProcessed: this.stats.geoCount,
      message: ''
    };
  }

  public getExport(request: GeoGridExportRequest) : WorkerResponse<string> {
    const rawData = request.respectFilters ? this.applyTableFilters() : this.allGeoRows;
    const finalData = request.activeOnly ? rawData.filter(d => d.isActive) : rawData;
    if ((this.currentTableState.multiSortMeta ?? []).length > 0) {
      this.tableSort(this.currentTableState.multiSortMeta, finalData);
    }
    const columns = (this.currentDataState.primaryColumnDefs ?? []).concat(this.additionalAudienceColumns ?? []).filter(c => isNotNil(c.header) && c.isActive);
    const exportData = prepareRowData(finalData, columns, 'audienceData');
    const csvString = createCsvString(exportData, columns.map(c => c.field));
    const blob = new Blob(['\ufeff', csvString]);
    return {
      status: WorkerStatus.Complete,
      value: URL.createObjectURL(blob),
      rowsProcessed: finalData.length,
      message: 'Export complete'
    };
  }

  private produceOutput(request: GeoGridPayload) : GeoGridResponse {
    if (isNotNil(request?.gridData)) {
      this.updateCoreData(request.gridData);
      this.generateFullGeoGrid();
    }
    if (isNotNil(request?.gridEvent)) {
      this.currentTableState = {
        ...this.currentTableState,
        ...request.gridEvent
      };
    }
    const filteredData = this.applyTableFilters();
    this.calculateStats(filteredData);
    if ((this.currentTableState.multiSortMeta ?? []).length > 0) {
      this.tableSort(this.currentTableState.multiSortMeta, filteredData);
    }
    const first = this.currentTableState.first ?? 0;
    const rows = this.currentTableState.rows ?? filteredData.length;
    return {
      rows: filteredData.slice(first, first + rows),
      stats: this.stats,
      additionalAudienceColumns: this.additionalAudienceColumns,
      multiSelectOptions: convertValues(this.multiSelectOptions, s => {
        const x = Array.from(s);
        x.sort();
        return x;
      }),
      metadata: this.metaData
    };
  }

  private updateCoreData(gridData: WorkerGridData) : void {
    this.currentDataState.project = gridData.project ?? this.currentDataState.project;
    this.currentDataState.locations = gridData.locations ?? this.currentDataState.locations;
    this.currentDataState.tradeAreas = gridData.tradeAreas ?? this.currentDataState.tradeAreas;
    this.currentDataState.geos = gridData.geos ?? this.currentDataState.geos;
    this.currentDataState.gridAudiences = gridData.gridAudiences ?? this.currentDataState.gridAudiences;
    this.currentDataState.mustCovers = gridData.mustCovers ?? this.currentDataState.mustCovers;
    this.currentDataState.geoAttributes = gridData.geoAttributes ?? this.currentDataState.geoAttributes;
    this.currentDataState.geoVars = gridData.geoVars ?? this.currentDataState.geoVars;
    this.currentDataState.primaryColumnDefs = gridData.primaryColumnDefs ?? this.currentDataState.primaryColumnDefs;

    this.locations = mapByExtended(this.currentDataState.locations, l => l.glId);
    this.tradeAreas = mapByExtended(this.currentDataState.tradeAreas, l => l.gtaId);
    this.mustCovers = new Set<string>(this.currentDataState.mustCovers);
    this.audiences = mapByExtended(this.currentDataState.gridAudiences, a => a.audienceIdentifier);
  }

  private generateFullGeoGrid() : void {
    this.multiSelectOptions = {};
    this.geoGroups = new Map<string, GeoGridRow[]>();
    this.geoSites = new Map<string, Set<string>>();

    this.additionalAudienceColumns = (this.currentDataState.gridAudiences ?? []).map(audience => {
      // If more than one variable has this audience name, add the source name to the header
      const dupeNameCount = this.currentDataState.gridAudiences.filter(aud => aud.audienceName === audience.audienceName).length;
      const audienceHeader = (dupeNameCount > 1 && audience.audienceSourceType !== 'Composite') ? `${audience.audienceName} (${audience.audienceSourceName})` : audience.audienceName;
      return {
        field: audience.audienceIdentifier,
        header: audienceHeader,
        width: '4rem',
        isDynamic: true,
        isActive: true,
        digitsInfo: ['PERCENT', 'RATIO'].includes(audience.fieldconte) ? '1.2-2' : '1.0-0',
        filterType: (['COUNT', 'MEDIAN', 'INDEX', 'PERCENT', 'RATIO'].includes(audience.fieldconte)) ? 'numeric' : null,
        sortType: (['COUNT', 'MEDIAN', 'INDEX', 'PERCENT', 'RATIO'].includes(audience.fieldconte)) ? 'number' : null,
        subTotalType: audience.fieldconte === FieldContentTypeCodes.Count
                      ? SubTotalTypes.Total
                      : (['MEDIAN', 'INDEX', 'PERCENT'].includes(audience.fieldconte))
                        ? SubTotalTypes.AverageOnly
                        : SubTotalTypes.None
      };
    });

    const activeLocationIds = new Set((this.currentDataState.locations ?? []).filter(l => l.isActive).map(l => l.glId));
    const usableGeos = (this.currentDataState.geos ?? []).filter(g => activeLocationIds.has(g.glId));
    this.stats = {
      currentGeoCount: 0,
      geoCount: usableGeos.length,
      currentActiveGeoCount: 0,
      activeGeoCount: 0,
      locationCount: (this.currentDataState.locations ?? []).length,
      activeLocationCount: (this.currentDataState.locations ?? []).filter(l => l.isActive).length,
      columnStats: {}
    };
    this.metaData = {
      allHomeGeocodes: [],
      allMustCoverGeocodes: [],
      allFilteredGeocodes: []
    };
    this.allGeoRows = usableGeos.reduce((allRows, geo) => {
      if (this.tradeAreas.get(geo.gtaId)?.isActive) {
        if (geo.isActive) this.stats.activeGeoCount++;
        const currentGridRow = this.createRow(geo);
        if (currentGridRow.isHomeGeo) this.metaData.allHomeGeocodes.push(currentGridRow.geocode);
        if (currentGridRow.isMustCover) this.metaData.allMustCoverGeocodes.push(currentGridRow.geocode);
        allRows.push(currentGridRow);
      }
      return allRows;
    }, []);
  }

  private createRow(currentGeo: ImpGeofootprintGeoPayload) : GeoGridRow {
    const currentLocation = this.locations.get(currentGeo.glId);
    const currentAttribute = this.currentDataState.geoAttributes?.[currentGeo.geocode] ?? {};
    const currentVar = this.currentDataState.geoVars?.[currentGeo.geocode] ?? {};
    const cityAttr = `${currentAttribute['city_name'] ?? ''}`;
    let cityName = '';
    if (!isEmpty(cityAttr)) {
      cityName = cityAttr.substring(0, 1).toUpperCase() + cityAttr.substring(1, cityAttr.length - 3).toLowerCase() + ' ' + cityAttr.substring(cityAttr.length - 2);
    }
    const cpm = getCpmForGeo(currentAttribute, this.currentDataState.project);
    const isAllocated = currentGeo.isDeduped === 1;
    const audienceData = this.additionalAudienceColumns.reduce((acc, curr) => {
      const pk = curr.field;
      if (this.audiences.has(pk)) {
        const audienceInstance = this.audiences.get(pk);
        acc[pk] = audienceInstance.fieldconte === FieldContentTypeCodes.Char ? `${currentVar[pk]}` : toNullOrNumber(currentVar[pk]);
      }
      return acc;
    }, {});
    let geocodeTooltip: string;
    if (isEmpty(currentGeo['filterReasons'])) {
      geocodeTooltip = currentGeo.isActive ? null : 'Filtered manually';
    } else {
      geocodeTooltip = currentGeo.isActive ? '*** Manual Override ***\n' + currentGeo['filterReasons'] : currentGeo['filterReasons'];
    }
    const result: GeoGridRow = {
      ggId: currentGeo.ggId,
      siteCount: 1,
      isActive: currentGeo.isActive,
      locationNumber: currentLocation?.locationNumber,
      locationName: currentLocation?.locationName,
      locationMarket: currentLocation?.marketName,
      locationAddress: currentLocation?.locAddress,
      locationCity: currentLocation?.locCity,
      locationState: currentLocation?.locState,
      locationZip: currentLocation?.locZip?.substring(0, 5),
      isHomeGeo: currentGeo.geocode === currentLocation?.homeGeocode,
      isMustCover: this.mustCovers.has(currentGeo.geocode),
      distance: currentGeo.distance,
      geocode: currentGeo.geocode,
      geocodeTooltip,
      geoName: cityName,
      hhc: currentGeo.hhc,
      hhcAllocated: isAllocated ? currentGeo.hhc : 0,
      cpm: cpm,
      investment: (cpm / 1000) * currentGeo.hhc,
      investmentAllocated: isAllocated ? (cpm / 1000) * currentGeo.hhc : 0,
      ownerGroup: `${currentAttribute['owner_group_primary'] ?? ''}`,
      coverageDescription: `${currentAttribute['cov_desc'] ?? ''}`,
      isPOB: currentAttribute['pob'] === 'B',
      dma: `${currentAttribute['dma_name'] ?? ''}`,
      isInDeduped: isAllocated,
      ownerSite: currentGeo.ownerSite,
      audienceData: audienceData
    };
    const allColumns = (this.currentDataState.primaryColumnDefs ?? []).concat(this.additionalAudienceColumns ?? []);
    allColumns.forEach(c => {
      const fieldValue = result[c.field];
      if (c.filterType === 'multi' && !isEmpty(fieldValue) && isString(fieldValue)) {
        if (isNil(this.multiSelectOptions[c.field])) this.multiSelectOptions[c.field] = new Set<string>();
        this.multiSelectOptions[c.field].add(fieldValue);
      }
    });
    this.geoSites.set(currentGeo.geocode, (this.geoSites.get(currentGeo.geocode) ?? new Set<string>()).add(currentLocation?.locationNumber));
    this.geoGroups.set(currentGeo.geocode, (this.geoGroups.get(currentGeo.geocode) ?? []).concat(result));
    this.geoGroups.get(currentGeo.geocode).forEach(gr => gr.siteCount = this.geoSites.get(currentGeo.geocode).size);
    return result;
  }

  private calculateStats(filteredData: GeoGridRow[]) : void {
    const allColumns = (this.currentDataState.primaryColumnDefs ?? []).concat(this.additionalAudienceColumns ?? []);
    this.stats.currentGeoCount = 0;
    this.stats.currentActiveGeoCount = 0;
    this.stats.columnStats = {};
    this.metaData = {
      ...this.metaData,
      allFilteredGeocodes: []
    };
    for (const data of filteredData) {
      this.stats.currentGeoCount++;
      this.metaData.allFilteredGeocodes.push(data.geocode);
      if (data.isActive) this.stats.currentActiveGeoCount++;
      const isAllocated = data.isInDeduped;
      allColumns.forEach(column => {
        if (data.isActive && (column.subTotalType ?? SubTotalTypes.None) !== SubTotalTypes.None) {
          const fieldValue = column.isDynamic ? data.audienceData[column.field] : data[column.field];
          this.calculateColumnsStats(fieldValue, column, isAllocated);
        }
      });
    }
    allColumns.forEach(column => {
      if ((column.subTotalType ?? SubTotalTypes.None) !== SubTotalTypes.None) {
        const currentStats: GeoGridColumnsStats = this.stats.columnStats[column.field];
        if (isNotNil(currentStats)) {
          currentStats.Average = currentStats.Total / currentStats['Non-null Count'];
          if (column.subTotalType === SubTotalTypes.AverageOnly || column.subTotalType === SubTotalTypes.AllocatedAverageOnly) {
            currentStats.Total = undefined;
          }
        }
      }
    });
  }

  private calculateColumnsStats(fieldValue: any, column: TypedGridColumn<GeoGridRow>, isAllocated: boolean) : void {
    const numericValue = toNullOrNumber(fieldValue);
    const currentStats: GeoGridColumnsStats = this.stats.columnStats[column.field] ?? {
      digitsInfo: column.isCurrency ? null : column.digitsInfo,
      Total           : 0,
      Average         : 0,
      Count           : 0,
      'Non-null Count': 0,
      Max             : Number.NEGATIVE_INFINITY,
      Min             : Number.POSITIVE_INFINITY
    };
    currentStats.Count++;
    if (isNotNil(numericValue)) {
      switch (column.subTotalType) {
        case SubTotalTypes.Total:
        case SubTotalTypes.AverageOnly:
          currentStats.Max = Math.max(numericValue, currentStats.Max);
          currentStats.Min = Math.min(numericValue, currentStats.Min);
          currentStats.Total += numericValue;
          currentStats['Non-null Count']++;
          break;
        case SubTotalTypes.AllocatedTotal:
        case SubTotalTypes.AllocatedAverageOnly:
          if (isAllocated) {
            currentStats.Max = Math.max(numericValue, currentStats.Max);
            currentStats.Min = Math.min(numericValue, currentStats.Min);
            currentStats.Total += numericValue;
            currentStats['Non-null Count']++;
          }
          break;
      }
    }
    this.stats.columnStats[column.field] = currentStats;
  }

  private applyTableFilters() : GeoGridRow[] {
    const columnFilterKeys = Object.keys(this.currentTableState.filters ?? {});
    if (isEmpty(columnFilterKeys) && isEmpty(this.currentTableState.globalFilter)) return this.allGeoRows;

    const globalFieldNames = (this.currentDataState.primaryColumnDefs ?? []).filter(c => c.searchable).map(c => c.field);
    const rowFilters: [string, FilterInfo | FilterInfo[]][] = Object.entries(this.currentTableState.filters)
                                  .filter(([field, filter]) => field !== 'global' && ((isArray(filter) && isNotNil(filter[0].value)) || (!isArray(filter) && isNotNil(filter.value))));
    return this.allGeoRows.filter(row => {
      return this.rowPassesGlobalFilter(row, globalFieldNames, this.currentTableState.globalFilter)
          && this.rowPassesColumnFilters(row, rowFilters);
    });
  }

  private rowPassesGlobalFilter(row: GeoGridRow, globalFields: string[], searchValue: any) : boolean {
    if (isEmpty(searchValue)) return true;
    return globalFields.some(f => `${row[f]}`.toLowerCase().includes(`${searchValue}`.toLowerCase()));
  }

  private rowPassesColumnFilters(row: GeoGridRow, columnFilters: [string, FilterInfo | FilterInfo[]][]) : boolean {
    if (isEmpty(columnFilters)) return true;
    return columnFilters.every(([k, f]) => {
      const fieldValue = row[k] ?? row.audienceData[k];
      return (isArray(f) && f.every(n => this.primeFilterService.filters[n.matchMode](fieldValue, n.value)))
          || (!isArray(f) && this.primeFilterService.filters[f.matchMode](fieldValue, f.value));
    });
  }

  private tableSort(sortInfo: { field: string; order: number; }[], data: GeoGridRow[]) : void {
    let sortFn: (a: any, b: any) => number = () => 0;
    sortInfo.forEach(meta => {
      sortFn = this.addSortCallback(sortFn, meta.field, meta.order);
    });
    data.sort(sortFn);
  }

  private addSortCallback(currentCallback: (a: any, b: any) => number, fieldName: string, order: number) : (a: any, b: any) => number {
    const sortType = (this.currentDataState.primaryColumnDefs ?? []).concat(this.additionalAudienceColumns ?? []).filter(c => c.field === fieldName)?.[0]?.sortType;
    let result: (a: any, b: any) => number;
    switch (sortType) {
      case 'locNum':
        result = (a, b) => currentCallback(a, b) || (CommonSort.FieldNameAsStringParsedToNumber(fieldName, a, b) * order);
        break;
      case 'number':
        result = (a, b) => currentCallback(a, b) || (CommonSort.FieldNameAsNumber(fieldName, a, b) * order);
        break;
      default:
        result = (a, b) => currentCallback(a, b) || (CommonSort.FieldNameAsString(fieldName, a, b) * order);
        break;
    }
    return result;
  }
}
