import { isConvertibleToNumber, isNil } from './type-checks';
import { sortedIndex } from './utils';

export interface Statistics {
  mean: number;
  sum: number;
  min: number;
  max: number;
  variance: number;
  stdDeviation: number;
  distance: number;
  meanIntervals?: number[];
  quantiles?: number[];
  uniqueValues?: string[];
}

export interface CollectedStatistics extends Statistics {
  sortedValues: number[];
}

export interface StatisticIntervals {
  meanIntervals: number[];
  quantiles: number[];
}

export type CompleteCollectedStatistics = CollectedStatistics & Partial<StatisticIntervals>;

interface StatisticCollector {
  sum?: number;
  squareSum?: number;
  sortedValues?: number[];
  uniqueValues?: Set<string>;
}

const emptyStatistic: CollectedStatistics = {
  mean: 0,
  sum: 0,
  min: Number.POSITIVE_INFINITY,
  max: Number.NEGATIVE_INFINITY,
  variance: 0,
  stdDeviation: 0,
  distance: 0,
  sortedValues: [],
  uniqueValues: []
};
const collection = new Map<string | number, StatisticCollector>();

export function collectStatistics(dataKey: string | number, dataValue: string | number) : void {
  if (isNil(dataValue)) return;
  if (isConvertibleToNumber(dataValue)) {
    const dataPoint = Number(dataValue);
    collectNumericStatistic(dataKey, dataPoint);
  } else {
    collectStringStatistic(dataKey, dataValue);
  }
}

function collectNumericStatistic(dataKey: string | number, dataPoint: number) : void {
  let currentCollector: StatisticCollector;
  if (collection.has(dataKey)) {
    currentCollector = collection.get(dataKey);
    currentCollector.sortedValues.splice(sortedIndex(currentCollector.sortedValues, dataPoint, true), 0, dataPoint);
    currentCollector.sum += dataPoint;
    currentCollector.squareSum += (dataPoint * dataPoint);
  } else {
    currentCollector = {
      sum: dataPoint,
      squareSum: dataPoint * dataPoint,
      sortedValues: [dataPoint]
    };
    collection.set(dataKey, currentCollector);
  }
}

function collectStringStatistic(dataKey: string | number, dataPoint: string) : void {
  let currentCollector: StatisticCollector;
  if (collection.has(dataKey)) {
    currentCollector = collection.get(dataKey);
    currentCollector.uniqueValues?.add(dataPoint);
  } else {
    currentCollector = {
      uniqueValues: new Set<string>([dataPoint])
    };
    collection.set(dataKey, currentCollector);
  }
}

export function getCollectedStatistics(clearAfterGet: boolean) : Record<string | number, CollectedStatistics> {
  const finalResult = {};
  collection.forEach((collector, key) => {
    let result: CollectedStatistics = { ...getEmptyStatistic() };
    if (isNil(collector.uniqueValues)) {
      const n = collector.sortedValues.length;
      result = {
        ...result,
        mean: collector.sum / n,
        sum: collector.sum,
        min: collector.sortedValues[0],
        max: collector.sortedValues[n - 1],
        sortedValues: collector.sortedValues
      };
      result.distance = Math.abs(result.max - result.min);
      let varianceSum = 0;
      for (let i = 0; i < n; ++i) {
        varianceSum += (collector.sortedValues[i] - result.mean) ** 2;
      }
      result.variance = varianceSum / n;
      result.stdDeviation = Math.sqrt(result.variance);
    } else {
      const items = Array.from(collector.uniqueValues);
      items.sort();
      result = {
        ...result,
        uniqueValues: items,
      };
    }
    finalResult[key] = result;
  });
  if (clearAfterGet) collection.clear();
  return finalResult;
}

export function getIntervalsFromCollectedStats(collectedStats: CollectedStatistics, intervalCount: number) : StatisticIntervals {
  const result: StatisticIntervals = {
    meanIntervals: [],
    quantiles: []
  };
  if (intervalCount > 0) {
    const interval = (collectedStats.max - collectedStats.min) / intervalCount;
    const quantileInterval = collectedStats.sortedValues.length * (1 / intervalCount);
    for (let i = 0; i < intervalCount - 1; ++i) {
      const currentBreak = (interval * (i + 1)) + collectedStats.min;
      const quantileIndex = Math.floor(quantileInterval * (i + 1));
      result.meanIntervals.push(currentBreak);
      result.quantiles.push(collectedStats.sortedValues[quantileIndex - 1]);
    }
  }
  return result;
}

export function getEmptyStatistic() : CollectedStatistics {
  return {
    ... emptyStatistic,
    meanIntervals: Array.from<number>([]),
    quantiles: Array.from<number>([]),
  };
}

export function calculateStatistics(data: number[], intervalCount: number = 0) : Statistics {
  if (data == null || data.length === 0) return null;
  const sortedData = Array.from(data);
  sortedData.sort((a, b) => a - b);
  const result: Statistics = getEmptyStatistic();
  const dataLength = sortedData.length;
  const lastIndex = dataLength - 1;
  for (let i = 0; i < dataLength; ++i) {
    result.sum += sortedData[i];
  }
  result.min = sortedData[0];
  result.max = sortedData[lastIndex];
  result.mean = result.sum / dataLength;
  let varianceSum = 0;
  for (let i = 0; i < dataLength; ++i) {
    varianceSum += (sortedData[i] - result.mean) ** 2;
  }
  if (dataLength > 1) {
    result.variance = varianceSum / dataLength;
    result.stdDeviation = Math.sqrt(result.variance);
    if (intervalCount > 0) {
      const interval = (result.max - result.min) / intervalCount;
      const quantileInterval = dataLength * (1 / intervalCount);
      for (let i = 0; i < intervalCount - 1; ++i) {
        const currentBreak = (interval * (i + 1)) + result.min;
        const quantileIndex = Math.floor(quantileInterval * (i + 1));
        result.meanIntervals.push(currentBreak);
        result.quantiles.push(sortedData[quantileIndex - 1]);
      }
    }
  }
  result.distance = Math.abs(result.max - result.min);
  return result;
}

export function expandRange<T extends { min: number, max: number }>(data: T, expansionAmount: number) : T {
  return {
    ...data,
    min: data.min - expansionAmount,
    max: data.max + expansionAmount
  };
}
