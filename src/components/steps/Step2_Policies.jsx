import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, RadioGroup } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'in_progress', label: 'In Progress' },
]

function PolicyBlock({ label, tooltip, field, descField, placeholder }) {
  const { data, update } = useForm()
  return (
    <div className="policy-block">
      <FormField label={label} tooltip={tooltip}>
        <RadioGroup
          name={field}
          value={data[field]}
          onChange={val => update({ [field]: val })}
          options={YES_NO}
        />
      </FormField>
      {(data[field] === 'yes' || data[field] === 'in_progress') && (
        <FormField label="Description" tooltip="Describe the policy and how it is implemented.">
          <RichEditor
            value={data[descField]}
            onChange={val => update({ [descField]: val })}
            placeholder={placeholder}
          />
        </FormField>
      )}
    </div>
  )
}

export default function Step2_Policies() {
  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B2</span>
        <div>
          <h2>Policies &amp; Commitments</h2>
          <p>Governance structures and sustainability commitments your company has adopted.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>ESG Strategy</h3>
        <PolicyBlock
          label="Does your company have an ESG / Sustainability policy?"
          tooltip="A formal written policy that commits the company to sustainability goals and actions."
          field="hasESGPolicy"
          descField="esgPolicyDescription"
          placeholder="Describe your sustainability policy, key commitments, and how it is integrated into operations…"
        />
      </section>

      <section className="form-section">
        <h3>Board Oversight</h3>
        <PolicyBlock
          label="Does the board or management have oversight of ESG matters?"
          tooltip="Indicates whether ESG topics are formally part of board agenda, e.g. dedicated committee, regular reporting."
          field="hasBoardESGOversight"
          descField="boardOversightDescription"
          placeholder="Describe how ESG is governed at board/management level, e.g. ESG committee, frequency of reporting…"
        />
      </section>

      <section className="form-section">
        <h3>Business Conduct</h3>
        <PolicyBlock
          label="Does your company have a Code of Conduct?"
          tooltip="A written document setting out expected ethical behaviour for employees and management."
          field="hasCodeOfConduct"
          descField="codeOfConductDescription"
          placeholder="Describe the scope of the code of conduct and how it is communicated to staff…"
        />
        <PolicyBlock
          label="Does your company require suppliers to adhere to a supplier code of conduct?"
          tooltip="A code that suppliers and business partners must accept as a condition of working with you."
          field="hasSupplierCode"
          descField="supplierCodeDescription"
          placeholder="Describe what your supplier code of conduct covers and how compliance is monitored…"
        />
      </section>
    </div>
  )
}
