import { isEmpty, isNil, toNullOrNumber } from '@val/common';
import { WorkerAudience } from '../data-model/custom/worker-audience';
import { FieldContentTypeCodes } from '../data-model/impower.data-model.enums';
import { ImpGeofootprintGeoPayload } from '../data-model/payloads/imp-geofootprint-geo-payload';
import { ImpGeofootprintLocationPayload } from '../data-model/payloads/imp-geofootprint-location-payload';
import { ImpGeofootprintTradeAreaPayload } from '../data-model/payloads/imp-geofootprint-trade-area-payload';
import { GeoFootprintExportFormats, GeoFootprintExportWorkerPayload, WorkerProcessReturnType } from './payloads';
import { ColumnDefinition, ExportState, prepareData } from './export-helpers';

export const exportGeoFootprint = (payload: GeoFootprintExportWorkerPayload) => {
  const state = new GeoFootprintExportState(payload);
  return prepareData(state, WorkerProcessReturnType.BlobUrl, true);
};

class GeoFootprintExportState implements ExportState<ImpGeofootprintGeoPayload> {

  private filteredRows: ImpGeofootprintGeoPayload[] = null;
  public hasMarketIdentifiers = false;
  public locations: { [glId: number] : ImpGeofootprintLocationPayload };
  public tradeAreas: { [gtaId: number] : ImpGeofootprintTradeAreaPayload };
  public mustCovers: Set<string>;
  public audienceData: {
    [id: string] : {
      geocode: string;
      [name: string] : string | number;
    }
  };

  constructor(private data: GeoFootprintExportWorkerPayload) {
  }

  public getRows() : ImpGeofootprintGeoPayload[] {
    this.preProcessRows();
    return this.filteredRows;
  }

  private preProcessRows() : void {
    if (this.filteredRows == null) {
      this.audienceData = this.data.audienceData;
      this.locations = this.data.locations.reduce((p, c) => {
        this.hasMarketIdentifiers = this.hasMarketIdentifiers || !isEmpty(c?.marketName) || !isEmpty(c?.marketCode);
        p[c.glId] = c;
        return p;
      }, {});
      this.tradeAreas = this.data.tradeAreas.reduce((p, t) => {
        p[t.gtaId] = t;
        return p;
      }, {});
      console.log(this.locations);
      this.mustCovers = new Set<string>(this.data.mustCovers);
      this.filteredRows = this.data.rows.reduce((p, g) => {
        const passesFilter = !this.data.activeOnly || g.isActive;
        if (passesFilter) p.push(g);
        return p;
      }, [] as ImpGeofootprintGeoPayload[]);
    }
  }

  public getColumns() : ColumnDefinition<ImpGeofootprintGeoPayload, ExportState<ImpGeofootprintGeoPayload>>[] {
    const result = this.getDefaultColumns(this.data.format);
    if (!isEmpty(this.data.exportedAudiences)) {
      let insertAtPos = 17;
      const audiences = this.data.exportedAudiences.sort((a, b) => a.sortOrder - b.sortOrder);
      audiences.forEach(exportAudience => {
        // If more than one variable has this audience name, add the source name to the header
        const dupeNameCount = this.data.allAudiences.filter(aud => aud.audienceName === exportAudience.audienceName).length;
        const header = (dupeNameCount > 1 && exportAudience.audienceSourceType !== 'Composite')
          ? exportAudience.audienceName + ' (' + exportAudience.audienceSourceName + ')'
          : exportAudience.audienceName;
        const row = (state: GeoFootprintExportState, geo: ImpGeofootprintGeoPayload) => this.exportVarAttributes(state, geo, exportAudience);
        result.splice(insertAtPos++, 0, { header, row });
      });
    }
    return result;
  }

  private getDefaultColumns(exportFormat: GeoFootprintExportFormats) : ColumnDefinition<ImpGeofootprintGeoPayload, GeoFootprintExportState>[] {
    const exportColumns: ColumnDefinition<ImpGeofootprintGeoPayload, GeoFootprintExportState>[] = [];

    switch (exportFormat) {
      case GeoFootprintExportFormats.alteryx:
        exportColumns.push({header: this.getGeoHeader(), row: (state, geo) => geo.geocode});
        exportColumns.push({header: 'Site Name', row: (state, geo) => state.locations[geo.glId]?.locationName});
        exportColumns.push({header: 'Site Description', row: (state, geo) => state.locations[geo.glId]?.description});
        exportColumns.push({header: 'Site Street', row: (state, geo) => state.locations[geo.glId]?.locAddress});
        exportColumns.push({header: 'Site City', row: (state, geo) => state.locations[geo.glId]?.locCity});
        exportColumns.push({header: 'Site State', row: (state, geo) => state.locations[geo.glId]?.locState});
        exportColumns.push({header: 'Zip', row: (state, geo) => state.getLocationZip5(state, geo) });
        exportColumns.push({header: 'Site Address', row: (state, geo) => state.getLocationAddress(state, geo)});
        exportColumns.push({
          header: 'Market',
          row: (state, geo) => (state.hasMarketIdentifiers) ? state.locations[geo.glId]?.marketName : state.getLocationAttribute(state, geo, 'Home DMA Name')
        });
        exportColumns.push({
          header: 'Market Code',
          row: (state, geo) => (state.hasMarketIdentifiers) ? state.locations[geo.glId]?.marketCode : state.getLocationAttribute(state, geo, 'Home DMA')
        });
        exportColumns.push({header: 'Group Name', row: (state, geo) => state.locations[geo.glId]?.groupName});
        exportColumns.push({header: 'Passes Filter', row: 1});
        exportColumns.push({header: 'Distance', row: (state, geo) => +geo.distance.toFixed(2)});
        exportColumns.push({header: 'Is User Home Geocode', row: (state, geo) => state.getIsHomeGeocode(state, geo)});
        exportColumns.push({header: 'Is Final Home Geocode', row: (state, geo) => state.getIsHomeGeocode(state, geo)});
        exportColumns.push({header: 'Is Must Cover', row: (state, geo) => state.exportMustCoverFlag(state, geo)});
        exportColumns.push({header: 'Owner Trade Area', row: (state, geo) => state.getOwnerTradeArea(state, geo)});
        exportColumns.push({header: 'Owner Site', row: (state, geo) => state.locations[geo.glId]?.locationNumber});
        exportColumns.push({header: 'Include in Deduped Footprint', row: (state, geo) => geo.isDeduped}); // 1});
        exportColumns.push({header: 'Base Count', row: null});
        exportColumns.push({header: 'Is Selected?', row: (state, geo) => geo.isActive === true ? 1 : 0});

        break;

      // No format specified, derive from the object - IMPLEMENT (Will eventually have an export from NgRx)
      default:
        exportColumns.push({header: this.getGeoHeader(), row: (state, geo) => geo.geocode});
        exportColumns.push({header: 'Site Name', row: (state, geo) => state.locations[geo.glId]?.locationName});
        exportColumns.push({header: 'Site Description', row: (state, geo) => state.locations[geo.glId]?.description});
        exportColumns.push({header: 'Site Street', row: (state, geo) => state.locations[geo.glId]?.locAddress});
        exportColumns.push({header: 'Site City', row: (state, geo) => state.locations[geo.glId]?.locCity});
        exportColumns.push({header: 'Site State', row: (state, geo) => state.locations[geo.glId]?.locState});
        exportColumns.push({header: 'Zip', row: (state, geo) => state.getLocationZip5(state, geo)});
        exportColumns.push({header: 'Base Count', row: null});
        exportColumns.push({header: 'Is Selected?', row: (state, geo) => geo.isActive});
        break;
    }
    return exportColumns;
  }

  public getGeoHeader() {
    const analysisLevel = this.data.analysisLevel?.toUpperCase() ?? 'ATZ';
    switch (analysisLevel) {
      case 'ATZ':
        return 'VALATZ';
      case 'ZIP':
        return 'VALZI';
      case 'PCR':
        return 'VALCR';
      case 'DIGITAL ATZ':
        return 'VALDIG';
      default:
        throw new Error('Unknown analysis level: ' + this.data.analysisLevel);
    }
  }

  public exportMustCoverFlag(state: GeoFootprintExportState, geo: ImpGeofootprintGeoPayload) {
    return (state.mustCovers != null && state.mustCovers.has(geo.geocode)) ? '1' : '0';
  }

  public getLocationAddress(state: GeoFootprintExportState, geo: ImpGeofootprintGeoPayload) {
    const currentLoc = state.locations[geo.glId];
    const zip5 = this.getLocationZip5(state, geo);
    return `${currentLoc?.locAddress}, ${currentLoc?.locCity}, ${currentLoc?.locState} ${zip5}`;
  }

  public getLocationZip5(state: GeoFootprintExportState, geo: ImpGeofootprintGeoPayload) {
    const currentLoc = state.locations[geo.glId];
    return currentLoc?.locZip?.slice(0, 5) ?? '';
  }

  public getIsHomeGeocode(state: GeoFootprintExportState, geo: ImpGeofootprintGeoPayload) {
    const currentLoc = state.locations[geo.glId];
    return geo.geocode === currentLoc?.homeGeocode ? 1 : 0;
  }

  private getLocationAttribute(state: GeoFootprintExportState, geo: ImpGeofootprintGeoPayload, attributeCode: string) {
    const currentLoc = state.locations[geo.glId];
    const locAttribute = currentLoc.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === attributeCode);
    if (!isEmpty(locAttribute)) {
      return locAttribute[0].attributeValue;
    }
    return '';
  }

  public getOwnerTradeArea(state: GeoFootprintExportState, geo: ImpGeofootprintGeoPayload) {
    let varValue: any;
    const currentTradeArea = state.tradeAreas[geo.gtaId];
    const isHomeGeo = this.getIsHomeGeocode(state, geo);
      if (isHomeGeo === 1 && (currentTradeArea?.taType === 'RADIUS' || currentTradeArea?.taType === 'HOMEGEO')) {
        varValue = 'Trade Area 1';
      } else {
        switch (currentTradeArea?.taType) {
          case 'RADIUS':
            varValue = 'Trade Area ' + currentTradeArea?.taNumber;
            break;
          case 'HOMEGEO':
            varValue = 'Forced Home Geo';
            break;
          case 'AUDIENCE':
            varValue = 'Audience Trade Area';
            break;
          case 'MANUAL':
            varValue = 'Manual Trade Area';
            break;
          default:
            varValue = 'Custom';
        }
      }
    return varValue;
  }

  public exportVarAttributes(state: GeoFootprintExportState, geo: ImpGeofootprintGeoPayload, audience: WorkerAudience) {
    let result = '';
    const geoVar = state.audienceData[geo.geocode];
    if (!isNil(geoVar?.[audience.audienceIdentifier])) {
      switch (audience.fieldconte) {
        case FieldContentTypeCodes.Char:
        case FieldContentTypeCodes.Percent:
          result = `${geoVar[audience.audienceIdentifier]}`;
          break;
        case FieldContentTypeCodes.Ratio:
          result = toNullOrNumber(geoVar[audience.audienceIdentifier])?.toFixed(2);
          break;
        default:
          result = toNullOrNumber(geoVar[audience.audienceIdentifier])?.toFixed(0);
          break;
      }
    }
    return result;
  }
}
