import { CreateUsageMetric } from './usage.actions';

abstract class CreateTargetingUsageMetric extends CreateUsageMetric {
  protected constructor(section: string, target: string, action: string, metricText: string, metricValue: number) {
    super({ namespace: 'targeting', section, target, action, metricText, metricValue});
  }
}

export class CreateApplicationUsageMetric extends CreateTargetingUsageMetric {
  constructor(target: string, action: string, metricText?: string, metricValue?: number) {
    super('application', target, action, metricText, metricValue);
  }
}

export class CreateProjectUsageMetric extends CreateTargetingUsageMetric {
  constructor(target: string, action: string, metricText?: string, metricValue?: number) {
    super('project', target, action, metricText, metricValue);
  }
}

export class CreateLocationUsageMetric extends CreateTargetingUsageMetric {
  constructor(target: string, action: string, metricText?: string, metricValue?: number) {
    super('location', target, action, metricText, metricValue);
  }
}

export class CreateAudienceUsageMetric extends CreateTargetingUsageMetric {
  constructor(target: string, action: string, metricText?: string, metricValue?: number) {
    super('audience', target, action, metricText, metricValue);
  }
}

export class CreateMapUsageMetric extends CreateTargetingUsageMetric {
  constructor(target: string, action: string, metricText?: string, metricValue?: number) {
    super('map', target, action, metricText, metricValue);
  }
}

export class CreateMapExportUsageMetric extends CreateTargetingUsageMetric {
  constructor(target: string, action: string, metricText?: string, metricValue?: number) {
    super('map', target, action, metricText, metricValue);
  }
}

export class CreateTradeAreaUsageMetric extends CreateTargetingUsageMetric {
  constructor(target: string, action: string, metricText?: string, metricValue?: number) {
    super('tradearea', target, action, metricText, metricValue);
  }
}
