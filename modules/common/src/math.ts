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

interface StatisticCollector {
  sum: number;
  squareSum: number;
  sortedValues: number[];
}

const emptyStatistic: Statistics = {
  mean: 0,
  sum: 0,
  min: Number.POSITIVE_INFINITY,
  max: Number.NEGATIVE_INFINITY,
  variance: 0,
  stdDeviation: 0,
  distance: 0,
  meanIntervals: [],
  quantiles: [],
  uniqueValues: []
};
const collection = new Map<string | number, StatisticCollector>();

export function collectStatistics(dataKey: string | number, dataPoint: number) : void {
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

export function getCollectedStatistics(clearAfterGet: boolean) : Record<string | number, CollectedStatistics> {
  const finalResult = {};
  collection.forEach((collector, key) => {
    const n = collector.sortedValues.length;
    const result: Statistics = {
      ...getEmptyStatistic(),
      mean: collector.sum / n,
      sum: collector.sum,
      min: collector.sortedValues[0],
      max: collector.sortedValues[n - 1]
    };
    result.distance = Math.abs(result.max - result.min);
    result.variance = (collector.squareSum / n) - (collector.sum / n);
    result.stdDeviation = Math.sqrt(result.variance);
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

export function getEmptyStatistic() : Statistics {
  return { ... emptyStatistic };
}

export function calculateStatistics(data: number[], intervalCount: number = 0) : Statistics {
  if (data == null || data.length === 0) return null;
  const sortedData = Array.from(data);
  sortedData.sort((a, b) => a - b);
  const result: Statistics = getEmptyStatistic();
  const dataLength = sortedData.length;
  const lastIndex = dataLength - 1;
  let meanSum = sortedData[0];
  let varSum = 0;
  for (let i = 1; i < dataLength; ++i) {
    result.sum += sortedData[i];
    result.min = data[i] < result.min ? data[i] : result.min;
    const stepSum = sortedData[i] - meanSum;
    const stepMean = ((i - 1) * stepSum) / i;
    meanSum += stepMean;
    varSum += stepMean * stepSum;
  }
  result.min = sortedData[0];
  result.max = sortedData[lastIndex];
  result.mean = result.sum / dataLength;
  if (dataLength > 1) {
    result.variance = varSum / (dataLength - 1);
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
