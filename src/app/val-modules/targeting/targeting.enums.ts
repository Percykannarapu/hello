export enum ImpClientLocationTypeCodes {
  Site = 'Site',
  Competitor = 'Competitor',
  FailedSite = 'Failed Site',
  FailedCompetitor = 'Failed Competitor'
}

export type SuccessfulLocationTypeCodes = ImpClientLocationTypeCodes.Site | ImpClientLocationTypeCodes.Competitor;

export namespace ImpClientLocationTypeCodes {
  export function parse(code: string) : ImpClientLocationTypeCodes {
    return ImpClientLocationTypeCodes[code];
  }
  export function markSuccessful(code: ImpClientLocationTypeCodes) : SuccessfulLocationTypeCodes {
    switch (code) {
      case ImpClientLocationTypeCodes.Competitor:
      case ImpClientLocationTypeCodes.FailedCompetitor:
        return ImpClientLocationTypeCodes.Competitor;
      case ImpClientLocationTypeCodes.Site:
      case ImpClientLocationTypeCodes.FailedSite:
        return ImpClientLocationTypeCodes.Site;
    }
  }
}

export enum TradeAreaTypeCodes {
  Radius = 'Radius',
  Custom = 'Custom',
  HomeGeo = 'HomeGeo',
  Audience = 'Audience',
  Manual = 'Manual'
}

export enum TradeAreaMergeTypeCodes {
  NoMerge = 'No Merge',
  MergeEach = 'Merge Each',
  MergeAll = 'Merge All'
}

export namespace TradeAreaMergeTypeCodes {
  export function parse(code: string) : TradeAreaMergeTypeCodes {
    return TradeAreaMergeTypeCodes[code];
  }
}
