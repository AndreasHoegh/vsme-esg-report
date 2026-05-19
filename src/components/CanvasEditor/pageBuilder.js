// Converts form data into page-block specifications.
// Blocks are plain objects — no Fabric instances here.

function strip(html) {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

function n(v) { return parseFloat(v) || 0 }

function rows(...pairs) {
  return pairs.filter(([, v]) => v !== '' && v !== null && v !== undefined)
              .map(([label, value]) => ({ label, value: String(value) }))
}

function yesNo(v) {
  if (v === 'yes') return 'Yes'
  if (v === 'no') return 'No'
  if (v === 'in-progress' || v === 'in_progress') return 'In Progress'
  return v || ''
}

// Rough height estimator — used only for packing decisions, not for rendering
function estimateBlockHeight(block) {
  switch (block.type) {
    case 'section-band':   return 66
    case 'kpi-row':        return 84
    case 'data-table':     return Math.max(block.rows?.length || 0, 1) * 18 + 14
    case 'policy-matrix':  return (block.rows?.length || 0) * 22 + 10
    case 'subtitle':       return 24
    case 'text-block':     return Math.ceil((block.content?.length || 0) / 90) * 14 + 22
    case 'image':          return 206
    case 'spacer':         return block.height || 16
    default:               return 20
  }
}

// Pack B1–B11 sections onto as few pages as possible.
// A new page is started when the next section wouldn't fit in the remaining space.
function packSections(sections) {
  const USABLE_H = 750 // conservative usable height per page (accounts for footer + margins)
  const SECTION_GAP = 20
  const pages = []
  let cur = null

  for (const sec of sections) {
    const secH = sec.blocks.reduce((h, b) => h + estimateBlockHeight(b), 0)

    if (!cur) {
      cur = { title: sec.title, badge: sec.badge, blocks: [...sec.blocks], usedH: secH }
    } else if (cur.usedH + SECTION_GAP + secH <= USABLE_H) {
      cur.blocks.push({ type: 'spacer', height: SECTION_GAP })
      cur.blocks.push(...sec.blocks)
      cur.usedH += SECTION_GAP + secH
      const shortLabel = sec.badge
      cur.title = cur.title.replace(/ — .*/, '') + ' · ' + shortLabel
      cur.badge = cur.badge + '/' + shortLabel
    } else {
      pages.push(cur)
      cur = { title: sec.title, badge: sec.badge, blocks: [...sec.blocks], usedH: secH }
    }
  }

  if (cur) pages.push(cur)
  return pages
}

// ─── Top-level builder ────────────────────────────────────────────────────────

export function buildAllPages(data) {
  const sections = [
    buildB1Page(data), buildB2Page(data), buildB3Page(data), buildB4Page(data),
    buildB5Page(data), buildB6Page(data), buildB7Page(data), buildB8Page(data),
    buildB9Page(data), buildB10Page(data), buildB11Page(data),
  ].filter(Boolean)

  const packedPages = packSections(sections)

  // Badge → page-number map for the TOC (cover=1, toc=2, content starts at 3)
  const pageMap = {}
  packedPages.forEach((page, i) => {
    page.blocks
      .filter(b => b.type === 'section-band')
      .forEach(b => { pageMap[b.badge] = i + 3 })
  })

  return [
    buildCoverPage(data),
    buildTOCPage(pageMap),
    ...packedPages,
  ]
}

// ─── Individual section builders ─────────────────────────────────────────────

function buildCoverPage(data) {
  return { title: 'Cover', badge: '', blocks: [{ type: 'cover', data }] }
}

function buildTOCPage(pageMap = {}) {
  return { title: 'Contents', badge: '', blocks: [{ type: 'toc', pageMap, presentBadges: new Set(Object.keys(pageMap)) }] }
}

// B1 — General Information
function buildB1Page(data) {
  const kpis = [
    data.employeeCount && { label: 'Employees', value: data.employeeCount, unit: 'FTE' },
    data.reportingYear && { label: 'Year', value: data.reportingYear, unit: '' },
    data.country       && { label: 'Country', value: data.country, unit: '' },
    data.currency      && { label: 'Currency', value: data.currency, unit: '' },
  ].filter(Boolean)

  return {
    title: 'B1 — General Info', badge: 'B1',
    blocks: [
      { type: 'section-band', badge: 'B1', title: 'General Information' },
      ...(kpis.length ? [{ type: 'kpi-row', metrics: kpis }] : []),
      { type: 'data-table', rows: rows(
        ['Company Name',     data.companyName],
        ['Legal Form',       data.legalForm],
        ['Registration No.', data.registrationNumber],
        ['Sector',           data.sector],
        ['NACE Code',        data.naceCode],
        ['Reporting Period', data.reportingPeriodStart ? `${data.reportingPeriodStart} – ${data.reportingPeriodEnd}` : ''],
        ['Reporting Basis',  data.reportingBasis === 'individual' ? 'Individual' : data.reportingBasis === 'consolidated' ? 'Consolidated' : ''],
        ['Balance Sheet',    data.balanceSum ? `${Number(data.balanceSum).toLocaleString()} ${data.currency || ''}` : ''],
        ['Revenue',          data.revenue ? `${Number(data.revenue).toLocaleString()} ${data.currency || ''}` : ''],
        ['Contact',          [data.contactName, data.contactEmail].filter(Boolean).join('  ·  ')],
      )},
      ...(data.companyDescription ? [
        { type: 'subtitle', text: 'About the Company' },
        { type: 'text-block', content: strip(data.companyDescription) },
      ] : []),
    ],
  }
}

// B2 — Policies & Commitments
function buildB2Page(data) {
  const POLICY_FIELDS = ['policyClimate','policyPollution','policyWaterMarine','policyBiodiversity','policyCircular','policyOwnWorkforce','policyValueChain','policyCommunities','policyConsumers','policyGovernance']
  if (!POLICY_FIELDS.some(f => data[f])) return null

  const TOPICS = [
    ['Climate Change',   'policyClimate',     'policyClimatePublic',     'policyClimateTargets'],
    ['Pollution',        'policyPollution',    'policyPollutionPublic',   'policyPollutionTargets'],
    ['Water & Marine',   'policyWaterMarine',  'policyWaterMarinePublic', 'policyWaterMarineTargets'],
    ['Biodiversity',     'policyBiodiversity', 'policyBiodiversityPublic','policyBiodiversityTargets'],
    ['Circular Economy', 'policyCircular',     'policyCircularPublic',    'policyCircularTargets'],
    ['Own Workforce',    'policyOwnWorkforce', 'policyOwnWorkforcePublic','policyOwnWorkforceTargets'],
    ['Value Chain',      'policyValueChain',   'policyValueChainPublic',  'policyValueChainTargets'],
    ['Communities',      'policyCommunities',  'policyCommunitiesPublic', 'policyCommunitiesTargets'],
    ['Consumers',        'policyConsumers',    'policyConsumersPublic',   'policyConsumersTargets'],
    ['Governance',       'policyGovernance',   'policyGovernancePublic',  'policyGovernanceTargets'],
  ]

  const withPolicy  = TOPICS.filter(([, f])    => data[f] === 'yes' || data[f] === 'in-progress' || data[f] === 'in_progress').length
  const publicCount = TOPICS.filter(([,, pf])  => data[pf] === 'yes').length
  const withTargets = TOPICS.filter(([,,, tf]) => data[tf] === 'yes').length

  return {
    title: 'B2 — Policies', badge: 'B2',
    blocks: [
      { type: 'section-band', badge: 'B2', title: 'Policies & Commitments' },
      { type: 'kpi-row', metrics: [
        { label: 'Policies Adopted', value: withPolicy,  unit: `of ${TOPICS.length} topics` },
        { label: 'Publicly Available', value: publicCount, unit: 'policies' },
        { label: 'With Targets', value: withTargets, unit: 'topics' },
      ] },
      { type: 'subtitle', text: 'Policy Matrix' },
      { type: 'policy-matrix', rows: TOPICS.map(([label, f, pf, tf]) => ({
        label,
        status: data[f] || '',
        isPublic: data[pf] === 'yes',
        hasTargets: data[tf] === 'yes',
      })) },
    ],
  }
}

// B3 — Energy & GHG Emissions
function buildB3Page(data) {
  if (!data.totalEnergyConsumption && !data.renewableEnergyConsumption && !data.scope1Emissions && !data.scope2Emissions && !data.scope3Emissions && !data.energyNarrative && !data.ghgNarrative) return null

  const total  = n(data.totalEnergyConsumption)
  const renew  = n(data.renewableEnergyConsumption)
  const renewPct = total > 0 ? ((renew / total) * 100).toFixed(1) : null
  const emp    = n(data.employeeCount)
  const energyIntensity = total > 0 && emp > 0 ? (total / emp).toFixed(2) : null

  const s1 = n(data.scope1Emissions), s2 = n(data.scope2Emissions), s3 = n(data.scope3Emissions)
  const totalGHG   = s1 + s2 + s3
  const ghgIntEmp  = totalGHG > 0 && emp > 0 ? (totalGHG / emp).toFixed(2) : null

  return {
    title: 'B3 — Energy & GHG', badge: 'B3',
    blocks: [
      { type: 'section-band', badge: 'B3', title: 'Energy & GHG Emissions' },

      { type: 'subtitle', text: 'Energy Consumption' },
      { type: 'kpi-row', metrics: [
        total && { label: 'Total Energy', value: total, unit: data.energyUnit || 'MWh' },
        renew && { label: 'Renewable', value: renew, unit: data.energyUnit || 'MWh' },
        renewPct && { label: 'Renew. Share', value: renewPct, unit: '%' },
        energyIntensity && { label: 'Intensity', value: energyIntensity, unit: `${data.energyUnit || 'MWh'}/emp` },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Non-Renewable Energy',      total > 0 ? `${(total - renew).toFixed(2)} ${data.energyUnit || 'MWh'}` : ''],
        ['Electricity',               data.electricityConsumption ? `${data.electricityConsumption} ${data.energyUnit || 'MWh'}` : ''],
        ['Natural Gas',               data.naturalGasConsumption  ? `${data.naturalGasConsumption} ${data.gasUnit || 'm³'}` : ''],
        ['Fuel Oil / Diesel',         data.fuelOilConsumption     ? `${data.fuelOilConsumption} ${data.fuelOilUnit || 'L'}` : ''],
        ['District Heating/Cooling',  data.districtHeatingConsumption ? `${data.districtHeatingConsumption} ${data.districtUnit || 'MWh'}` : ''],
        ['Energy Management System',  yesNo(data.hasEnergyManagementSystem)],
        ['Energy Reduction Target',   data.energyReductionTarget],
      )},
      ...(data.energyNarrative ? [
        { type: 'subtitle', text: 'Energy Narrative' },
        { type: 'text-block', content: strip(data.energyNarrative) },
      ] : []),

      { type: 'subtitle', text: 'GHG Emissions' },
      { type: 'kpi-row', metrics: [
        { label: 'Scope 1', value: s1 || '0', unit: data.ghgUnit || 'tCO2e' },
        { label: 'Scope 2', value: s2 || '0', unit: data.ghgUnit || 'tCO2e' },
        s3 > 0 && { label: 'Scope 3', value: s3, unit: data.ghgUnit || 'tCO2e' },
        totalGHG > 0 && { label: 'Total GHG', value: totalGHG.toFixed(2), unit: data.ghgUnit || 'tCO2e' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['GHG Intensity (per emp)', ghgIntEmp ? `${ghgIntEmp} ${data.ghgUnit || 'tCO2e'}/emp` : ''],
        ['GHG Base Year',          data.ghgBaseYear],
        ['GHG Reduction Target',   data.ghgReductionTarget],
      )},
      ...([data.methodologyDescription, data.ghgNarrative].map(strip).filter(Boolean).length ? [
        { type: 'subtitle', text: 'Methodology & GHG Narrative' },
        { type: 'text-block', content: [data.methodologyDescription, data.ghgNarrative].map(strip).filter(Boolean).join('\n\n') },
      ] : []),
      ...(data.images?.energyImage ? [
        { type: 'image', src: data.images.energyImage, label: 'Energy / GHG chart' },
      ] : []),
    ],
  }
}

// B4 — Pollution
function buildB4Page(data) {
  const hasData = data.hasPollutionReporting === 'yes' || data.hasPollutionReporting === 'in-progress' || data.hasPollutionReporting === 'in_progress' || data.pollutionDescription || data.pollutionNarrative
  if (!hasData) return null

  return {
    title: 'B4 — Pollution', badge: 'B4',
    blocks: [
      { type: 'section-band', badge: 'B4', title: 'Pollution' },
      { type: 'data-table', rows: rows(
        ['Reports on Pollution', yesNo(data.hasPollutionReporting)],
      )},
      ...(data.hasPollutionReporting === 'yes' && data.pollutionDescription ? [
        { type: 'subtitle', text: 'Pollution Sources & Measures' },
        { type: 'text-block', content: strip(data.pollutionDescription) },
      ] : []),
      ...(data.pollutionNarrative ? [
        { type: 'subtitle', text: 'Pollution Narrative' },
        { type: 'text-block', content: strip(data.pollutionNarrative) },
      ] : []),
    ],
  }
}

// B5 — Biodiversity
function buildB5Page(data) {
  const hasData = data.hasBiodiversitySites === 'yes' || data.hasBiodiversitySites === 'in-progress' || data.hasBiodiversitySites === 'in_progress' || data.biodiversityDescription || data.landUseTotal || data.biodiversityNarrative
  if (!hasData) return null

  return {
    title: 'B5 — Biodiversity', badge: 'B5',
    blocks: [
      { type: 'section-band', badge: 'B5', title: 'Biodiversity' },
      { type: 'data-table', rows: rows(
        ['Biodiversity-Sensitive Sites', yesNo(data.hasBiodiversitySites)],
        ['Total Land Use',               data.landUseTotal     ? `${data.landUseTotal} ha` : ''],
        ['Land in Sensitive Areas',      data.landUseSensitive ? `${data.landUseSensitive} ha` : ''],
      )},
      ...(data.hasBiodiversitySites === 'yes' && data.biodiversityDescription ? [
        { type: 'subtitle', text: 'Biodiversity Description' },
        { type: 'text-block', content: strip(data.biodiversityDescription) },
      ] : []),
      ...(data.biodiversityNarrative ? [
        { type: 'subtitle', text: 'Biodiversity Narrative' },
        { type: 'text-block', content: strip(data.biodiversityNarrative) },
      ] : []),
    ],
  }
}

// B6 — Water
function buildB6Page(data) {
  if (!data.totalWaterWithdrawal && !data.waterDischarge && !data.waterRecycled && !data.waterNarrative) return null

  const total    = n(data.totalWaterWithdrawal)
  const discharge = n(data.waterDischarge)
  const recycled = n(data.waterRecycled)
  const stress   = n(data.waterFromStressedAreas)
  const consumption = total - discharge
  const recycledPct = total > 0 && recycled > 0 ? ((recycled / total) * 100).toFixed(1) : null
  const stressPct   = total > 0 && stress  > 0 ? ((stress  / total) * 100).toFixed(1) : null
  const wUnit = data.waterUnit || 'm³'

  return {
    title: 'B6 — Water', badge: 'B6',
    blocks: [
      { type: 'section-band', badge: 'B6', title: 'Water' },
      { type: 'kpi-row', metrics: [
        total      && { label: 'Total Withdrawal', value: total, unit: wUnit },
        discharge  && { label: 'Discharge', value: discharge, unit: wUnit },
        consumption > 0 && { label: 'Consumption', value: consumption.toFixed(2), unit: wUnit },
        recycledPct && { label: 'Recycling Rate', value: recycledPct, unit: '%' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['From Stressed Areas',     stress ? `${stress} ${wUnit}${stressPct ? ` (${stressPct}%)` : ''}` : ''],
        ['Discharge Destination',   data.waterDischargeDestination],
      )},
      ...(data.waterNarrative ? [
        { type: 'subtitle', text: 'Water Narrative' },
        { type: 'text-block', content: strip(data.waterNarrative) },
      ] : []),
    ],
  }
}

// B7 — Resources & Circular Economy
function buildB7Page(data) {
  if ((!data.wasteTypes || data.wasteTypes.length === 0) && data.usesCircularEconomy !== 'yes' && !data.circularEconomyDescription && !data.wasteNarrative) return null

  const wUnit      = data.wasteUnit || 'tonnes'
  const wasteTypes = data.wasteTypes || []
  const total      = wasteTypes.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const totalHaz   = wasteTypes.filter(e => e.hazardous).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const totalRec   = wasteTypes.reduce((s, e) => s + (parseFloat(e.recycled) || 0), 0)
  const recPct     = total > 0 && totalRec > 0 ? ((totalRec / total) * 100).toFixed(1) : null
  const hazPct     = total > 0 && totalHaz > 0 ? ((totalHaz / total) * 100).toFixed(1) : null

  const wasteRows = wasteTypes.map(e => {
    const name = e.typeKey === 'Other (specify)' ? (e.customName || 'Other') : (e.typeKey || 'Unknown')
    const amt  = e.amount ? `${parseFloat(e.amount).toFixed(2)} ${wUnit}` : '—'
    const rec  = e.recycled ? ` · recycled: ${parseFloat(e.recycled).toFixed(2)} ${wUnit}` : ''
    const haz  = e.hazardous ? ' ⚠' : ''
    return { label: name + haz, value: amt + rec }
  })

  return {
    title: 'B7 — Waste & Circular', badge: 'B7',
    blocks: [
      { type: 'section-band', badge: 'B7', title: 'Resources & Circular Economy' },
      { type: 'data-table', rows: rows(
        ['Circular Economy Approach', yesNo(data.usesCircularEconomy)],
      )},
      ...(data.usesCircularEconomy === 'yes' && data.circularEconomyDescription ? [
        { type: 'subtitle', text: 'Circular Economy' },
        { type: 'text-block', content: strip(data.circularEconomyDescription) },
      ] : []),

      ...(wasteTypes.length > 0 ? [
        { type: 'subtitle', text: 'Waste' },
        { type: 'kpi-row', metrics: [
          total   && { label: 'Total Waste',     value: total.toFixed(2),  unit: wUnit },
          totalHaz && { label: 'Hazardous',       value: totalHaz.toFixed(2), unit: wUnit },
          hazPct  && { label: 'Hazardous Share',  value: hazPct,            unit: '%' },
          recPct  && { label: 'Recycling Rate',   value: recPct,            unit: '%' },
        ].filter(Boolean) },
        { type: 'subtitle', text: 'Waste by Type' },
        { type: 'data-table', rows: wasteRows },
      ] : []),

      ...(data.wasteNarrative ? [
        { type: 'subtitle', text: 'Waste Narrative' },
        { type: 'text-block', content: strip(data.wasteNarrative) },
      ] : []),
    ],
  }
}

// B8 — Own Workforce
function buildB8Page(data) {
  if (!data.totalEmployees && !data.permanentEmployees && !data.maleEmployees && !data.femaleEmployees && !data.workforceNarrative) return null

  const total  = n(data.totalEmployees)
  const female = n(data.femaleEmployees)
  const perm   = n(data.permanentEmployees)
  const femalePct = total > 0 && female > 0 ? ((female / total) * 100).toFixed(1) : null
  const permPct   = total > 0 && perm   > 0 ? ((perm   / total) * 100).toFixed(1) : null

  return {
    title: 'B8 — Workforce', badge: 'B8',
    blocks: [
      { type: 'section-band', badge: 'B8', title: 'Own Workforce' },
      { type: 'kpi-row', metrics: [
        total  && { label: 'Total Employees', value: total, unit: 'headcount' },
        perm   && { label: 'Permanent', value: perm,   unit: permPct   ? `${permPct}%`   : '' },
        female && { label: 'Female',    value: female, unit: femalePct ? `${femalePct}%` : '' },
        data.newHires && { label: 'New Hires', value: data.newHires, unit: 'this year' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Permanent / Temporary', data.permanentEmployees ? `${data.permanentEmployees} / ${data.temporaryEmployees || '—'}` : ''],
        ['Full-Time / Part-Time', data.fullTimeEmployees  ? `${data.fullTimeEmployees} / ${data.partTimeEmployees || '—'}` : ''],
        ['Male / Female / Other', data.maleEmployees      ? `${data.maleEmployees} / ${data.femaleEmployees || '—'} / ${data.otherGenderEmployees || '—'}` : ''],
        ['Age <30 / 30–50 / >50', data.employeesUnder30  ? `${data.employeesUnder30} / ${data.employees30to50 || '—'} / ${data.employeesOver50 || '—'}` : ''],
        ['Employee Turnover',     data.employeeTurnover],
        ['Non-Employee Workers',  data.nonEmployeeWorkers],
      )},
      ...(data.workforceNarrative ? [
        { type: 'subtitle', text: 'Workforce Narrative' },
        { type: 'text-block', content: strip(data.workforceNarrative) },
      ] : []),
    ],
  }
}

// B9 — Health & Safety
function buildB9Page(data) {
  if (data.workRelatedInjuries === '' && data.workRelatedFatalities === '' && !data.sickLeaveDays && data.hasOHSManagementSystem !== 'yes' && !data.safetyNarrative) return null

  const inj = n(data.workRelatedInjuries)
  const emp = n(data.totalEmployees)
  // VSME frequency rate: (injuries × 200,000) / (employees × 2,000) = injuries × 100 / employees
  const freqRate = inj > 0 && emp > 0 ? (inj * 100 / emp).toFixed(2) : null

  return {
    title: 'B9 — Health & Safety', badge: 'B9',
    blocks: [
      { type: 'section-band', badge: 'B9', title: 'Health & Safety' },
      { type: 'kpi-row', metrics: [
        { label: 'Injuries',              value: data.workRelatedInjuries  || '0', unit: 'cases' },
        { label: 'Fatalities (Injury)',   value: data.workRelatedFatalities || '0', unit: 'cases' },
        { label: 'Fatalities (Ill Health)', value: data.fatalitiesFromIllHealth || '0', unit: 'cases' },
        freqRate && { label: 'Frequency Rate', value: freqRate, unit: '/100 emp' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Work-Related Ill Health',  data.workRelatedIllHealth],
        ['Sick Leave Days',          data.sickLeaveDays],
        ['Lost Days',                data.lostDays],
        ['OHS Management System',    yesNo(data.hasOHSManagementSystem)],
        ['OHS Certification',        data.ohsCertification],
      )},
      ...(data.safetyNarrative ? [
        { type: 'subtitle', text: 'Safety Narrative' },
        { type: 'text-block', content: strip(data.safetyNarrative) },
      ] : []),
    ],
  }
}

// B10 — Pay & Training
function buildB10Page(data) {
  if (!data.minimumWageCompliance && !data.avgTrainingHours && !data.collectiveBargainingCoverage && !data.maleAvgSalary && !data.femaleAvgSalary && !data.payNarrative) return null

  const mAvg = n(data.maleAvgSalary), fAvg = n(data.femaleAvgSalary)
  const gap  = mAvg > 0 && fAvg > 0 ? (((mAvg - fAvg) / mAvg) * 100).toFixed(1) : null
  const cur  = data.currency || ''

  return {
    title: 'B10 — Pay & Training', badge: 'B10',
    blocks: [
      { type: 'section-band', badge: 'B10', title: 'Pay & Training' },
      { type: 'kpi-row', metrics: [
        data.avgTrainingHours       && { label: 'Avg Training Hrs', value: data.avgTrainingHours, unit: 'hrs/emp' },
        data.avgTrainingHoursMale   && { label: 'Training (Male)',   value: data.avgTrainingHoursMale,   unit: 'hrs/emp' },
        data.avgTrainingHoursFemale && { label: 'Training (Female)', value: data.avgTrainingHoursFemale, unit: 'hrs/emp' },
        gap !== null && { label: 'Gender Pay Gap', value: `${gap}%`, unit: 'M vs F' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Min. Wage Compliance',           yesNo(data.minimumWageCompliance)],
        ['Collective Bargaining Coverage', data.collectiveBargainingCoverage ? `${data.collectiveBargainingCoverage}%` : ''],
        ['Male Avg. Salary',              mAvg ? `${mAvg.toLocaleString()} ${cur}` : ''],
        ['Female Avg. Salary',            fAvg ? `${fAvg.toLocaleString()} ${cur}` : ''],
        ['Training Investment',           data.trainingInvestment ? `${Number(data.trainingInvestment).toLocaleString()} ${cur}` : ''],
      )},
      ...(data.payNarrative ? [
        { type: 'subtitle', text: 'Pay & Training Narrative' },
        { type: 'text-block', content: strip(data.payNarrative) },
      ] : []),
    ],
  }
}

// B11 — Corporate Conduct
function buildB11Page(data) {
  if (data.corruptionConvictions === '' && data.corruptionFinesTotal === '' && !data.corruptionNarrative) return null

  const convictions = n(data.corruptionConvictions)
  const fines       = n(data.corruptionFinesTotal)

  return {
    title: 'B11 — Corporate Conduct', badge: 'B11',
    blocks: [
      { type: 'section-band', badge: 'B11', title: 'Corporate Conduct' },
      { type: 'kpi-row', metrics: [
        { label: 'Corruption Convictions', value: convictions || '0', unit: 'cases' },
        { label: 'Corruption Fines', value: fines ? fines.toLocaleString() : '0', unit: data.currency || '' },
      ] },
      ...(data.corruptionNarrative ? [
        { type: 'subtitle', text: 'Anti-Corruption Narrative' },
        { type: 'text-block', content: strip(data.corruptionNarrative) },
      ] : []),
    ],
  }
}
