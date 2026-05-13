import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, RadioGroup } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function Step5_Water() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B5</span>
        <div>
          <h2>Biodiversity &amp; Ecosystems</h2>
          <p>Disclosure of impacts on biodiversity-sensitive areas — only required if your operations are near or affect protected or sensitive sites.</p>
        </div>
      </div>

      <div className="info-box">
        <strong>VSME requirement:</strong> This section is mandatory only if your company has sites in or near biodiversity-sensitive areas (e.g. Natura 2000 sites, UNESCO World Heritage Sites, national parks, wetlands). If not applicable, select "No" and proceed.
      </div>

      <section className="form-section">
        <h3>Biodiversity Sensitivity</h3>
        <FormField
          label="Does your company have sites located in, near, or with significant impact on biodiversity-sensitive areas?"
          required
          tooltip="Biodiversity-sensitive areas include legally protected sites (e.g. Natura 2000, national parks) or key biodiversity areas identified by IUCN."
        >
          <RadioGroup
            name="hasBiodiversitySites"
            value={data.hasBiodiversitySites}
            onChange={u('hasBiodiversitySites')}
            options={YES_NO}
          />
        </FormField>

        {data.hasBiodiversitySites === 'yes' && (
          <>
            <FormField
              label="Site Description"
              tooltip="Name the sites, the sensitive areas they are near, and describe the nature of the impact."
            >
              <RichEditor
                value={data.biodiversityDescription}
                onChange={u('biodiversityDescription')}
                placeholder="Describe the location, size (hectares), name of the sensitive or protected area (e.g. Natura 2000 site name), and the nature of potential impacts (e.g. habitat fragmentation, water run-off, noise)…"
              />
            </FormField>

            <div className="form-grid form-grid--2">
              <FormField
                label="Total Land Use (hectares)"
                tooltip="Total land area occupied by your operations."
                id="landUseTotal"
              >
                <Input id="landUseTotal" type="number" min="0" step="0.01"
                  value={data.landUseTotal} onChange={u('landUseTotal')} unit="ha" />
              </FormField>
              <FormField
                label="Land in or Near Sensitive Areas (hectares)"
                tooltip="Area of your operations within or adjacent to legally protected or sensitive ecosystems."
                id="landUseSensitive"
              >
                <Input id="landUseSensitive" type="number" min="0" step="0.01"
                  value={data.landUseSensitive} onChange={u('landUseSensitive')} unit="ha" />
              </FormField>
            </div>

            <FormField
              label="Biodiversity Measures &amp; Narrative"
              tooltip="Describe measures to avoid, minimise, or restore biodiversity impacts."
            >
              <RichEditor
                value={data.biodiversityNarrative}
                onChange={u('biodiversityNarrative')}
                placeholder="Describe mitigation measures (avoid, minimise, restore), any biodiversity management plans, and outcomes or targets related to biodiversity…"
              />
            </FormField>
          </>
        )}

        {data.hasBiodiversitySites === 'no' && (
          <div className="section-note">
            No further disclosure required. If your operations expand to areas near sensitive sites in the future, this section should be completed at that time.
          </div>
        )}
      </section>
    </div>
  )
}
