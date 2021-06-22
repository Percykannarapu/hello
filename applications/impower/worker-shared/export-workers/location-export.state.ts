import { isEmpty, isNil } from '@val/common';
import { ImpClientLocationTypeCodes } from '../data-model/impower.data-model.enums';
import { ImpGeofootprintLocationPayload } from '../data-model/payloads/imp-geofootprint-location-payload';
import { ImpProjectPayload } from '../data-model/payloads/imp-project-payload';
import { LocationExportFormats, LocationExportWorkerPayload } from './payloads';
import { ColumnDefinition, ExportState, prepareData } from './export-helpers';

export const exportLocations = (payload: LocationExportWorkerPayload) => {
  const state = new LocationExportState(payload);
  return prepareData(state, payload.outputType, true);
};

class LocationExportState implements ExportState<ImpGeofootprintLocationPayload> {

  private distinctAttributeCodes = new Set<string>();
  private filteredRows: ImpGeofootprintLocationPayload[] = null;
  public currentProject: ImpProjectPayload;
  public hasMarketIdentifiers = false;

  public constructor(private data: LocationExportWorkerPayload) {
    this.currentProject = data.currentProject;
  }

  public getRows() : ImpGeofootprintLocationPayload[] {
    this.preProcessRows();
    return this.filteredRows;
  }

  private preProcessRows() : void {
    if (this.filteredRows == null) {
      this.filteredRows = this.data.rows.reduce((p, l) => {
        const passesFilter =
          (!this.data.activeOnly || l.isActive) &&
          (isNil(this.data.siteType) || ImpClientLocationTypeCodes.parseAsSuccessful(l.clientLocationTypeCode) === this.data.siteType) &&
          (this.data.format !== LocationExportFormats.homeGeoIssues || l.impGeofootprintLocAttribs.some(a => a.attributeCode === 'Home Geocode Issue' && a.attributeValue === 'Y'));
        if (passesFilter) {
          p.push(l);
          l.impGeofootprintLocAttribs.forEach(a => this.distinctAttributeCodes.add(a.attributeCode));
        }
        this.hasMarketIdentifiers = this.hasMarketIdentifiers || !isEmpty(l.marketName) || !isEmpty(l .marketCode);
        return p;
      }, [] as ImpGeofootprintLocationPayload[]);
    }
  }

  public getColumns() : ColumnDefinition<ImpGeofootprintLocationPayload, LocationExportState>[] {
    const result = this.getDefaultColumns();
    if (this.data.includeAllAttributes) {
      const attributeCodeBlackList = new Set<string>(result.map(r => r.header));
      this.preProcessRows();
      this.distinctAttributeCodes.forEach(code => {
        if (code != null && !attributeCodeBlackList.has(code)) {
          result.push({ header: code, row: (state, data) => state.exportAttribute(data, code)});
        }
      });
    }
    return result;
  }

  private getDefaultColumns() : ColumnDefinition<ImpGeofootprintLocationPayload, LocationExportState>[] {
    const exportColumns: ColumnDefinition<ImpGeofootprintLocationPayload, LocationExportState>[] = [];
    switch (this.data.format) {
      //   ****DO NOT CHANGE THE HEADERS AS ALTERYX DEPENDS ON THESE NAMES****
      case LocationExportFormats.alteryx:
        exportColumns.push({
          header: 'GROUP',
          row: (state, data) => (data.groupName) ? data.groupName : (data.clientLocationTypeCode === 'Site') ? 'Advertisers' : 'Competitors'
        });
        exportColumns.push({header: 'NUMBER', row: (state, data) => data.locationNumber});
        exportColumns.push({header: 'NAME', row: (state, data) => data.locationName});
        exportColumns.push({header: 'DESCRIPTION', row: (state, data) => data.description});
        exportColumns.push({header: 'STREET', row: (state, data) => data.locAddress});
        exportColumns.push({header: 'CITY', row: (state, data) => data.locCity});
        exportColumns.push({header: 'STATE', row: (state, data) => data.locState});
        exportColumns.push({header: 'ZIP', row: (state, data) => state.getGeocodeAs(data.locZip, true, false, false, false)});
        exportColumns.push({header: 'X', row: (state, data) => data.xcoord});
        exportColumns.push({header: 'Y', row: (state, data) => data.ycoord});
        exportColumns.push({header: 'ICON', row: () => null});
        exportColumns.push({header: 'RADIUS1', row: (state, data) => state.exportTradeArea(data, 0)});
        exportColumns.push({header: 'RADIUS2', row: (state, data) => state.exportTradeArea(data, 1)});
        exportColumns.push({header: 'RADIUS3', row: (state, data) => state.exportTradeArea(data, 2)});
        exportColumns.push({header: 'TRAVELTIME1', row: () => 0});
        exportColumns.push({header: 'TRAVELTIME2', row: () => 0});
        exportColumns.push({header: 'TRAVELTIME3', row: () => 0});
        exportColumns.push({header: 'TRADE_DESC1', row: (state, data) => state.exportTradeAreaDesc(data, 0)});
        exportColumns.push({header: 'TRADE_DESC2', row: (state, data) => state.exportTradeAreaDesc(data, 1)});
        exportColumns.push({header: 'TRADE_DESC3', row: (state, data) => state.exportTradeAreaDesc(data, 2)});
        exportColumns.push({header: 'Home Zip Code', row: (state, data) => state.exportHomeGeoAttribute(data, 'Zip Code')});
        exportColumns.push({header: 'Home ATZ', row: (state, data) => state.exportHomeGeoAttribute(data, 'ATZ')});
        exportColumns.push({header: 'Home BG', row: () => null});
        exportColumns.push({header: 'Home Carrier Route', row: (state, data) => state.exportHomeGeoAttribute(data, 'Carrier Route')});
        exportColumns.push({header: 'Home Geocode Issue', row: (state, data) => state.exportHomeGeoAttribute(data, 'Geocode Issue')});
        exportColumns.push({header: 'Carrier Route', row: (state, data) => data.carrierRoute});
        exportColumns.push({header: 'ATZ', row: (state, data) => state.getGeocodeAs(data.homeGeocode, false, true, false, false)});
        exportColumns.push({header: 'Block Group', row: () => null});
        exportColumns.push({header: 'Unit', row: () => null});
        exportColumns.push({header: 'ZIP4', row: (state, data) => state.getGeocodeAs(data.locZip, false, false, false, true)});
        exportColumns.push({
          header: 'Market',
          row: (state, data) => state.hasMarketIdentifiers ? data.marketName : state.exportHomeGeoAttribute(data, 'DMA Name')
        });
        exportColumns.push({
          header: 'Market Code',
          row: (state, data) => state.hasMarketIdentifiers ? data.marketCode : state.exportHomeGeoAttribute(data, 'DMA')
        });
        exportColumns.push({header: 'Map Group', row: () => null});
        exportColumns.push({header: 'STDLINXSCD', row: () => null});
        exportColumns.push({header: 'SWklyVol', row: () => null});
        exportColumns.push({header: 'STDLINXOCD', row: () => null});
        exportColumns.push({header: 'SOwnFamCd', row: () => null});
        exportColumns.push({header: 'SOwnNm', row: () => null});
        exportColumns.push({header: 'SStCd', row: () => null});
        exportColumns.push({header: 'SCntCd', row: () => null});
        exportColumns.push({header: 'FIPS', row: () => null});
        exportColumns.push({header: 'STDLINXPCD', row: () => null});
        exportColumns.push({header: 'SSUPFAMCD', row: () => null});
        exportColumns.push({header: 'SSupNm', row: () => null});
        exportColumns.push({header: 'SStatusInd', row: () => null});
        exportColumns.push({header: 'Match Type', row: () => null});
        exportColumns.push({header: 'Match Pass', row: () => null});
        exportColumns.push({header: 'Match Score', row: () => null});
        exportColumns.push({header: 'Match Code', row: (state, data) => data.geocoderMatchCode});
        exportColumns.push({header: 'Match Quality', row: (state, data) => data.geocoderLocationCode});
        exportColumns.push({header: 'Match Error', row: () => null});
        exportColumns.push({header: 'Match Error Desc', row: () => null});
        exportColumns.push({header: 'Original Address', row: (state, data) => data.origAddress1});
        exportColumns.push({header: 'Original City', row: (state, data) => data.origCity});
        exportColumns.push({header: 'Original State', row: (state, data) => data.origState});
        exportColumns.push({header: 'Original ZIP', row: (state, data) => data.origPostalCode});
        exportColumns.push({header: 'Home Digital ATZ', row: (state, data) => state.exportHomeGeoAttribute(data, 'Digital ATZ')});
        exportColumns.push({header: 'Home DMA', row: (state, data) => state.exportHomeGeoAttribute(data, 'DMA')});
        exportColumns.push({header: 'Home County', row: (state, data) => state.exportHomeGeoAttribute(data, 'County')});
        break;


      //   ****DO NOT CHANGE THE HEADERS AS VALASSIS DIGITAL DEPENDS ON THESE NAMES****
      case LocationExportFormats.digital:
        console.log('setExportFormat - digital');
        exportColumns.push({header: 'GROUP', row: (state, data) => data.groupName});
        exportColumns.push({header: 'NUMBER', row: (state, data) => data.locationNumber});
        exportColumns.push({header: 'NAME', row: (state, data) => data.locationName});
        exportColumns.push({
          header: 'DESCRIPTION',
          row: (state) => state.currentProject.clientIdentifierName && state.currentProject.projectId != null ? state.currentProject.clientIdentifierName.trim() + '' + '~' + state.currentProject.projectId : ''
        });
        exportColumns.push({header: 'STREET', row: (state, data) => data.locAddress});
        exportColumns.push({header: 'CITY', row: (state, data) => data.locCity});
        exportColumns.push({header: 'STATE', row: (state, data) => data.locState});
        exportColumns.push({header: 'ZIP', row: (state, data) => data.locZip});
        exportColumns.push({header: 'X', row: (state, data) => data.xcoord});
        exportColumns.push({header: 'Y', row: (state, data) => data.ycoord});
        exportColumns.push({header: 'Market', row: (state, data) => data.marketName});
        exportColumns.push({header: 'Market Code', row: (state, data) => data.marketCode});
        break;

      case LocationExportFormats.homeGeoIssues:
        console.log('setExportFormat - HGCIssuesLog');
        exportColumns.push({header: 'Number', row: (state, data) => data.locationNumber});
        exportColumns.push({header: 'Name', row: (state, data) => data.locationName});
        exportColumns.push({header: 'Orig. Address', row: (state, data) => data.origAddress1});
        exportColumns.push({header: 'Orig. City', row: (state, data) => data.origCity});
        exportColumns.push({header: 'Orig. State', row: (state, data) => data.origState});
        exportColumns.push({header: 'Orig. ZIP', row: (state, data) => data.origPostalCode});
        exportColumns.push({header: 'Final Address', row: (state, data) => data.locAddress});
        exportColumns.push({header: 'Final City', row: (state, data) => data.locCity});
        exportColumns.push({header: 'Final State', row: (state, data) => data.locState});
        exportColumns.push({header: 'Final ZIP', row: (state, data) => data.locZip});
        exportColumns.push({header: 'Home ZIP', row: (state, data) => state.exportHomeGeoAttribute(data, 'Zip Code')});
        exportColumns.push({header: 'Home ATZ', row: (state, data) => state.exportHomeGeoAttribute(data, 'ATZ')});
        exportColumns.push({header: 'Home DTZ', row: (state, data) => state.exportHomeGeoAttribute(data, 'Digital ATZ')});
        exportColumns.push({header: 'Home PCR', row: (state, data) => state.exportHomeGeoAttribute(data, 'Carrier Route')});
        exportColumns.push({header: 'Home County', row: (state, data) => state.exportHomeGeoAttribute(data, 'County')});
        exportColumns.push({header: 'Home DMA', row: (state, data) => state.exportHomeGeoAttribute(data, 'DMA')});
        exportColumns.push({
          header: 'ZIP or ZIP+4 Centroid',
          row: (state, data) => data.geocoderMatchCode?.toLowerCase().includes('z') || data.geocoderLocationCode?.toLowerCase().includes('z') ? 'Y' : 'N'
        });
        exportColumns.push({
          header: 'Final ZIP not equal Orig. ZIP',
          row: (state, data) => data.locZip?.substr(0, 5) === data.origPostalCode?.substr(0, 5) ? 'N' : 'Y'
        });
        exportColumns.push({
          header: 'Final ZIP not equal Home ZIP',
          row: (state, data) => data.locZip?.substr(0, 5) === state.exportHomeGeoAttribute(data, 'Zip Code') ? 'N' : 'Y'
        });
        exportColumns.push({header: 'Null Home ATZ or not in Home ZIP', row: (state, data) => state.exportHomeGeoIssueAtz(data)});
        exportColumns.push({header: 'Null Home DTZ or not in Home ZIP', row: (state, data) => state.exportHomeGeoIssueDigAtz(data)});
        exportColumns.push({header: 'Null Home PCR or not in Home ZIP', row: (state, data) => state.exportHomeGeoIssuePcr(data)});
        exportColumns.push({header: 'PCR is entire ZIP', row: (state, data) => state.exportHomeGeoIssuePcrZip(data)});

        break;
    }
    return exportColumns;
  }

  public exportTradeArea(loc: ImpGeofootprintLocationPayload, index: number) : number {
    const tradeAreas = loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS' && ta.taNumber === index + 1);
    return tradeAreas.length > 0 ? tradeAreas[0].taRadius : null;
  }

  public exportTradeAreaDesc(loc: ImpGeofootprintLocationPayload, index: number) : string {
    const tradeAreas = loc.impGeofootprintTradeAreas.filter(ta => ta.taType === 'RADIUS' && ta.taNumber === index + 1);
    return tradeAreas.length > 0 ? `RADIUS${index + 1}` : null;
  }

  public exportHomeGeoAttribute(loc: ImpGeofootprintLocationPayload, homeGeoType: string) : string {
    return this.exportAttribute(loc, `Home ${homeGeoType}`);
  }

  public exportAttribute(loc: ImpGeofootprintLocationPayload, attributeCode: string) : string {
    const attributes = loc.impGeofootprintLocAttribs.filter(att => att.attributeCode === attributeCode);

    if (attributes.length > 0) return attributes[0].attributeValue;
    return '';
  }

  public exportHomeGeoIssueAtz(loc: ImpGeofootprintLocationPayload) : string {

    const homeZipVal = this.exportHomeGeoAttribute(loc, 'Zip Code');
    const homeAtzVal = this.exportHomeGeoAttribute(loc, 'ATZ');

    if (homeZipVal != null && homeZipVal.length > 0) {
      if (homeAtzVal == null || homeAtzVal.length == 0 || (homeAtzVal.substr(0, 5) !== homeZipVal.substr(0, 5))) {

        return 'Y';
      } else return 'N';
    } else return 'Y';
  }

  public exportHomeGeoIssueDigAtz(loc: ImpGeofootprintLocationPayload) : string {

    const homeZipVal = this.exportHomeGeoAttribute(loc, 'Zip Code');
    const homeDigATZVal = this.exportHomeGeoAttribute(loc, 'Digital ATZ');

    if (homeZipVal != null && homeZipVal.length > 0) {
      if (homeDigATZVal == null || homeDigATZVal.length == 0 || (homeDigATZVal.substr(0, 5) !== homeZipVal.substr(0, 5))) {
        return 'Y';
      } else return 'N';
    } else return 'Y';
  }

  public exportHomeGeoIssuePcr(loc: ImpGeofootprintLocationPayload) : string {

    const homeZipVal = this.exportHomeGeoAttribute(loc, 'Zip Code');
    const homePcrVal = this.exportHomeGeoAttribute(loc, 'Carrier Route');

    if (homeZipVal != null && homeZipVal.length > 0) {
      if (homePcrVal == null || homePcrVal.length == 0 || (homePcrVal.substr(0, 5) !== homeZipVal.substr(0, 5))) {
        return 'Y';
      } else return 'N';
    } else return 'Y';
  }

  public exportHomeGeoIssuePcrZip(loc: ImpGeofootprintLocationPayload) : string {

    const homePcrVal = this.exportHomeGeoAttribute(loc, 'Carrier Route');

    if (homePcrVal == null || homePcrVal.length == 0 || (homePcrVal.length != null && homePcrVal.length != 5)) {
      return 'N';
    } else return 'Y';
  }

  /**
   * Takes a well formed geocode and returns a string that is a combination of its requested parts
   * @param geocode The source geocode to parse
   * @param includeZip If true, include the ZIP portion of the geocode
   * @param includeAtz If true, include the ATZ portion of the geocode
   * @param includeCarrierRt If true, include the PCR portion of the geocode
   * @param includePlus4 If true, include the PLUS4 portion of the geocode
   */
  public getGeocodeAs(geocode: string, includeZip: boolean, includeAtz: boolean, includeCarrierRt: boolean, includePlus4: boolean) {
    // Regex to take a well formed geocode and break it into ZIP, ATZ, PCR and PLUS4
    const regex = /^(\d{1,5})(?:(?=[A-Z]\d{1})(?:(?=[A-Z]\d{3})()|([A-Z]\d{1}))(?:(?=[A-Z]\d{3})([A-Z]\d{3})?|()))?(?:(?:\-)(\d{4}))?/g;
    const m = regex.exec(geocode);
    let result: string = '';

    if (m != null) {
      // Avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex)
        regex.lastIndex++;

      m.forEach((match, groupIndex) => {
//          console.log(`Found match, group ${groupIndex}: ${match}`);
        if (groupIndex === 1 && includeZip)
          result += (match != null) ? match : '';
        else if (groupIndex === 3 && includeAtz)
          result += (match != null) ? match : '';
        else if (groupIndex === 4 && includeCarrierRt)
          result += (match != null) ? match : '';
        else if (groupIndex === 6 && includePlus4)
          result += (match != null) ? match : '';
      });
      return result;
    }
    // No matches, return input geocode untouched
    return geocode;
  }
}
