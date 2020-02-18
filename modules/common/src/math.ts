export interface Statistics {
  mean: number;
  sum: number;
  min: number;
  max: number;
  variance: number;
  stdDeviation: number;
  distance: number;
  meanIntervals: number[];
  quantiles: number[];
}

export function calculateStatistics(data: number[], intervalCount: number = 0) : Statistics {
  if (data == null || data.length === 0) return null;
  const sortedData = Array.from(data);
  sortedData.sort((a, b) => a - b);
  const result: Statistics = {
    mean: 0,
    sum: 0,
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    variance: 0,
    stdDeviation: 0,
    distance: 0,
    meanIntervals: [],
    quantiles: []
  };
  const dataLength = sortedData.length;
  const lastIndex = dataLength - 1;
  let sumOfSquares = 0;
  for (let i = 0; i < dataLength; ++i) {
    result.sum += sortedData[i];
    sumOfSquares += (sortedData[i] * sortedData[i]);
  }
  result.min = sortedData[0];
  result.max = sortedData[lastIndex];
  result.mean = result.sum / dataLength;
  if (dataLength > 1) {
    const squareOfSum = result.sum * result.sum;
    const averageOfSquare = squareOfSum / dataLength;
    const deviation = sumOfSquares - averageOfSquare;
    result.variance = deviation / lastIndex;
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
