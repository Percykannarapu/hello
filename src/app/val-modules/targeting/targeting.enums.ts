export enum ImpClientLocationTypeCodes {
  Site = 'Site',
  Competitor = 'Competitor',
  FailedSite = 'Failed Site',
  FailedCompetitor = 'Failed Competitor'
}

export type SuccessfulLocationTypeCodes = ImpClientLocationTypeCodes.Site | ImpClientLocationTypeCodes.Competitor;

export namespace ImpClientLocationTypeCodes {
  export function parse(code: string) : ImpClientLocationTypeCodes {
    const strippedCode = code.replace(' ', ''); // remove first instance of space
    const result = ImpClientLocationTypeCodes[strippedCode];
    if (result == null) throw new Error('Invalid Client Location Type Code');
    return result;
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

export namespace TradeAreaTypeCodes {
  export function parse(code: string) : TradeAreaTypeCodes {
    for (const key of Object.keys(TradeAreaTypeCodes)) {
      if (code.toUpperCase() === TradeAreaTypeCodes[key].toUpperCase()) return TradeAreaTypeCodes[key];
    }
    throw new Error('Invalid Trade Area Type Code');
  }
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

export enum ProjectCpmTypeCodes {
  Blended = 'Blended',
  OwnerGroup = 'OwnerGroup'
}

export namespace ProjectCpmTypeCodes {
  export function parse(code: string) : ProjectCpmTypeCodes {
    return ProjectCpmTypeCodes[code];
  }
}