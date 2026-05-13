import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, RadioGroup } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function Step4_GHG() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B4</span>
        <div>
          <h2>Pollution</h2>
          <p>Disclosure of pollution to air, water, and soil — only required if your company already monitors or reports on pollution.</p>
        </div>
      </div>

      <div className="info-box">
        <strong>VSME requirement:</strong> This section is only mandatory if your company operates in sectors or activities that are relevant to pollution (e.g. manufacturing, chemicals, transport, agriculture). Micro and small companies with no material pollution impact may answer "No" and move on.
      </div>

      <section className="form-section">
        <h3>Pollution Reporting</h3>
        <FormField
          label="Does your company monitor, measure, or report on pollution to air, water, or soil?"
          required
          tooltip="Select Yes if your company tracks emissions to air (e.g. NOx, SOx, particles), discharges to water, or soil contamination."
        >
          <RadioGroup
            name="hasPollutionReporting"
            value={data.hasPollutionReporting}
            onChange={u('hasPollutionReporting')}
            options={YES_NO}
          />
        </FormField>

        {data.hasPollutionReporting === 'yes' && (
          <>
            <FormField
              label="Pollution Description"
              tooltip="Describe the types of pollutants, quantities, affected media (air/water/soil), and how they are measured."
            >
              <RichEditor
                value={data.pollutionDescription}
                onChange={u('pollutionDescription')}
                placeholder="Describe pollutant types (e.g. NOx, PM10, heavy metals), quantities discharged or emitted, affected environmental media, measurement methods, and applicable permits or limit values…"
              />
            </FormField>

            <FormField
              label="Pollution Reduction Measures &amp; Narrative"
              tooltip="Describe actions taken to prevent or reduce pollution, including any incidents, targets, and investments."
            >
              <RichEditor
                value={data.pollutionNarrative}
                onChange={u('pollutionNarrative')}
                placeholder="Describe pollution prevention measures, any incidents or spills during the period, reduction targets, and investments in cleaner technology or processes…"
              />
            </FormField>
          </>
        )}

        {data.hasPollutionReporting === 'no' && (
          <div className="section-note">
            No further disclosure required for this section. If your activities change and pollution becomes relevant in a future period, this section should be completed at that time.
          </div>
        )}
      </section>
    </div>
  )
}
