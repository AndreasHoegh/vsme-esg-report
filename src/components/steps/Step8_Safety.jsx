import React from "react";
import { useForm } from "../../context/FormContext";
import { FormField, Input, Select, RadioGroup, CalcField } from "../FormField";
import RichEditor from "../RichEditor";
import ImageUpload from "../ImageUpload";
import "../StepContent.css";

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export default function Step8_Safety() {
  const { data, update } = useForm();
  const u = (f) => (v) => update({ [f]: v });
  const comprehensive = data.reportingModule === "comprehensive";
  const femaleMgr = parseFloat(data.c5FemaleManagers) || 0;
  const maleMgr = parseFloat(data.c5MaleManagers) || 0;
  const mgmtRatio = maleMgr > 0 ? (femaleMgr / maleMgr).toFixed(2) : "";

  const total = parseFloat(data.totalEmployees) || 0;
  const permanent = parseFloat(data.permanentEmployees) || 0;
  const temporary = parseFloat(data.temporaryEmployees) || 0;
  const fullTime = parseFloat(data.fullTimeEmployees) || 0;
  const partTime = parseFloat(data.partTimeEmployees) || 0;
  const male = parseFloat(data.maleEmployees) || 0;
  const female = parseFloat(data.femaleEmployees) || 0;
  const other = parseFloat(data.otherGenderEmployees) || 0;
  const notRegistered = parseFloat(data.notRegisteredGender) || 0;

  const femalePct =
    total > 0 && female > 0 ? ((female / total) * 100).toFixed(1) : "";
  const permanentPct =
    total > 0 && permanent > 0 ? ((permanent / total) * 100).toFixed(1) : "";

  const newHires = parseFloat(data.newHires) || 0;
  const turnover = parseFloat(data.employeeTurnover) || 0;
  const turnoverRate =
    total > 0 && turnover > 0 ? ((turnover / total) * 100).toFixed(1) : "";

  const empCount = parseFloat(data.employeeCount) || 0;

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B8</span>
        <div>
          <h2>Own Workforce</h2>
          <p>
            Headcount by contract type, working time, and gender — core VSME
            workforce disclosures.
          </p>
        </div>
      </div>

      <section className="form-section">
        <h3>Total Headcount</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="Total Employees (headcount)"
            required
            tooltip="Total number of persons employed at the end of the reporting period (headcount, not FTE)."
            id="totalEmp"
          >
            <Input
              id="totalEmp"
              type="number"
              min="0"
              value={data.totalEmployees}
              onChange={u("totalEmployees")}
            />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>By Contract Type</h3>
        <p className="section-desc">
          VSME requires disclosure of permanent vs. temporary employees.
        </p>
        <div className="form-grid form-grid--2">
          <FormField
            label="Permanent Employees"
            required
            tooltip="Employees on open-ended or indefinite employment contracts."
            id="permEmp"
          >
            <Input
              id="permEmp"
              type="number"
              min="0"
              value={data.permanentEmployees}
              onChange={u("permanentEmployees")}
            />
          </FormField>
          <FormField
            label="Temporary Employees"
            required
            tooltip="Fixed-term, seasonal, or agency workers."
            id="tempEmp"
          >
            <Input
              id="tempEmp"
              type="number"
              min="0"
              value={data.temporaryEmployees}
              onChange={u("temporaryEmployees")}
            />
          </FormField>
        </div>
        {permanentPct && (
          <CalcField
            label="Permanent Contract Rate"
            value={permanentPct}
            unit="%"
            tooltip="Share of employees on permanent contracts."
          />
        )}
      </section>

      <section className="form-section">
        <h3>By Working Time</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="Full-Time Employees"
            id="ftEmp"
            tooltip="Employees working the standard full-time hours for your sector."
          >
            <Input
              id="ftEmp"
              type="number"
              min="0"
              value={data.fullTimeEmployees}
              onChange={u("fullTimeEmployees")}
            />
          </FormField>
          <FormField
            label="Part-Time Employees"
            id="ptEmp"
            tooltip="Employees contracted for fewer hours than full-time standard."
          >
            <Input
              id="ptEmp"
              type="number"
              min="0"
              value={data.partTimeEmployees}
              onChange={u("partTimeEmployees")}
            />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>By Gender</h3>
        <p className="section-desc">
          VSME requires gender breakdown of the workforce.
        </p>
        <div className="form-grid form-grid--4">
          <FormField label="Male" required id="maleEmp">
            <Input
              id="maleEmp"
              type="number"
              min="0"
              value={data.maleEmployees}
              onChange={u("maleEmployees")}
            />
          </FormField>
          <FormField label="Female" required id="femaleEmp">
            <Input
              id="femaleEmp"
              type="number"
              min="0"
              value={data.femaleEmployees}
              onChange={u("femaleEmployees")}
            />
          </FormField>
          <FormField label="Other / Non-binary" id="otherEmp">
            <Input
              id="otherEmp"
              type="number"
              min="0"
              value={data.otherGenderEmployees}
              onChange={u("otherGenderEmployees")}
            />
          </FormField>
          <FormField
            label="Not Registered"
            id="notRegEmp"
            tooltip="Employees for whom gender is not registered in HR systems."
          >
            <Input
              id="notRegEmp"
              type="number"
              min="0"
              value={data.notRegisteredGender}
              onChange={u("notRegisteredGender")}
            />
          </FormField>
        </div>
        {femalePct && (
          <CalcField
            label="Female Representation"
            value={femalePct}
            unit="%"
            tooltip="Percentage of female employees."
          />
        )}
      </section>

      <section className="form-section">
        <h3>By Age Group</h3>
        <div className="form-grid form-grid--3">
          <FormField label="Under 30" id="under30">
            <Input
              id="under30"
              type="number"
              min="0"
              value={data.employeesUnder30}
              onChange={u("employeesUnder30")}
            />
          </FormField>
          <FormField label="30–50" id="age3050">
            <Input
              id="age3050"
              type="number"
              min="0"
              value={data.employees30to50}
              onChange={u("employees30to50")}
            />
          </FormField>
          <FormField label="Over 50" id="over50">
            <Input
              id="over50"
              type="number"
              min="0"
              value={data.employeesOver50}
              onChange={u("employeesOver50")}
            />
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
          <Input
            id="empByCountry"
            value={data.employeesByCountry}
            onChange={u("employeesByCountry")}
            placeholder="e.g. Germany: 40, Austria: 12, Switzerland: 8"
          />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Employee Flows</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="New Hires (during period)"
            tooltip="Number of new employees hired during the reporting year."
            id="newHires"
          >
            <Input
              id="newHires"
              type="number"
              min="0"
              value={data.newHires}
              onChange={u("newHires")}
            />
          </FormField>
          <FormField
            label="Employee Departures"
            tooltip="Number of employees who left during the reporting year (voluntary and involuntary)."
            id="turnoverNum"
          >
            <Input
              id="turnoverNum"
              type="number"
              min="0"
              value={data.employeeTurnover}
              onChange={u("employeeTurnover")}
            />
          </FormField>
        </div>
        {turnoverRate && (
          <CalcField
            label="Turnover Rate"
            value={turnoverRate}
            unit="%"
            tooltip="Departures as % of total employees."
          />
        )}
      </section>

      <section className="form-section">
        <h3>Non-Employee Workers</h3>
        <FormField
          label="Non-Employee Workers (contractors, agency staff, etc.)"
          tooltip="Persons not on the company payroll but working under your direction or on your premises."
          id="nonEmpWorkers"
        >
          <Input
            id="nonEmpWorkers"
            value={data.nonEmployeeWorkers}
            onChange={u("nonEmployeeWorkers")}
            placeholder="e.g. 15 contractors on-site"
          />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Workforce Narrative</h3>
        <FormField
          label="Workforce Context"
          tooltip="Describe workforce characteristics, diversity initiatives, and employee relations."
        >
          <RichEditor
            value={data.workforceNarrative}
            onChange={u("workforceNarrative")}
            placeholder="Describe workforce demographics, key HR initiatives, diversity and inclusion activities, and employee engagement…"
          />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Team Photo</h3>
        <p className="section-desc">
          A team or workplace photo shown alongside the workforce section in
          your PDF report.
        </p>
        <ImageUpload
          fieldKey="workforceImage"
          value={data.images?.workforceImage}
          onChange={(key, val) =>
            update({ images: { ...data.images, [key]: val } })
          }
          label="Team photo, office, or workplace image"
        />
      </section>

      {comprehensive && (
        <>
          {/* ══ C5 — ADDITIONAL WORKFORCE CHARACTERISTICS ════════════════════ */}
          <section className="form-section form-section--comprehensive">
            <div className="comprehensive-tag">Comprehensive Module · C5</div>
            <h3>Additional Workforce Characteristics</h3>
            <p className="section-desc">
              Gender ratio at management level and the use of self-employed /
              agency workers. Recommended for companies with 50+ employees.
            </p>
            <div className="form-grid form-grid--2">
              <FormField label="Female employees at management level" id="c5fm">
                <Input
                  id="c5fm"
                  type="number"
                  min="0"
                  value={data.c5FemaleManagers}
                  onChange={u("c5FemaleManagers")}
                />
              </FormField>
              <FormField label="Male employees at management level" id="c5mm">
                <Input
                  id="c5mm"
                  type="number"
                  min="0"
                  value={data.c5MaleManagers}
                  onChange={u("c5MaleManagers")}
                />
              </FormField>
            </div>
            {mgmtRatio !== "" && (
              <CalcField
                label="Female-to-male ratio at management level"
                value={mgmtRatio}
                unit=""
                tooltip="Female managers ÷ male managers. Below 1 = more men; above 1 = more women."
              />
            )}
            <div className="form-grid form-grid--2">
              <FormField
                label="Self-employed working for the company"
                tooltip="Self-employed persons without their own employees who work solely for your company."
                id="c5se"
              >
                <Input
                  id="c5se"
                  type="number"
                  min="0"
                  value={data.c5SelfEmployed}
                  onChange={u("c5SelfEmployed")}
                />
              </FormField>
              <FormField
                label="Agency / temporary workers"
                tooltip="Workers provided to your company via a temporary work agency."
                id="c5aw"
              >
                <Input
                  id="c5aw"
                  type="number"
                  min="0"
                  value={data.c5AgencyWorkers}
                  onChange={u("c5AgencyWorkers")}
                />
              </FormField>
            </div>
          </section>

          {/* ══ C6 — HUMAN RIGHTS POLICIES & PROCESSES ═══════════════════════ */}
          <section className="form-section form-section--comprehensive">
            <div className="comprehensive-tag">Comprehensive Module · C6</div>
            <h3>Human Rights Policies &amp; Processes (Own Workforce)</h3>
            <FormField label="Do you have a code of conduct or human-rights policy for your own workforce?">
              <RadioGroup
                name="c6HasPolicy"
                value={data.c6HasPolicy}
                onChange={u("c6HasPolicy")}
                options={YES_NO}
              />
            </FormField>
            <FormField label="Do you have a grievance mechanism for your own workforce?">
              <RadioGroup
                name="c6HasGrievance"
                value={data.c6HasGrievance}
                onChange={u("c6HasGrievance")}
                options={YES_NO}
              />
            </FormField>
            {data.c6HasPolicy === "yes" && (
              <>
                <p className="section-desc" style={{ marginBottom: 0 }}>
                  The policy / code of conduct covers:
                </p>
                <div className="form-grid form-grid--2">
                  <FormField label="Child labour">
                    <RadioGroup
                      name="c6CoversChildLabour"
                      value={data.c6CoversChildLabour}
                      onChange={u("c6CoversChildLabour")}
                      options={YES_NO}
                    />
                  </FormField>
                  <FormField label="Forced labour">
                    <RadioGroup
                      name="c6CoversForcedLabour"
                      value={data.c6CoversForcedLabour}
                      onChange={u("c6CoversForcedLabour")}
                      options={YES_NO}
                    />
                  </FormField>
                  <FormField label="Human trafficking">
                    <RadioGroup
                      name="c6CoversTrafficking"
                      value={data.c6CoversTrafficking}
                      onChange={u("c6CoversTrafficking")}
                      options={YES_NO}
                    />
                  </FormField>
                  <FormField label="Discrimination">
                    <RadioGroup
                      name="c6CoversDiscrimination"
                      value={data.c6CoversDiscrimination}
                      onChange={u("c6CoversDiscrimination")}
                      options={YES_NO}
                    />
                  </FormField>
                  <FormField label="Accident prevention / safety">
                    <RadioGroup
                      name="c6CoversAccidentPrevention"
                      value={data.c6CoversAccidentPrevention}
                      onChange={u("c6CoversAccidentPrevention")}
                      options={YES_NO}
                    />
                  </FormField>
                </div>
                <FormField label="Other topics covered (optional)" id="c6other">
                  <Input
                    id="c6other"
                    value={data.c6CoversOther}
                    onChange={u("c6CoversOther")}
                    placeholder="e.g. freedom of association, fair wages"
                  />
                </FormField>
              </>
            )}
          </section>

          {/* ══ C7 — SEVERE NEGATIVE HUMAN-RIGHTS INCIDENTS ══════════════════ */}
          <section className="form-section form-section--comprehensive">
            <div className="comprehensive-tag">Comprehensive Module · C7</div>
            <h3>Severe Negative Human-Rights Incidents</h3>
            <p className="section-desc">
              Confirmed incidents in your own workforce and in your value chain
              during the reporting period.
            </p>
            <p className="section-desc" style={{ marginBottom: 0 }}>
              Own workforce — confirmed incidents related to:
            </p>
            <div className="form-grid form-grid--2">
              <FormField label="Child labour">
                <RadioGroup
                  name="c7ChildLabour"
                  value={data.c7ChildLabour}
                  onChange={u("c7ChildLabour")}
                  options={YES_NO}
                />
              </FormField>
              <FormField label="Forced labour">
                <RadioGroup
                  name="c7ForcedLabour"
                  value={data.c7ForcedLabour}
                  onChange={u("c7ForcedLabour")}
                  options={YES_NO}
                />
              </FormField>
              <FormField label="Human trafficking">
                <RadioGroup
                  name="c7Trafficking"
                  value={data.c7Trafficking}
                  onChange={u("c7Trafficking")}
                  options={YES_NO}
                />
              </FormField>
              <FormField label="Discrimination">
                <RadioGroup
                  name="c7Discrimination"
                  value={data.c7Discrimination}
                  onChange={u("c7Discrimination")}
                  options={YES_NO}
                />
              </FormField>
            </div>
            <FormField label="Actions taken to address own-workforce incidents (optional)">
              <textarea
                className="form-textarea"
                rows={2}
                value={data.c7OwnWorkforceActions || ""}
                onChange={(e) =>
                  update({ c7OwnWorkforceActions: e.target.value })
                }
                placeholder="Describe the actions taken in response to any confirmed incident…"
              />
            </FormField>
            <p className="section-desc" style={{ marginBottom: 0 }}>
              Value chain — describe any confirmed incidents (leave blank if
              none):
            </p>
            <FormField label="Workers in the value chain">
              <textarea
                className="form-textarea"
                rows={2}
                value={data.c7ValueChainWorkers || ""}
                onChange={(e) =>
                  update({ c7ValueChainWorkers: e.target.value })
                }
                placeholder="Describe incidents involving value-chain workers…"
              />
            </FormField>
            <FormField label="Affected communities">
              <textarea
                className="form-textarea"
                rows={2}
                value={data.c7ValueChainCommunities || ""}
                onChange={(e) =>
                  update({ c7ValueChainCommunities: e.target.value })
                }
                placeholder="Describe incidents involving affected communities…"
              />
            </FormField>
            <FormField label="Consumers & end-users">
              <textarea
                className="form-textarea"
                rows={2}
                value={data.c7ValueChainConsumers || ""}
                onChange={(e) =>
                  update({ c7ValueChainConsumers: e.target.value })
                }
                placeholder="Describe incidents involving consumers / end-users…"
              />
            </FormField>
          </section>
        </>
      )}
    </div>
  );
}
