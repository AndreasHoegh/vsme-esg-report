import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'in_progress', label: 'In Progress' }]
const YES_NO_SIMPLE = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function Step11_Governance() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const boardSize = parseFloat(data.boardSize) || 0
  const independent = parseFloat(data.boardIndependentMembers) || 0
  const independentPct = boardSize > 0 && independent > 0
    ? ((independent / boardSize) * 100).toFixed(1) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B11</span>
        <div>
          <h2>Governance</h2>
          <p>Board composition, anti-corruption, transparency, and business ethics.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>Board Composition</h3>
        <div className="form-grid form-grid--3">
          <FormField label="Board / Management Body Size"
            tooltip="Total number of members on the board of directors or supervisory board." id="boardSize">
            <Input id="boardSize" type="number" min="0"
              value={data.boardSize} onChange={u('boardSize')} />
          </FormField>
          <FormField label="Independent Members"
            tooltip="Non-executive / independent directors without conflicts of interest." id="boardIndep">
            <Input id="boardIndep" type="number" min="0"
              value={data.boardIndependentMembers} onChange={u('boardIndependentMembers')} />
          </FormField>
          <FormField label="Female Board Members (%)"
            tooltip="Percentage of board seats held by women." id="boardFemale">
            <Input id="boardFemale" type="number" min="0" max="100" step="0.1"
              value={data.boardFemaleMembersPercent} onChange={u('boardFemaleMembersPercent')} unit="%" />
          </FormField>
        </div>
        {independentPct && (
          <CalcField label="Independent Members Rate" value={independentPct} unit="%" tooltip="Independent board members as % of total." />
        )}
      </section>

      <section className="form-section">
        <h3>Anti-Corruption &amp; Ethics</h3>
        <FormField label="Does your company have an anti-corruption and bribery policy?"
          tooltip="A formal policy prohibiting bribery, corruption, and facilitation payments.">
          <RadioGroup name="antiCorr" value={data.hasAntiCorruptionPolicy} onChange={u('hasAntiCorruptionPolicy')} options={YES_NO} />
        </FormField>
        <FormField label="Anti-Corruption Training"
          tooltip="Describe how and how often employees receive anti-corruption training." id="antiCorrTrain">
          <Input id="antiCorrTrain" value={data.antiCorruptionTraining} onChange={u('antiCorruptionTraining')}
            placeholder="Annual mandatory training for all staff, supplementary for risk functions…" />
        </FormField>
        <FormField label="Does your company have a whistleblower mechanism?"
          tooltip="A secure channel for employees (or third parties) to report misconduct without fear of retaliation.">
          <RadioGroup name="whistle" value={data.whistleblowerMechanism} onChange={u('whistleblowerMechanism')} options={YES_NO_SIMPLE} />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Data Privacy &amp; Security</h3>
        <FormField label="Does your company have a data protection / privacy policy?"
          tooltip="GDPR-compliant policy covering personal data handling, storage, and subject rights.">
          <RadioGroup name="dataPrivacy" value={data.dataPrivacyPolicy} onChange={u('dataPrivacyPolicy')} options={YES_NO_SIMPLE} />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Tax Transparency</h3>
        <FormField label="Tax Transparency Approach" tooltip="Describe your approach to tax compliance and transparency.">
          <RichEditor value={data.taxTransparency} onChange={u('taxTransparency')}
            placeholder="Describe your approach to tax compliance, country-by-country reporting (if applicable), and any tax governance policies…" />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Governance Narrative</h3>
        <FormField label="Governance Context &amp; Improvements" tooltip="Describe governance structure, challenges, and improvements.">
          <RichEditor value={data.governanceNarrative} onChange={u('governanceNarrative')}
            placeholder="Describe your governance structure, how key risks are managed, and any governance improvements planned or underway…" />
        </FormField>
      </section>
    </div>
  )
}
