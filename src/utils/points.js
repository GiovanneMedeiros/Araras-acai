export function calculatePoints(value) {
  const numericValue = Number(value)
  if (Number.isNaN(numericValue) || numericValue <= 0) return 0
  return Math.floor(numericValue)
}