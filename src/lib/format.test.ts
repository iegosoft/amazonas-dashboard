import { describe, expect, it } from 'vitest'
import { fmtRegiao } from './format'

describe('fmtRegiao', () => {
  it('nomeia micro e mesorregião para não parecer o nome do município', () => {
    expect(fmtRegiao({ microrregiao: 'Manaus', mesorregiao: 'Centro Amazonense' })).toBe(
      'Microrregião: Manaus · Mesorregião: Centro Amazonense',
    )
  })
  it('omite o que o IBGE não informou', () => {
    expect(fmtRegiao({ microrregiao: 'Tefé', mesorregiao: '—' })).toBe('Microrregião: Tefé')
    expect(fmtRegiao({ microrregiao: '—', mesorregiao: '—' })).toBe('')
  })
})
