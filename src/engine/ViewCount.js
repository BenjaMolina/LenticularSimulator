export const MIN_VIEWS = 2
export const MAX_VIEWS = 10

export function isSupportedViewCount(count) {
  return Number.isInteger(count) && count >= MIN_VIEWS && count <= MAX_VIEWS
}
