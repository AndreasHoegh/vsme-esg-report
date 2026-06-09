import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export default function Step11_Governance() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })
  const comprehensive = data.reportingModule === 'comprehensive'
  const cur = data.currency || 'EUR'
  const femaleBoard = parseFloat(data.c9FemaleBoard) || 0
  const maleBoard = parseFloat(data.c9MaleBoard) || 0
  const boardRatio = maleBoard > 0 ? (femaleBoard / maleBoard).toFixed(2) : ''

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

      {comprehensive && (
        <>
          {/* ══ C8 — REVENUES FROM CERTAIN SECTORS & EU BENCHMARK ════════════ */}
          <section className="form-section form-section--comprehensive">
            <div className="comprehensive-tag">Comprehensive Module · C8</div>
            <h3>Revenues from Certain Sectors &amp; EU Benchmark Exclusion</h3>
            <p className="section-desc">
              Only relevant if your company has activities in these sectors.
              Leave fields blank where not applicable.
            </p>
            <div className="form-grid form-grid--2">
              <FormField label={`Controversial weapons (${cur})`} tooltip="Anti-personnel mines, cluster munitions, chemical and biological weapons." id="c8w">
                <Input id="c8w" type="number" min="0" value={data.c8RevWeapons} onChange={u('c8RevWeapons')} unit={cur} />
              </FormField>
              <FormField label={`Tobacco cultivation / production (${cur})`} id="c8t">
                <Input id="c8t" type="number" min="0" value={data.c8RevTobacco} onChange={u('c8RevTobacco')} unit={cur} />
              </FormField>
              <FormField label={`Fossil fuels — coal (${cur})`} id="c8c">
                <Input id="c8c" type="number" min="0" value={data.c8RevCoal} onChange={u('c8RevCoal')} unit={cur} />
              </FormField>
              <FormField label={`Fossil fuels — oil (${cur})`} id="c8o">
                <Input id="c8o" type="number" min="0" value={data.c8RevOil} onChange={u('c8RevOil')} unit={cur} />
              </FormField>
              <FormField label={`Fossil fuels — gas (${cur})`} id="c8g">
                <Input id="c8g" type="number" min="0" value={data.c8RevGas} onChange={u('c8RevGas')} unit={cur} />
              </FormField>
              <FormField label={`Chemicals — pesticides / agrochemicals (${cur})`} id="c8p">
                <Input id="c8p" type="number" min="0" value={data.c8RevPesticides} onChange={u('c8RevPesticides')} unit={cur} />
              </FormField>
            </div>
            <p className="section-desc" style={{ marginBottom: 0 }}>
              Does the company exceed the EU Paris-aligned benchmark exclusion thresholds?
            </p>
            <div className="form-grid form-grid--2">
              <FormField label="Hard coal & lignite (≥1% of revenue)"><RadioGroup name="c8BenchmarkCoal" value={data.c8BenchmarkCoal} onChange={u('c8BenchmarkCoal')} options={YES_NO} /></FormField>
              <FormField label="Oil fuels (≥10% of revenue)"><RadioGroup name="c8BenchmarkOil" value={data.c8BenchmarkOil} onChange={u('c8BenchmarkOil')} options={YES_NO} /></FormField>
              <FormField label="Gaseous fuels (≥50% of revenue)"><RadioGroup name="c8BenchmarkGas" value={data.c8BenchmarkGas} onChange={u('c8BenchmarkGas')} options={YES_NO} /></FormField>
              <FormField label="High-GHG electricity (≥50% of revenue)"><RadioGroup name="c8BenchmarkElectricity" value={data.c8BenchmarkElectricity} onChange={u('c8BenchmarkElectricity')} options={YES_NO} /></FormField>
            </div>
          </section>

          {/* ══ C9 — GENDER DIVERSITY IN GOVERNANCE BODY ═════════════════════ */}
          <section className="form-section form-section--comprehensive">
            <div className="comprehensive-tag">Comprehensive Module · C9</div>
            <h3>Gender Diversity in the Top Governance Body</h3>
            <p className="section-desc">
              The ratio of women to men in the highest decision-making body
              (e.g. the board).
            </p>
            <div className="form-grid form-grid--2">
              <FormField label="Women in the top governance body" id="c9f">
                <Input id="c9f" type="number" min="0" value={data.c9FemaleBoard} onChange={u('c9FemaleBoard')} />
              </FormField>
              <FormField label="Men in the top governance body" id="c9m">
                <Input id="c9m" type="number" min="0" value={data.c9MaleBoard} onChange={u('c9MaleBoard')} />
              </FormField>
            </div>
            {boardRatio !== '' && (
              <CalcField
                label="Female-to-male ratio in governance body"
                value={boardRatio}
                unit=""
                tooltip="Women ÷ men on the governance body. Below 1 = more men; above 1 = more women."
              />
            )}
          </section>
        </>
      )}
    </div>
  )
}
