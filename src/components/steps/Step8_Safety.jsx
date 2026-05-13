import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import ImageUpload from '../ImageUpload'
import '../StepContent.css'

export default function Step8_Safety() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const total = parseFloat(data.totalEmployees) || 0
  const permanent = parseFloat(data.permanentEmployees) || 0
  const temporary = parseFloat(data.temporaryEmployees) || 0
  const fullTime = parseFloat(data.fullTimeEmployees) || 0
  const partTime = parseFloat(data.partTimeEmployees) || 0
  const male = parseFloat(data.maleEmployees) || 0
  const female = parseFloat(data.femaleEmployees) || 0
  const other = parseFloat(data.otherGenderEmployees) || 0
  const notRegistered = parseFloat(data.notRegisteredGender) || 0

  const femalePct = total > 0 && female > 0 ? ((female / total) * 100).toFixed(1) : ''
  const permanentPct = total > 0 && permanent > 0 ? ((permanent / total) * 100).toFixed(1) : ''

  const newHires = parseFloat(data.newHires) || 0
  const turnover = parseFloat(data.employeeTurnover) || 0
  const turnoverRate = total > 0 && turnover > 0 ? ((turnover / total) * 100).toFixed(1) : ''

  const empCount = parseFloat(data.employeeCount) || 0
  const show50Plus = empCount >= 50

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B8</span>
        <div>
          <h2>Own Workforce</h2>
          <p>Headcount by contract type, working time, and gender — core VSME workforce disclosures.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>Total Headcount</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Total Employees (headcount)" required
            tooltip="Total number of persons employed at the end of the reporting period (headcount, not FTE)." id="totalEmp">
            <Input id="totalEmp" type="number" min="0" value={data.totalEmployees} onChange={u('totalEmployees')} />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>By Contract Type</h3>
        <p className="section-desc">VSME requires disclosure of permanent vs. temporary employees.</p>
        <div className="form-grid form-grid--2">
          <FormField label="Permanent Employees" required
            tooltip="Employees on open-ended or indefinite employment contracts." id="permEmp">
            <Input id="permEmp" type="number" min="0" value={data.permanentEmployees} onChange={u('permanentEmployees')} />
          </FormField>
          <FormField label="Temporary Employees" required
            tooltip="Fixed-term, seasonal, or agency workers." id="tempEmp">
            <Input id="tempEmp" type="number" min="0" value={data.temporaryEmployees} onChange={u('temporaryEmployees')} />
          </FormField>
        </div>
        {permanentPct && <CalcField label="Permanent Contract Rate" value={permanentPct} unit="%" tooltip="Share of employees on permanent contracts." />}
      </section>

      <section className="form-section">
        <h3>By Working Time</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Full-Time Employees" id="ftEmp"
            tooltip="Employees working the standard full-time hours for your sector.">
            <Input id="ftEmp" type="number" min="0" value={data.fullTimeEmployees} onChange={u('fullTimeEmployees')} />
          </FormField>
          <FormField label="Part-Time Employees" id="ptEmp"
            tooltip="Employees contracted for fewer hours than full-time standard.">
            <Input id="ptEmp" type="number" min="0" value={data.partTimeEmployees} onChange={u('partTimeEmployees')} />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>By Gender</h3>
        <p className="section-desc">VSME requires gender breakdown of the workforce.</p>
        <div className="form-grid form-grid--4">
          <FormField label="Male" required id="maleEmp">
            <Input id="maleEmp" type="number" min="0" value={data.maleEmployees} onChange={u('maleEmployees')} />
          </FormField>
          <FormField label="Female" required id="femaleEmp">
            <Input id="femaleEmp" type="number" min="0" value={data.femaleEmployees} onChange={u('femaleEmployees')} />
          </FormField>
          <FormField label="Other / Non-binary" id="otherEmp">
            <Input id="otherEmp" type="number" min="0" value={data.otherGenderEmployees} onChange={u('otherGenderEmployees')} />
          </FormField>
          <FormField label="Not Registered" id="notRegEmp"
            tooltip="Employees for whom gender is not registered in HR systems.">
            <Input id="notRegEmp" type="number" min="0" value={data.notRegisteredGender} onChange={u('notRegisteredGender')} />
          </FormField>
        </div>
        {femalePct && <CalcField label="Female Representation" value={femalePct} unit="%" tooltip="Percentage of female employees." />}
      </section>

      <section className="form-section">
        <h3>By Age Group</h3>
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
        <h3>Employees by Country</h3>
        <FormField
          label="Number of Employees per Country (if operating in multiple countries)"
          tooltip="If your company operates in more than one country, disclose headcount per country."
          id="empByCountry"
        >
          <Input id="empByCountry"
            value={data.employeesByCountry}
            onChange={u('employeesByCountry')}
            placeholder="e.g. Germany: 40, Austria: 12, Switzerland: 8" />
        </FormField>
      </section>

      {show50Plus && (
        <section className="form-section">
          <h3>Employee Flows</h3>
          <p className="section-desc">Required for companies with 50 or more employees.</p>
          <div className="form-grid form-grid--2">
            <FormField label="New Hires (during period)"
              tooltip="Number of new employees hired during the reporting year." id="newHires">
              <Input id="newHires" type="number" min="0" value={data.newHires} onChange={u('newHires')} />
            </FormField>
            <FormField label="Employee Departures"
              tooltip="Number of employees who left during the reporting year (voluntary and involuntary)." id="turnoverNum">
              <Input id="turnoverNum" type="number" min="0" value={data.employeeTurnover} onChange={u('employeeTurnover')} />
            </FormField>
          </div>
          {turnoverRate && <CalcField label="Turnover Rate" value={turnoverRate} unit="%" tooltip="Departures as % of total employees." />}
        </section>
      )}

      <section className="form-section">
        <h3>Non-Employee Workers</h3>
        <FormField
          label="Non-Employee Workers (contractors, agency staff, etc.)"
          tooltip="Persons not on the company payroll but working under your direction or on your premises."
          id="nonEmpWorkers"
        >
          <Input id="nonEmpWorkers"
            value={data.nonEmployeeWorkers}
            onChange={u('nonEmployeeWorkers')}
            placeholder="e.g. 15 contractors on-site" />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Workforce Narrative</h3>
        <FormField label="Workforce Context" tooltip="Describe workforce characteristics, diversity initiatives, and employee relations.">
          <RichEditor value={data.workforceNarrative} onChange={u('workforceNarrative')}
            placeholder="Describe workforce demographics, key HR initiatives, diversity and inclusion activities, and employee engagement…" />
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
