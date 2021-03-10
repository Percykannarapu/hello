export enum DAOBaseStatus {
  UNCHANGED = 'UNCHANGED',
  UPDATE = 'UPDATE',
  INSERT = 'INSERT',
  DELETE = 'DELETE',
}

export namespace DAOBaseStatus {
  export function parse(payloadStatus: string) : DAOBaseStatus {
    const result: DAOBaseStatus | undefined = DAOBaseStatus[payloadStatus];
    if (result === undefined) throw new Error(`Unknown DAOBaseStatus: ${payloadStatus}`);
    return result;
  }
}

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
    if (result == null) throw new Error(`Invalid Client Location Type Code: ${strippedCode}`);
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
  Manual = 'Manual',
  Radii = 'Radii'
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

export enum FieldContentTypeCodes {
  Char = 'CHAR',
  Count = 'COUNT',
  Dist = 'DIST',
  Distance = 'DISTANCE',
  Index = 'INDEX',
  Median = 'MEDIAN',
  Percent = 'PERCENT',
  Ratio = 'RATIO'
}

export namespace FieldContentTypeCodes {
  export function parse(code: string) : FieldContentTypeCodes {
    if (code == null) return null;
    for (const key of Object.keys(FieldContentTypeCodes)) {
      if (code.toUpperCase() === FieldContentTypeCodes[key].toUpperCase()) return FieldContentTypeCodes[key];
    }
    throw new Error('Invalid Field Content Type Code');
  }
}
