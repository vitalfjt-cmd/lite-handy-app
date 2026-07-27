export function formatItemPrice(
  price: number,
  taxType?: 'INCLUDED' | 'EXCLUDED' | 'NONE',
  taxRateType?: 'STANDARD' | 'REDUCED' | 'NONE',
  taxDisplayMode?: 'INCLUDED' | 'EXCLUDED',
  taxRate: number = 10,
  reducedTaxRate: number = 8,
  yenFormatter?: (val: number) => string
): string {
  const yen = yenFormatter || ((val: number) => `¥${val.toLocaleString()}`)

  if (taxType === 'NONE' || taxRateType === 'NONE') {
    return `${yen(price)}（非課税）`
  }

  const effectiveRate = taxRateType === 'REDUCED' ? reducedTaxRate : taxRate
  const isReduced = taxRateType === 'REDUCED'
  const rateLabel = isReduced ? `${effectiveRate}%` : `${effectiveRate}%`

  if (taxType === 'EXCLUDED') {
    if (taxDisplayMode === 'INCLUDED') {
      const taxIncludedPrice = Math.round(price * (1 + effectiveRate / 100))
      return `${yen(taxIncludedPrice)}（税込${rateLabel}）`
    } else {
      return `${yen(price)}（税抜${rateLabel}）`
    }
  } else {
    // Default taxType is INCLUDED
    if (taxDisplayMode === 'EXCLUDED') {
      const taxExcludedPrice = Math.round(price / (1 + effectiveRate / 100))
      return `${yen(taxExcludedPrice)}（税抜${rateLabel}）`
    } else {
      return `${yen(price)}（税込${rateLabel}）`
    }
  }
}

export function getEffectiveTaxRate(
  taxRateType?: 'STANDARD' | 'REDUCED' | 'NONE',
  standardRate: number = 10,
  reducedRate: number = 8
): number {
  if (taxRateType === 'NONE') return 0
  if (taxRateType === 'REDUCED') return reducedRate
  return standardRate
}
