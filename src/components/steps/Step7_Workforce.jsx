import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import ImageUpload from '../ImageUpload'
import '../StepContent.css'

export default function Step7_Workforce() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const total = parseFloat(data.totalEmployees) || 0
  const male = parseFloat(data.maleEmployees) || 0
  const female = parseFloat(data.femaleEmployees) || 0
  const permanent = parseFloat(data.permanentEmployees) || 0
  const fullTime = parseFloat(data.fullTimeEmployees) || 0

  const femalePct = total > 0 && female > 0 ? ((female / total) * 100).toFixed(1) : ''
  const permanentPct = total > 0 && permanent > 0 ? ((permanent / total) * 100).toFixed(1) : ''
  const fullTimePct = total > 0 && fullTime > 0 ? ((fullTime / total) * 100).toFixed(1) : ''

  const newHires = parseFloat(data.newHires) || 0
  const turnover = parseFloat(data.employeeTurnover) || 0
  const hireRate = total > 0 && newHires > 0 ? ((newHires / total) * 100).toFixed(1) : ''
  const turnoverRate = total > 0 && turnover > 0 ? ((turnover / total) * 100).toFixed(1) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B7</span>
        <div>
          <h2>Own Workforce</h2>
          <p>Employee headcount by contract type, gender, age, and key workforce metrics.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>Total Headcount</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Total Employees" required
            tooltip="Total number of persons employed at year-end (headcount, not FTE)." id="totalEmp">
            <Input id="totalEmp" type="number" min="0" value={data.totalEmployees} onChange={u('totalEmployees')} />
          </FormField>
        </div>

        <p className="subsection-title">By Contract Type</p>
        <div className="form-grid form-grid--2">
          <FormField label="Permanent Employees"
            tooltip="Employees with an open-ended or indefinite employment contract." id="permEmp">
            <Input id="permEmp" type="number" min="0" value={data.permanentEmployees} onChange={u('permanentEmployees')} />
          </FormField>
          <FormField label="Temporary Employees"
            tooltip="Fixed-term, seasonal, or agency workers." id="tempEmp">
            <Input id="tempEmp" type="number" min="0" value={data.temporaryEmployees} onChange={u('temporaryEmployees')} />
          </FormField>
        </div>
        {permanentPct && <CalcField label="Permanent Contract Rate" value={permanentPct} unit="%" tooltip="Share on permanent contracts." />}

        <p className="subsection-title">By Working Time</p>
        <div className="form-grid form-grid--2">
          <FormField label="Full-Time Employees" id="ftEmp">
            <Input id="ftEmp" type="number" min="0" value={data.fullTimeEmployees} onChange={u('fullTimeEmployees')} />
          </FormField>
          <FormField label="Part-Time Employees" id="ptEmp">
            <Input id="ptEmp" type="number" min="0" value={data.partTimeEmployees} onChange={u('partTimeEmployees')} />
          </FormField>
        </div>
        {fullTimePct && <CalcField label="Full-Time Rate" value={fullTimePct} unit="%" tooltip="Share working full-time." />}
      </section>

      <section className="form-section">
        <h3>Diversity</h3>
        <p className="subsection-title">By Gender</p>
        <div className="form-grid form-grid--3">
          <FormField label="Male" id="maleEmp" tooltip="Number of employees identifying as male.">
            <Input id="maleEmp" type="number" min="0" value={data.maleEmployees} onChange={u('maleEmployees')} />
          </FormField>
          <FormField label="Female" id="femaleEmp" tooltip="Number of employees identifying as female.">
            <Input id="femaleEmp" type="number" min="0" value={data.femaleEmployees} onChange={u('femaleEmployees')} />
          </FormField>
          <FormField label="Non-binary / Other" id="otherEmp"
            tooltip="Employees identifying as non-binary or other gender identities.">
            <Input id="otherEmp" type="number" min="0" value={data.otherGenderEmployees} onChange={u('otherGenderEmployees')} />
          </FormField>
        </div>
        {femalePct && <CalcField label="Female Representation" value={femalePct} unit="%" tooltip="Percentage of female employees." />}

        <p className="subsection-title">By Age Group</p>
        <div className="form-grid form-grid--3">
          <FormField label="Under 30" id="under30">
            <Input id="under30" type="number" min="0" value={data.employeesUnder30} onChange={u('employeesUnder30')} />
          </FormField>
          <FormField label="30–50" id="age3050">
            <Input id="age3050" type="number" min="0" value={data.employees30to50} onChange={u('employees30to50')} />
          </FormField>
          <FormField label="Over 50" id="over50">
            <Input id="over50" type="number" min="0" value={data.employeesOver50} onChange={u('employeesOver50')} />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>Employee Flows</h3>
        <div className="form-grid form-grid--2">
          <FormField label="New Hires (during period)"
            tooltip="Number of new employees hired during the reporting year." id="newHires">
            <Input id="newHires" type="number" min="0" value={data.newHires} onChange={u('newHires')} />
          </FormField>
          <FormField label="Employee Departures (Turnover)"
            tooltip="Number of employees who left during the reporting year (voluntary and involuntary)." id="turnover">
            <Input id="turnover" type="number" min="0" value={data.employeeTurnover} onChange={u('employeeTurnover')} />
          </FormField>
        </div>
        {hireRate && <CalcField label="Hire Rate" value={hireRate} unit="%" tooltip="New hires as % of total employees." />}
        {turnoverRate && <CalcField label="Turnover Rate" value={turnoverRate} unit="%" tooltip="Departures as % of total employees." />}
      </section>

      <section className="form-section">
        <h3>Workforce Narrative</h3>
        <FormField label="Workforce Context" tooltip="Describe workforce characteristics, diversity initiatives, and employee engagement.">
          <RichEditor value={data.workforceNarrative} onChange={u('workforceNarrative')}
            placeholder="Describe workforce demographics, key HR initiatives, employee engagement activities…" />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Team Photo</h3>
        <p className="section-desc">A team or workplace photo shown alongside the workforce section in your PDF report.</p>
        <ImageUpload
          fieldKey="workforceImage"
          value={data.images?.workforceImage}
          onChange={(key, val) => update({ images: { ...data.images, [key]: val } })}
          label="Team photo, office, or workplace image"
        />
      </section>
    </div>
  )
}
