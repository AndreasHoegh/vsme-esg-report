import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

export default function Step11_Governance() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B11</span>
        <div>
          <h2>Corporate Conduct</h2>
          <p>Disclosure of convictions and fines related to corruption or bribery — only if applicable.</p>
        </div>
      </div>

      <div className="info-box">
        <strong>VSME requirement:</strong> Companies must disclose the number of convictions and total fines for violations of anti-corruption and anti-bribery laws. If your company has had <strong>no convictions or fines</strong>, enter 0 in both fields — this is a positive disclosure and demonstrates integrity.
      </div>

      <section className="form-section">
        <h3>Corruption &amp; Bribery Convictions</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="Number of Convictions for Corruption / Bribery"
            required
            tooltip="Total number of legal convictions of the company or its employees for corruption, bribery, or related offences during the reporting period. Enter 0 if none."
            id="corruptionConvictions"
          >
            <Input id="corruptionConvictions" type="number" min="0"
              value={data.corruptionConvictions} onChange={u('corruptionConvictions')}
              placeholder="0" />
          </FormField>
          <FormField
            label={`Total Fines for Corruption / Bribery (${data.currency || 'EUR'})`}
            required
            tooltip="Total monetary fines or penalties imposed for corruption or bribery violations. Enter 0 if none."
            id="corruptionFines"
          >
            <Input id="corruptionFines" type="number" min="0" step="1"
              value={data.corruptionFinesTotal} onChange={u('corruptionFinesTotal')}
              unit={data.currency || 'EUR'} placeholder="0" />
          </FormField>
        </div>

        {(data.corruptionConvictions === '0' || data.corruptionConvictions === '') &&
         (data.corruptionFinesTotal === '0' || data.corruptionFinesTotal === '') &&
          data.corruptionConvictions !== '' && (
          <div className="section-note section-note--positive">
            ✓ No convictions or fines recorded — this is a positive integrity indicator.
          </div>
        )}

        <FormField
          label="Additional Context (optional)"
          tooltip="If there were any convictions or fines, provide context on the nature of the case, outcome, and remediation steps taken."
        >
          <RichEditor
            value={data.corruptionNarrative}
            onChange={u('corruptionNarrative')}
            placeholder="If any convictions or fines apply, describe the nature and outcome of the case and any remediation measures implemented. If none, this field can be left blank."
          />
        </FormField>
      </section>
    </div>
  )
}
