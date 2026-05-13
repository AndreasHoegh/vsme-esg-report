import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function Step9_Pay() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const maleAvg = parseFloat(data.maleAvgSalary) || 0
  const femaleAvg = parseFloat(data.femaleAvgSalary) || 0

  // Pay gap = (Male avg - Female avg) / Male avg × 100
  const payGap = maleAvg > 0 && femaleAvg > 0
    ? (((maleAvg - femaleAvg) / maleAvg) * 100).toFixed(1)
    : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B9</span>
        <div>
          <h2>Pay &amp; Benefits</h2>
          <p>Compensation fairness, gender pay gap, and employee benefits.</p>
        </div>
      </div>

      <div className="info-box">
        <strong>Gender Pay Gap</strong> is auto-calculated as: (Male avg. salary − Female avg. salary) ÷ Male avg. salary × 100.
        A positive number means men earn more on average.
      </div>

      <section className="form-section">
        <h3>Gender Pay Gap</h3>
        <div className="form-grid form-grid--2">
          <FormField label={`Male Average Salary (${data.currency})`}
            tooltip="Average annual gross salary for male employees." id="maleAvgSalary">
            <Input id="maleAvgSalary" type="number" min="0" step="100"
              value={data.maleAvgSalary} onChange={u('maleAvgSalary')} unit={data.currency} />
          </FormField>
          <FormField label={`Female Average Salary (${data.currency})`}
            tooltip="Average annual gross salary for female employees." id="femaleAvgSalary">
            <Input id="femaleAvgSalary" type="number" min="0" step="100"
              value={data.femaleAvgSalary} onChange={u('femaleAvgSalary')} unit={data.currency} />
          </FormField>
        </div>

        {payGap !== '' && (
          <div className={`pay-gap-result ${parseFloat(payGap) > 10 ? 'pay-gap-high' : parseFloat(payGap) > 0 ? 'pay-gap-mid' : 'pay-gap-low'}`}>
            <span className="pay-gap-label">Gender Pay Gap</span>
            <span className="pay-gap-value">{payGap}%</span>
            <span className="pay-gap-desc">
              {parseFloat(payGap) > 10
                ? 'Above EU average — consider pay equity analysis'
                : parseFloat(payGap) > 0
                ? 'Moderate gap — monitor and review'
                : 'Women earn as much or more than men on average'}
            </span>
          </div>
        )}
      </section>

      <section className="form-section">
        <h3>CEO to Worker Pay Ratio</h3>
        <div className="form-grid form-grid--2">
          <FormField label="CEO / Highest-Paid Executive Annual Pay"
            tooltip={`Total compensation of the highest-paid executive in ${data.currency}.`} id="ceoPay">
            <Input id="ceoPay" type="number" min="0" step="1000"
              value={data.ceoPay} onChange={u('ceoPay')} unit={data.currency} />
          </FormField>
          <FormField label="Median Worker Annual Pay"
            tooltip={`Median annual gross pay of all employees in ${data.currency}.`} id="medianPay">
            <Input id="medianPay" type="number" min="0" step="1000"
              value={data.medianPay} onChange={u('medianPay')} unit={data.currency} />
          </FormField>
        </div>
        {data.ceoPay && data.medianPay && parseFloat(data.medianPay) > 0 && (
          <CalcField
            label="CEO to Median Worker Ratio"
            value={(parseFloat(data.ceoPay) / parseFloat(data.medianPay)).toFixed(1)}
            unit="× median"
            tooltip="Ratio of CEO pay to median employee pay. Industry average varies widely."
          />
        )}
      </section>

      <section className="form-section">
        <h3>Minimum Wage &amp; Benefits</h3>
        <FormField label="Does all pay meet or exceed the statutory minimum wage?"
          tooltip="Confirm all employees (incl. part-time, temp) are paid at or above the legal minimum.">
          <RadioGroup name="minWage" value={data.minimumWageCompliance} onChange={u('minimumWageCompliance')} options={YES_NO} />
        </FormField>
        <FormField label="Does the company pay a living wage?"
          tooltip="A living wage covers basic needs (housing, food, transport) — typically higher than statutory minimum.">
          <RadioGroup name="livingWage" value={data.livingWagePolicy} onChange={u('livingWagePolicy')} options={YES_NO} />
        </FormField>
        <FormField label="Employee Benefits" tooltip="Describe benefits provided beyond salary, e.g. pension, health, childcare.">
          <RichEditor value={data.benefitsDescription} onChange={u('benefitsDescription')}
            placeholder="Describe employee benefits: pension contributions, health insurance, flexible working, childcare support, etc." />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Pay Narrative</h3>
        <FormField label="Pay Context &amp; Actions" tooltip="Describe pay philosophy and any actions to address inequities.">
          <RichEditor value={data.payNarrative} onChange={u('payNarrative')}
            placeholder="Describe your approach to fair pay, any pay equity reviews, and actions taken to close gaps…" />
        </FormField>
      </section>
    </div>
  )
}
