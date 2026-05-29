import React from "react";
import { useForm } from "../../context/FormContext";
import { FormField, Input, Select, RadioGroup } from "../FormField";
import RichEditor from "../RichEditor";
import ImageUpload from "../ImageUpload";
import "../StepContent.css";

const SECTORS = [
  "Manufacture of lifting and handling equipment",
  "Agriculture, Forestry and Fishing",
  "Mining and Quarrying",
  "Manufacturing",
  "Electricity, Gas, Steam and AC Supply",
  "Water Supply and Waste Management",
  "Construction",
  "Wholesale and Retail Trade",
  "Transportation and Storage",
  "Accommodation and Food Service",
  "Information and Communication",
  "Financial and Insurance Activities",
  "Real Estate Activities",
  "Professional, Scientific and Technical Activities",
  "Administrative and Support Service",
  "Public Administration",
  "Education",
  "Human Health and Social Work",
  "Arts, Entertainment and Recreation",
  "Other Service Activities",
];

const COUNTRIES = [
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Ireland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "United Kingdom",
  "Norway",
  "Switzerland",
  "United States",
  "Other",
];

const CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "DKK",
  "SEK",
  "NOK",
  "PLN",
  "CZK",
  "HUF",
];

const SDG_GOALS = [
  { n: 1, color: "#E5243B", name: "No Poverty" },
  { n: 2, color: "#DDA63A", name: "Zero Hunger" },
  { n: 3, color: "#4C9F38", name: "Good Health & Well-being" },
  { n: 4, color: "#C5192D", name: "Quality Education" },
  { n: 5, color: "#FF3A21", name: "Gender Equality" },
  { n: 6, color: "#26BDE2", name: "Clean Water & Sanitation" },
  { n: 7, color: "#FCC30B", name: "Affordable & Clean Energy" },
  { n: 8, color: "#A21942", name: "Decent Work & Economic Growth" },
  { n: 9, color: "#FD6925", name: "Industry, Innovation & Infrastructure" },
  { n: 10, color: "#DD1367", name: "Reduced Inequalities" },
  { n: 11, color: "#FD9D24", name: "Sustainable Cities & Communities" },
  { n: 12, color: "#BF8B2E", name: "Responsible Consumption & Production" },
  { n: 13, color: "#3F7E44", name: "Climate Action" },
  { n: 14, color: "#0A97D9", name: "Life Below Water" },
  { n: 15, color: "#56C02B", name: "Life on Land" },
  { n: 16, color: "#00689D", name: "Peace, Justice & Strong Institutions" },
  { n: 17, color: "#19486A", name: "Partnerships for the Goals" },
];

const REPORTING_BASIS = [
  { value: "individual", label: "Individual (single legal entity)" },
  { value: "consolidated", label: "Consolidated (group of companies)" },
];

const REPORTING_MODULE = [
  { value: "basic", label: "Basic Module only (B1–B11)" },
  { value: "basic_narrative", label: "Basic + Narrative Module" },
];

export default function Step1_GeneralInfo() {
  const { data, update } = useForm();
  const u = (field) => (val) => update({ [field]: val });

  const empCount = Number(data.employeeCount);

  const selectedSdgs = new Set(data.sdgGoals || []);
  const toggleSdg = (n) => {
    const next = new Set(selectedSdgs);
    next.has(n) ? next.delete(n) : next.add(n);
    update({ sdgGoals: [...next].sort((a, b) => a - b) });
  };

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B1</span>
        <div>
          <h2>General Information</h2>
          <p>
            Basic details about your company and the reporting period — required
            for all VSME disclosures.
          </p>
        </div>
      </div>

      <section className="form-section">
        <h3>Company Identification</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="Company Name"
            required
            tooltip="The full legal name of your company as registered."
            id="companyName"
          >
            <Input
              id="companyName"
              value={data.companyName}
              onChange={u("companyName")}
              placeholder="Acme GmbH"
            />
          </FormField>
          <FormField
            label="Legal Form"
            tooltip="E.g. GmbH, Ltd, SRL, S.A."
            id="legalForm"
          >
            <Input
              id="legalForm"
              value={data.legalForm}
              onChange={u("legalForm")}
              placeholder="GmbH"
            />
          </FormField>
          <FormField
            label="Registration Number"
            tooltip="Company registration / chamber of commerce number."
            id="regNum"
          >
            <Input
              id="regNum"
              value={data.registrationNumber}
              onChange={u("registrationNumber")}
              placeholder="HRB 12345"
            />
          </FormField>
          <FormField
            label="Country"
            required
            tooltip="Country where the company is headquartered."
            id="country"
          >
            <Select
              id="country"
              value={data.country}
              onChange={u("country")}
              options={COUNTRIES}
              placeholder="Select country…"
            />
          </FormField>
          <FormField
            label="Main Sector"
            required
            tooltip="Primary industry sector per NACE classification."
            id="sector"
          >
            <Select
              id="sector"
              value={data.sector}
              onChange={u("sector")}
              options={SECTORS}
              placeholder="Select sector…"
            />
          </FormField>
          <FormField
            label="NACE Code"
            tooltip="4-digit NACE Rev. 2 activity code, e.g. 2611."
            id="naceCode"
          >
            <Input
              id="naceCode"
              value={data.naceCode}
              onChange={u("naceCode")}
              placeholder="2611"
            />
          </FormField>
          <FormField
            label="Address"
            tooltip="Registered office or main business address."
            id="address"
          >
            <Input
              id="address"
              value={data.address}
              onChange={u("address")}
              placeholder="123 Main Street, 10115 Berlin"
            />
          </FormField>
          <FormField
            label="Website"
            tooltip="Company website URL."
            id="website"
          >
            <Input
              id="website"
              type="url"
              value={data.website}
              onChange={u("website")}
              placeholder="https://www.company.com"
            />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>Company Size</h3>
        <p className="section-desc">
          Determines which VSME disclosures are mandatory vs. voluntary.
        </p>
        <div className="form-grid form-grid--2">
          <FormField
            label="Number of Employees (FTE)"
            required
            tooltip="Full-time equivalent employees at year-end."
            id="empCount"
          >
            <Input
              id="empCount"
              type="number"
              min="1"
              value={data.employeeCount}
              onChange={u("employeeCount")}
              placeholder="45"
            />
          </FormField>
          <FormField
            label="Reporting Currency"
            tooltip="Currency used for all financial figures in this report."
            id="currency"
          >
            <Select
              id="currency"
              value={data.currency}
              onChange={u("currency")}
              options={CURRENCIES}
            />
          </FormField>
        </div>
        {data.employeeCount && (
          <div className="size-badge">
            {empCount < 10
              ? "🔵 Micro enterprise — VSME Basic module applies"
              : empCount < 50
                ? "🟢 Small enterprise — VSME Basic module applies"
                : empCount < 250
                  ? "🟡 Medium enterprise — VSME Basic module applies; consider Narrative module"
                  : "🔴 Large enterprise — VSME Basic + Narrative module recommended; ESRS may apply"}
          </div>
        )}
      </section>

      <section className="form-section">
        <h3>Financial Figures</h3>
        <p className="section-desc">
          Required for VSME intensity calculations (e.g. GHG emissions per
          revenue).
        </p>
        <div className="form-grid form-grid--2">
          <FormField
            label={`Balance Sheet Total (${data.currency || "EUR"})`}
            tooltip="Total assets from the balance sheet at year-end. Used to classify enterprise size."
            id="balanceSum"
          >
            <Input
              id="balanceSum"
              type="number"
              min="0"
              step="1000"
              value={data.balanceSum}
              onChange={u("balanceSum")}
              unit={data.currency || "EUR"}
              placeholder="e.g. 5000000"
            />
          </FormField>
          <FormField
            label={`Net Revenue / Turnover (${data.currency || "EUR"})`}
            tooltip="Total revenue for the reporting year. Used to calculate GHG intensity and other ratios."
            id="revenue"
          >
            <Input
              id="revenue"
              type="number"
              min="0"
              step="1000"
              value={data.revenue}
              onChange={u("revenue")}
              unit={data.currency || "EUR"}
              placeholder="e.g. 8000000"
            />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>Reporting Period</h3>
        <div className="form-grid form-grid--3">
          <FormField
            label="Reporting Year"
            required
            tooltip="The financial year this report covers."
            id="repYear"
          >
            <Input
              id="repYear"
              type="number"
              min="2020"
              max="2030"
              value={data.reportingYear}
              onChange={u("reportingYear")}
            />
          </FormField>
          <FormField
            label="Period Start"
            tooltip="First day of the reporting period."
            id="repStart"
          >
            <Input
              id="repStart"
              type="date"
              value={data.reportingPeriodStart}
              onChange={u("reportingPeriodStart")}
            />
          </FormField>
          <FormField
            label="Period End"
            tooltip="Last day of the reporting period."
            id="repEnd"
          >
            <Input
              id="repEnd"
              type="date"
              value={data.reportingPeriodEnd}
              onChange={u("reportingPeriodEnd")}
            />
          </FormField>
        </div>
        <FormField
          label="Reporting Basis"
          required
          tooltip="Individual = single legal entity. Consolidated = parent company including subsidiaries."
        >
          <RadioGroup
            name="reportingBasis"
            value={data.reportingBasis}
            onChange={u("reportingBasis")}
            options={REPORTING_BASIS}
          />
        </FormField>
        <FormField
          label="Reporting Module"
          tooltip="Select which VSME module(s) this report covers."
        >
          <RadioGroup
            name="reportingModule"
            value={data.reportingModule}
            onChange={u("reportingModule")}
            options={REPORTING_MODULE}
          />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Contact Information</h3>
        <div className="form-grid form-grid--3">
          <FormField
            label="Contact Name"
            tooltip="Person responsible for this sustainability report."
            id="contactName"
          >
            <Input
              id="contactName"
              value={data.contactName}
              onChange={u("contactName")}
              placeholder="Jane Smith"
            />
          </FormField>
          <FormField
            label="Email"
            tooltip="Email address for ESG enquiries."
            id="contactEmail"
          >
            <Input
              id="contactEmail"
              type="email"
              value={data.contactEmail}
              onChange={u("contactEmail")}
              placeholder="esg@company.com"
            />
          </FormField>
          <FormField label="Phone" id="contactPhone">
            <Input
              id="contactPhone"
              type="tel"
              value={data.contactPhone}
              onChange={u("contactPhone")}
              placeholder="+49 30 123456"
            />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>Cover Page Images</h3>
        <p className="section-desc">
          These images appear on the cover page of your exported PDF report.
        </p>
        <div className="form-grid form-grid--2">
          <div>
            <p className="section-desc" style={{ marginBottom: 8 }}>
              <strong>Company Logo</strong> — shown top-left on the cover (recommended: transparent PNG, square)
            </p>
            <ImageUpload
              fieldKey="logoImage"
              value={data.images?.logoImage}
              onChange={(key, val) =>
                update({ images: { ...data.images, [key]: val } })
              }
              label="Upload company logo"
            />
          </div>
          <div>
            <p className="section-desc" style={{ marginBottom: 8 }}>
              <strong>Cover Photo</strong> — large hero image filling the right side of the cover (recommended: landscape)
            </p>
            <ImageUpload
              fieldKey="coverPhoto"
              value={data.images?.coverPhoto}
              onChange={(key, val) =>
                update({ images: { ...data.images, [key]: val } })
              }
              label="Upload company/facility photo"
            />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3>Company Description</h3>
        <FormField
          label="About the Company"
          tooltip="Brief description of main business activities, products, and services."
        >
          <RichEditor
            value={data.companyDescription}
            onChange={u("companyDescription")}
            placeholder="Describe your company's main activities, key products or services, and markets served…"
          />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Certifications &amp; Standards</h3>
        <p className="section-desc">
          List any relevant certifications, permits, or standards your company
          holds. These will appear on a dedicated Certifications page at the end
          of your report.
        </p>
        <FormField
          label="Certifications (one per line)"
          tooltip="Enter each certification on a new line, e.g. 'ISO 9001:2015 - Quality Management' or 'ISO 45001:2018 - OH&S (valid to 2026)'"
        >
          <textarea
            className="form-textarea"
            rows={6}
            value={data.certificationsList || ""}
            onChange={(e) => update({ certificationsList: e.target.value })}
            placeholder={
              "ISO 9001:2015 - Quality Management System\nISO 45001:2018 - Occupational Health & Safety\nISO 14001:2015 - Environmental Management"
            }
          />
        </FormField>
      </section>

      <section className="form-section">
        <h3>UN Sustainable Development Goals</h3>
        <p className="section-desc">
          Select the goals your company actively contributes to. Selected goals
          will appear highlighted on a dedicated page in the report.
        </p>
        <div className="sdg-grid">
          {SDG_GOALS.map((goal) => {
            const active = selectedSdgs.has(goal.n);
            return (
              <button
                key={goal.n}
                type="button"
                className={`sdg-tile${active ? " sdg-tile--active" : ""}`}
                style={
                  active
                    ? { backgroundColor: goal.color, borderColor: goal.color }
                    : { borderColor: goal.color + "55" }
                }
                onClick={() => toggleSdg(goal.n)}
                title={goal.name}
              >
                <span
                  className="sdg-tile__num"
                  style={{ color: active ? "#fff" : goal.color }}
                >
                  {goal.n}
                </span>
                <span
                  className="sdg-tile__name"
                  style={{ color: active ? "#fff" : "#555" }}
                >
                  {goal.name}
                </span>
              </button>
            );
          })}
        </div>
        <FormField
          label="SDG Narrative"
          tooltip="Describe how the company works towards the selected goals."
        >
          <textarea
            className="form-textarea"
            rows={4}
            value={data.sdgNarrative || ""}
            onChange={(e) => update({ sdgNarrative: e.target.value })}
            placeholder="Describe the company's approach to the UN Sustainable Development Goals and the concrete activities that contribute to the selected goals…"
          />
        </FormField>
      </section>
    </div>
  );
}
