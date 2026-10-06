import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import {
  getExpirationUrgency,
  getExpiringItems,
  suggestRecipesForExpiringItems,
  type PantryItem,
} from '../services/pantry-intelligence'

describe('pantry intelligence', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-08T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('orders expired and soon-to-expire items by urgency', () => {
    const items: PantryItem[] = [
      { id: 'medium', ingredient: 'spinach', quantity: 1, unit: 'bag', expirationDate: '2026-01-11' },
      { id: 'expired', ingredient: 'milk', quantity: 1, unit: 'carton', expirationDate: '2026-01-07' },
      { id: 'high', ingredient: 'chicken', quantity: 1, unit: 'lb', expirationDate: '2026-01-09' },
      { id: 'fresh', ingredient: 'rice', quantity: 1, unit: 'bag', expirationDate: '2026-01-20' },
    ]

    expect(getExpiringItems(items).map(({ id, urgency }) => ({ id, urgency }))).toEqual([
      { id: 'expired', urgency: 'expired' },
      { id: 'high', urgency: 'high' },
      { id: 'medium', urgency: 'medium' },
    ])
  })

  it('uses only expired and high-urgency pantry ingredients for suggestions', () => {
    const expiringItems = getExpiringItems([
      { ingredient: 'milk', quantity: 1, unit: 'carton', expirationDate: '2026-01-07' },
      { ingredient: 'chicken', quantity: 1, unit: 'lb', expirationDate: '2026-01-09' },
      { ingredient: 'spinach', quantity: 1, unit: 'bag', expirationDate: '2026-01-11' },
    ])

    expect(suggestRecipesForExpiringItems(expiringItems)).toEqual(['milk', 'chicken'])
    expect(getExpirationUrgency(4)).toBe('low')
  })
})
