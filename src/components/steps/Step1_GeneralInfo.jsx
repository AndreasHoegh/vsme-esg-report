import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, Select, RadioGroup } from '../FormField'
import RichEditor from '../RichEditor'
import ImageUpload from '../ImageUpload'
import '../StepContent.css'

const SECTORS = [
  'Agriculture, Forestry and Fishing', 'Mining and Quarrying', 'Manufacturing',
  'Electricity, Gas, Steam and AC Supply', 'Water Supply and Waste Management',
  'Construction', 'Wholesale and Retail Trade', 'Transportation and Storage',
  'Accommodation and Food Service', 'Information and Communication',
  'Financial and Insurance Activities', 'Real Estate Activities',
  'Professional, Scientific and Technical Activities', 'Administrative and Support Service',
  'Public Administration', 'Education', 'Human Health and Social Work',
  'Arts, Entertainment and Recreation', 'Other Service Activities',
]

const COUNTRIES = [
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark','Estonia',
  'Finland','France','Germany','Greece','Hungary','Ireland','Italy','Latvia','Lithuania',
  'Luxembourg','Malta','Netherlands','Poland','Portugal','Romania','Slovakia','Slovenia',
  'Spain','Sweden', 'United Kingdom', 'Norway', 'Switzerland', 'United States', 'Other',
]

const CURRENCIES = ['EUR','USD','GBP','CHF','DKK','SEK','NOK','PLN','CZK','HUF']

const SIZE_OPTIONS = [
  { value: 'micro', label: 'Micro (< 10 employees)' },
  { value: 'small', label: 'Small (10–49 employees)' },
  { value: 'medium', label: 'Medium (50–249 employees)' },
]

export default function Step1_GeneralInfo() {
  const { data, update } = useForm()
  const u = (field) => (val) => update({ [field]: val })

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B1</span>
        <div>
          <h2>General Information</h2>
          <p>Basic details about your company and reporting period.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>Company Identification</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Company Name" required tooltip="The full legal name of your company as registered." id="companyName">
            <Input id="companyName" value={data.companyName} onChange={u('companyName')} placeholder="Acme GmbH" />
          </FormField>
          <FormField label="Legal Form" tooltip="E.g. GmbH, Ltd, SRL, S.A." id="legalForm">
            <Input id="legalForm" value={data.legalForm} onChange={u('legalForm')} placeholder="GmbH" />
          </FormField>
          <FormField label="Registration Number" tooltip="Company registration / chamber of commerce number." id="regNum">
            <Input id="regNum" value={data.registrationNumber} onChange={u('registrationNumber')} placeholder="HRB 12345" />
          </FormField>
          <FormField label="Country" required tooltip="Country where the company is headquartered." id="country">
            <Select id="country" value={data.country} onChange={u('country')} options={COUNTRIES} placeholder="Select country…" />
          </FormField>
          <FormField label="Main Sector" required tooltip="Primary industry sector per NACE classification." id="sector">
            <Select id="sector" value={data.sector} onChange={u('sector')} options={SECTORS} placeholder="Select sector…" />
          </FormField>
          <FormField label="NACE Code" tooltip="4-digit NACE Rev. 2 activity code, e.g. 2611." id="naceCode">
            <Input id="naceCode" value={data.naceCode} onChange={u('naceCode')} placeholder="2611" />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>Company Size</h3>
        <p className="section-desc">Size determines which VSME disclosures are mandatory vs. voluntary.</p>
        <div className="form-grid form-grid--2">
          <FormField label="Number of Employees (FTE)" required tooltip="Full-time equivalent employees at year-end." id="empCount">
            <Input id="empCount" type="number" min="1" value={data.employeeCount} onChange={u('employeeCount')} placeholder="45" />
          </FormField>
          <FormField label="Reporting Currency" tooltip="Currency used for all financial figures in this report." id="currency">
            <Select id="currency" value={data.currency} onChange={u('currency')} options={CURRENCIES} />
          </FormField>
        </div>
        {data.employeeCount && (
          <div className="size-badge">
            {Number(data.employeeCount) < 10
              ? '🔵 Micro enterprise — Basic module applies'
              : Number(data.employeeCount) < 50
              ? '🟢 Small enterprise — Basic module applies'
              : '🟡 Medium enterprise — Basic module applies; consider Narrative module'}
          </div>
        )}
      </section>

      <section className="form-section">
        <h3>Reporting Period</h3>
        <div className="form-grid form-grid--3">
          <FormField label="Reporting Year" required tooltip="The financial year this report covers." id="repYear">
            <Input id="repYear" type="number" min="2020" max="2030" value={data.reportingYear} onChange={u('reportingYear')} />
          </FormField>
          <FormField label="Period Start" tooltip="First day of the reporting period." id="repStart">
            <Input id="repStart" type="date" value={data.reportingPeriodStart} onChange={u('reportingPeriodStart')} />
          </FormField>
          <FormField label="Period End" tooltip="Last day of the reporting period." id="repEnd">
            <Input id="repEnd" type="date" value={data.reportingPeriodEnd} onChange={u('reportingPeriodEnd')} />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>Contact Information</h3>
        <div className="form-grid form-grid--3">
          <FormField label="Contact Name" tooltip="Person responsible for this sustainability report." id="contactName">
            <Input id="contactName" value={data.contactName} onChange={u('contactName')} placeholder="Jane Smith" />
          </FormField>
          <FormField label="Email" tooltip="Email address for ESG enquiries." id="contactEmail">
            <Input id="contactEmail" type="email" value={data.contactEmail} onChange={u('contactEmail')} placeholder="esg@company.com" />
          </FormField>
          <FormField label="Phone" id="contactPhone">
            <Input id="contactPhone" type="tel" value={data.contactPhone} onChange={u('contactPhone')} placeholder="+49 30 123456" />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>Company Logo / Photo</h3>
        <p className="section-desc">Appears on the cover page of your exported PDF report.</p>
        <ImageUpload
          fieldKey="logoImage"
          value={data.images?.logoImage}
          onChange={(key, val) => update({ images: { ...data.images, [key]: val } })}
          label="Company logo or facility photo (recommended: square or 4:3)"
        />
      </section>

      <section className="form-section">
        <h3>Company Description</h3>
        <FormField label="About the Company" tooltip="Brief description of main business activities, products, and services.">
          <RichEditor
            value={data.companyDescription}
            onChange={u('companyDescription')}
            placeholder="Describe your company's main activities, key products or services, and markets served…"
          />
        </FormField>
      </section>
    </div>
  )
}
