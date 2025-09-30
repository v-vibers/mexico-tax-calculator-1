import { useState } from 'react'
import { useSubscribeDev } from '@subscribe.dev/react'
import Header from './Header'

type TaxBracket = {
  lower: number
  upper: number | null
  fixedFee: number
  rate: number
}

type TaxResult = {
  grossIncome: number
  taxableIncome: number
  taxOwed: number
  netIncome: number
  effectiveRate: number
  aiInsights: string
}

// 2024 Mexico Tax Brackets (ISR - Impuesto Sobre la Renta)
const TAX_BRACKETS: TaxBracket[] = [
  { lower: 0, upper: 8952.49, fixedFee: 0, rate: 1.92 },
  { lower: 8952.50, upper: 75984.55, fixedFee: 171.88, rate: 6.40 },
  { lower: 75984.56, upper: 133536.07, fixedFee: 4461.94, rate: 10.88 },
  { lower: 133536.08, upper: 155229.80, fixedFee: 10723.55, rate: 16.00 },
  { lower: 155229.81, upper: 185852.57, fixedFee: 14194.54, rate: 17.92 },
  { lower: 185852.58, upper: 374837.88, fixedFee: 19682.13, rate: 21.36 },
  { lower: 374837.89, upper: 590795.99, fixedFee: 60049.40, rate: 23.52 },
  { lower: 590796.00, upper: 1127926.84, fixedFee: 110842.74, rate: 30.00 },
  { lower: 1127926.85, upper: 1503902.46, fixedFee: 271981.99, rate: 32.00 },
  { lower: 1503902.47, upper: 4511707.37, fixedFee: 392294.17, rate: 34.00 },
  { lower: 4511707.38, upper: null, fixedFee: 1414947.85, rate: 35.00 }
]

function TaxCalculator() {
  const { client, user, usage, subscribe, subscriptionStatus, signOut } = useSubscribeDev()
  const [income, setIncome] = useState<string>('')
  const [deductions, setDeductions] = useState<string>('')
  const [result, setResult] = useState<TaxResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateTax = (grossIncome: number, deductionsAmount: number): Omit<TaxResult, 'aiInsights'> => {
    const taxableIncome = Math.max(0, grossIncome - deductionsAmount)

    let taxOwed = 0

    for (const bracket of TAX_BRACKETS) {
      if (taxableIncome > bracket.lower) {
        const upperLimit = bracket.upper ?? Infinity
        const taxableInBracket = Math.min(taxableIncome, upperLimit) - bracket.lower
        taxOwed = bracket.fixedFee + (taxableInBracket * bracket.rate / 100)
      } else {
        break
      }
    }

    const netIncome = grossIncome - taxOwed
    const effectiveRate = grossIncome > 0 ? (taxOwed / grossIncome) * 100 : 0

    return {
      grossIncome,
      taxableIncome,
      taxOwed,
      netIncome,
      effectiveRate
    }
  }

  const handleCalculate = async () => {
    const incomeValue = parseFloat(income)
    const deductionsValue = parseFloat(deductions || '0')

    if (isNaN(incomeValue) || incomeValue < 0) {
      setError('Please enter a valid income amount')
      return
    }

    if (isNaN(deductionsValue) || deductionsValue < 0) {
      setError('Please enter a valid deductions amount')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const taxCalc = calculateTax(incomeValue, deductionsValue)

      if (!client) {
        setResult({ ...taxCalc, aiInsights: 'Sign in required for AI insights' })
        setLoading(false)
        return
      }

      const prompt = `You are a Mexican tax expert. A taxpayer has the following financial information:
- Gross Income: $${incomeValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
- Deductions: $${deductionsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
- Taxable Income: $${taxCalc.taxableIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
- Tax Owed: $${taxCalc.taxOwed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
- Effective Tax Rate: ${taxCalc.effectiveRate.toFixed(2)}%

Provide 3-4 brief, actionable insights about their tax situation and potential optimization strategies according to Mexican tax law. Keep it concise and practical.`

      const { output } = await client.run('openai/gpt-4o', {
        input: {
          messages: [
            { role: 'system', content: 'You are a helpful Mexican tax advisor. Provide concise, practical advice.' },
            { role: 'user', content: prompt }
          ]
        }
      })

      setResult({
        ...taxCalc,
        aiInsights: output[0] as string
      })
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'type' in err) {
        if (err.type === 'insufficient_credits') {
          setError('Insufficient credits. Please upgrade your plan.')
        } else if (err.type === 'rate_limit_exceeded') {
          const retryAfter = 'retryAfter' in err ? err.retryAfter : 60000
          setError(`Rate limit exceeded. Please try again in ${Math.ceil((retryAfter as number) / 1000)} seconds.`)
        } else {
          setError('Failed to get AI insights. Please try again.')
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }

      const taxCalc = calculateTax(incomeValue, deductionsValue)
      setResult({ ...taxCalc, aiInsights: 'AI insights unavailable due to an error.' })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
  }

  return (
    <div className="calculator-container">
      <Header
        user={user}
        usage={usage}
        subscriptionStatus={subscriptionStatus}
        subscribe={subscribe}
        signOut={signOut}
      />

      <div className="calculator-content">
        <div className="calculator-card">
          <h2 className="calculator-title">Calculate Your Taxes</h2>

          <div className="input-section">
            <div className="input-group">
              <label htmlFor="income" className="input-label">
                Annual Gross Income (MXN)
              </label>
              <input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g., 500000"
                className="input-field"
                min="0"
                step="0.01"
              />
            </div>

            <div className="input-group">
              <label htmlFor="deductions" className="input-label">
                Annual Deductions (MXN) - Optional
              </label>
              <input
                id="deductions"
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                placeholder="e.g., 50000"
                className="input-field"
                min="0"
                step="0.01"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
                {error.includes('credits') && subscribe && (
                  <button onClick={subscribe} className="upgrade-link">
                    Upgrade Plan
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={loading || !income}
              className="calculate-button"
            >
              {loading ? 'Calculating...' : 'Calculate with AI Insights'}
            </button>
          </div>

          {result && (
            <div className="results-section">
              <h3 className="results-title">Tax Calculation Results</h3>

              <div className="results-grid">
                <div className="result-item">
                  <span className="result-label">Gross Income</span>
                  <span className="result-value">{formatCurrency(result.grossIncome)}</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Taxable Income</span>
                  <span className="result-value">{formatCurrency(result.taxableIncome)}</span>
                </div>

                <div className="result-item highlight">
                  <span className="result-label">Tax Owed</span>
                  <span className="result-value">{formatCurrency(result.taxOwed)}</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Net Income</span>
                  <span className="result-value">{formatCurrency(result.netIncome)}</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Effective Tax Rate</span>
                  <span className="result-value">{result.effectiveRate.toFixed(2)}%</span>
                </div>
              </div>

              {result.aiInsights && (
                <div className="insights-section">
                  <h4 className="insights-title">AI Tax Insights</h4>
                  <p className="insights-content">{result.aiInsights}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="info-card">
          <h3 className="info-title">About Mexican Tax Brackets (2024)</h3>
          <p className="info-text">
            This calculator uses the official ISR (Impuesto Sobre la Renta) tax brackets for 2024.
            Mexican income tax is progressive, with rates ranging from 1.92% to 35%.
          </p>
          <div className="tax-brackets">
            {TAX_BRACKETS.map((bracket, idx) => (
              <div key={idx} className="bracket-item">
                <span className="bracket-range">
                  {formatCurrency(bracket.lower)} - {bracket.upper ? formatCurrency(bracket.upper) : 'Above'}
                </span>
                <span className="bracket-rate">{bracket.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaxCalculator