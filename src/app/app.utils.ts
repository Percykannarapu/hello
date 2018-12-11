export interface Statistics {
  mean: number;
  sum: number;
  min: number;
  max: number;
  variance: number;
  stdDeviation: number;
}

export function calculateStatistics(data: number[]) : Statistics {
  if (data == null || data.length === 0) return null;
  const result: Statistics = {
    mean: 0,
    sum: 0,
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    variance: 0,
    stdDeviation: 0
  };
  const dataLength = data.length;
  let sumOfSquares = 0;
  for (let i = 0; i < dataLength; ++i) {
    result.sum += data[i];
    sumOfSquares += (data[i] * data[i]);
    if (data[i] < result.min) result.min = data[i];
    if (data[i] > result.max) result.max = data[i];
  }
  result.mean = result.sum / dataLength;
  if (dataLength > 1) {
    const squareOfSum = result.sum * result.sum;
    const averageOfSquare = squareOfSum / dataLength;
    const deviation = sumOfSquares - averageOfSquare;
    result.variance = deviation / (dataLength - 1);
    result.stdDeviation = Math.sqrt(result.variance);
  }
  return result;
}
