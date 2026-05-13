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

// Rough height estimator — used only for packing decisions, not for rendering
function estimateBlockHeight(block) {
  switch (block.type) {
    case 'section-band': return 56
    case 'kpi-row':      return 68
    case 'data-table':   return Math.max(block.rows?.length || 0, 1) * 16 + 14
    case 'subtitle':     return 20
    case 'text-block':   return Math.ceil((block.content?.length || 0) / 90) * 14 + 18
    case 'image':        return 206
    case 'spacer':       return block.height || 16
    default:             return 20
  }
}

// Pack B1-B11 sections onto as few pages as possible.
// A new page is started when the next section wouldn't fit in the remaining space.
function packSections(sections) {
  const USABLE_H = 760 // conservative usable height per page (accounts for footer + margins)
  const SECTION_GAP = 20
  const pages = []
  let cur = null

  for (const sec of sections) {
    const secH = sec.blocks.reduce((h, b) => h + estimateBlockHeight(b), 0)

    if (!cur) {
      cur = { title: sec.title, badge: sec.badge, blocks: [...sec.blocks], usedH: secH }
    } else if (cur.usedH + SECTION_GAP + secH <= USABLE_H) {
      // Fits — append a visual spacer then the section's blocks
      cur.blocks.push({ type: 'spacer', height: SECTION_GAP })
      cur.blocks.push(...sec.blocks)
      cur.usedH += SECTION_GAP + secH
      // Merge display labels (e.g. "B1 · B2")
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
  ]

  const packedPages = packSections(sections)

  // Build a badge → page-number map for the TOC (cover=1, toc=2, content starts at 3)
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
  return { title: 'Contents', badge: '', blocks: [{ type: 'toc', pageMap }] }
}

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
        ['Company Name', data.companyName],
        ['Legal Form', data.legalForm],
        ['Registration', data.registrationNumber],
        ['Sector', data.sector],
        ['NACE Code', data.naceCode],
        ['Reporting Period', data.reportingPeriodStart ? `${data.reportingPeriodStart} — ${data.reportingPeriodEnd}` : ''],
        ['Contact', [data.contactName, data.contactEmail].filter(Boolean).join('  ·  ')],
      )},
      ...(data.companyDescription ? [
        { type: 'subtitle', text: 'About the Company' },
        { type: 'text-block', content: strip(data.companyDescription) },
      ] : []),
    ],
  }
}

function buildB2Page(data) {
  const narrative = [data.esgPolicyDescription, data.boardOversightDescription, data.codeOfConductDescription, data.supplierCodeDescription]
    .map(strip).filter(Boolean).join('\n\n')

  return {
    title: 'B2 — Policies', badge: 'B2',
    blocks: [
      { type: 'section-band', badge: 'B2', title: 'Policies & Commitments' },
      { type: 'data-table', rows: rows(
        ['ESG / Sustainability Policy', data.hasESGPolicy],
        ['Board ESG Oversight', data.hasBoardESGOversight],
        ['Code of Conduct', data.hasCodeOfConduct],
        ['Supplier Code of Conduct', data.hasSupplierCode],
      )},
      ...(narrative ? [
        { type: 'subtitle', text: 'Policy Descriptions' },
        { type: 'text-block', content: narrative },
      ] : []),
    ],
  }
}

function buildB3Page(data) {
  const total = n(data.totalEnergyConsumption)
  const renew = n(data.renewableEnergyConsumption)
  const renewPct = total > 0 ? ((renew / total) * 100).toFixed(1) : null
  const emp = n(data.employeeCount)
  const intensity = total > 0 && emp > 0 ? (total / emp).toFixed(2) : null

  return {
    title: 'B3 — Energy', badge: 'B3',
    blocks: [
      { type: 'section-band', badge: 'B3', title: 'Energy' },
      { type: 'kpi-row', metrics: [
        total && { label: 'Total Energy', value: total, unit: data.energyUnit },
        renew && { label: 'Renewable', value: renew, unit: data.energyUnit },
        renewPct && { label: 'Renew. Share', value: renewPct, unit: '%' },
        intensity && { label: 'Intensity', value: intensity, unit: `${data.energyUnit}/emp` },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Non-Renewable Energy', total > 0 ? `${(total - renew).toFixed(2)} ${data.energyUnit}` : ''],
        ['Energy Management System', data.hasEnergyManagementSystem],
      )},
      ...(data.energyNarrative ? [
        { type: 'subtitle', text: 'Energy Narrative' },
        { type: 'text-block', content: strip(data.energyNarrative) },
      ] : []),
      ...(data.images?.energyImage ? [
        { type: 'image', src: data.images.energyImage, label: 'Energy certificate / utility snapshot' },
      ] : []),
    ],
  }
}

function buildB4Page(data) {
  const s1 = n(data.scope1Emissions), s2 = n(data.scope2Emissions), s3 = n(data.scope3Emissions)
  const total = s1 + s2 + s3
  const emp = n(data.employeeCount)
  const intensity = total > 0 && emp > 0 ? (total / emp).toFixed(2) : null

  return {
    title: 'B4 — GHG', badge: 'B4',
    blocks: [
      { type: 'section-band', badge: 'B4', title: 'GHG Emissions' },
      { type: 'kpi-row', metrics: [
        { label: 'Scope 1', value: s1 || '—', unit: data.ghgUnit },
        { label: 'Scope 2', value: s2 || '—', unit: data.ghgUnit },
        s3 > 0 && { label: 'Scope 3', value: s3, unit: data.ghgUnit },
        total > 0 && { label: 'Total GHG', value: total.toFixed(2), unit: data.ghgUnit },
        intensity && { label: 'Intensity', value: intensity, unit: `${data.ghgUnit}/emp` },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Base Year', data.ghgBaseYear],
        ['Reduction Target', data.ghgReductionTarget],
      )},
      ...([data.methodologyDescription, data.ghgNarrative].map(strip).filter(Boolean).length ? [
        { type: 'subtitle', text: 'Methodology & Narrative' },
        { type: 'text-block', content: [data.methodologyDescription, data.ghgNarrative].map(strip).filter(Boolean).join('\n\n') },
      ] : []),
      ...(data.images?.ghgImage ? [
        { type: 'image', src: data.images.ghgImage, label: 'GHG emissions chart' },
      ] : []),
    ],
  }
}

function buildB5Page(data) {
  const total = n(data.totalWaterWithdrawal)
  const recycled = n(data.waterRecycled)
  const stress = n(data.waterFromStressedAreas)
  const recycledPct = total > 0 && recycled > 0 ? ((recycled / total) * 100).toFixed(1) : null
  const stressPct = total > 0 && stress > 0 ? ((stress / total) * 100).toFixed(1) : null

  return {
    title: 'B5 — Water', badge: 'B5',
    blocks: [
      { type: 'section-band', badge: 'B5', title: 'Water' },
      { type: 'kpi-row', metrics: [
        total && { label: 'Total Withdrawal', value: total, unit: data.waterUnit },
        recycled && { label: 'Recycled', value: recycled, unit: data.waterUnit },
        recycledPct && { label: 'Recycling Rate', value: recycledPct, unit: '%' },
        stressPct && { label: 'Stressed Areas', value: stressPct, unit: '%' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['From Stressed Areas', stress ? `${stress} ${data.waterUnit}` : ''],
        ['Water Policy', data.hasWaterPolicy],
      )},
      ...(data.waterNarrative ? [
        { type: 'subtitle', text: 'Water Narrative' },
        { type: 'text-block', content: strip(data.waterNarrative) },
      ] : []),
    ],
  }
}

function buildB6Page(data) {
  const total = n(data.totalWasteGenerated)
  const haz = n(data.wasteHazardous)
  const rec = n(data.wasteRecycled)
  const recPct = total > 0 && rec > 0 ? ((rec / total) * 100).toFixed(1) : null

  return {
    title: 'B6 — Waste', badge: 'B6',
    blocks: [
      { type: 'section-band', badge: 'B6', title: 'Waste' },
      { type: 'kpi-row', metrics: [
        total && { label: 'Total Waste', value: total, unit: data.wasteUnit },
        haz && { label: 'Hazardous', value: haz, unit: data.wasteUnit },
        total && haz && { label: 'Non-Hazardous', value: (total - haz).toFixed(3), unit: data.wasteUnit },
        recPct && { label: 'Recycling Rate', value: recPct, unit: '%' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Recycled / Recovered', data.wasteRecycled ? `${data.wasteRecycled} ${data.wasteUnit}` : ''],
        ['Disposed to Landfill', data.wasteDisposedLandfill ? `${data.wasteDisposedLandfill} ${data.wasteUnit}` : ''],
        ['Reduction Target', data.hasWasteReductionTarget],
      )},
      ...(data.wasteNarrative ? [
        { type: 'subtitle', text: 'Waste Narrative' },
        { type: 'text-block', content: strip(data.wasteNarrative) },
      ] : []),
    ],
  }
}

function buildB7Page(data) {
  const total = n(data.totalEmployees)
  const female = n(data.femaleEmployees)
  const perm = n(data.permanentEmployees)
  const femalePct = total > 0 && female > 0 ? ((female / total) * 100).toFixed(1) : null
  const permPct = total > 0 && perm > 0 ? ((perm / total) * 100).toFixed(1) : null

  return {
    title: 'B7 — Workforce', badge: 'B7',
    blocks: [
      { type: 'section-band', badge: 'B7', title: 'Own Workforce' },
      { type: 'kpi-row', metrics: [
        total && { label: 'Total Employees', value: total, unit: 'headcount' },
        perm && { label: 'Permanent', value: perm, unit: permPct ? `${permPct}%` : '' },
        female && { label: 'Female', value: female, unit: femalePct ? `${femalePct}%` : '' },
        data.newHires && { label: 'New Hires', value: data.newHires, unit: 'this year' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Full-Time / Part-Time', data.fullTimeEmployees ? `${data.fullTimeEmployees} / ${data.partTimeEmployees || '—'}` : ''],
        ['Male / Female / Other', data.maleEmployees ? `${data.maleEmployees} / ${data.femaleEmployees || '—'} / ${data.otherGenderEmployees || '—'}` : ''],
        ['Age <30 / 30–50 / >50', data.employeesUnder30 ? `${data.employeesUnder30} / ${data.employees30to50 || '—'} / ${data.employeesOver50 || '—'}` : ''],
        ['Employee Turnover', data.employeeTurnover],
      )},
      ...(data.workforceNarrative ? [
        { type: 'subtitle', text: 'Workforce Narrative' },
        { type: 'text-block', content: strip(data.workforceNarrative) },
      ] : []),
      ...(data.images?.workforceImage ? [
        { type: 'image', src: data.images.workforceImage, label: 'Team / workplace photo' },
      ] : []),
    ],
  }
}

function buildB8Page(data) {
  const inj = n(data.workRelatedInjuries)
  const ld = n(data.lostDays)
  const emp = n(data.totalEmployees)
  const hrs = emp * 2000
  const ifr = inj > 0 && hrs > 0 ? ((inj * 1e6) / hrs).toFixed(2) : null

  return {
    title: 'B8 — Safety', badge: 'B8',
    blocks: [
      { type: 'section-band', badge: 'B8', title: 'Health & Safety' },
      { type: 'kpi-row', metrics: [
        { label: 'Injuries', value: data.workRelatedInjuries || '0', unit: 'cases' },
        { label: 'Fatalities', value: data.workRelatedFatalities || '0', unit: 'cases' },
        ld && { label: 'Lost Days', value: ld, unit: 'days' },
        ifr && { label: 'Freq. Rate', value: ifr, unit: '/M hrs' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['OHS Management System', data.hasOHSManagementSystem],
        ['OHS Certification', data.ohsCertification],
      )},
      ...(data.safetyNarrative ? [
        { type: 'subtitle', text: 'Safety Narrative' },
        { type: 'text-block', content: strip(data.safetyNarrative) },
      ] : []),
    ],
  }
}

function buildB9Page(data) {
  const mAvg = n(data.maleAvgSalary), fAvg = n(data.femaleAvgSalary)
  const gap = mAvg > 0 && fAvg > 0 ? (((mAvg - fAvg) / mAvg) * 100).toFixed(1) : null

  return {
    title: 'B9 — Pay', badge: 'B9',
    blocks: [
      { type: 'section-band', badge: 'B9', title: 'Pay & Benefits' },
      { type: 'kpi-row', metrics: [
        mAvg && { label: 'Male Avg. Salary', value: mAvg.toLocaleString(), unit: data.currency },
        fAvg && { label: 'Female Avg. Salary', value: fAvg.toLocaleString(), unit: data.currency },
        gap !== null && { label: 'Pay Gap', value: `${gap}%`, unit: 'gender' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Min. Wage Compliance', data.minimumWageCompliance],
        ['Living Wage Policy', data.livingWagePolicy],
      )},
      ...([data.benefitsDescription, data.payNarrative].map(strip).filter(Boolean).length ? [
        { type: 'subtitle', text: 'Benefits & Narrative' },
        { type: 'text-block', content: [data.benefitsDescription, data.payNarrative].map(strip).filter(Boolean).join('\n\n') },
      ] : []),
    ],
  }
}

function buildB10Page(data) {
  return {
    title: 'B10 — Social', badge: 'B10',
    blocks: [
      { type: 'section-band', badge: 'B10', title: 'Social Matters' },
      { type: 'kpi-row', metrics: [
        data.avgTrainingHours && { label: 'Avg Training Hours', value: data.avgTrainingHours, unit: 'hrs/emp' },
        data.trainingInvestment && { label: 'Training Investment', value: Number(data.trainingInvestment).toLocaleString(), unit: data.currency },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Anti-Discrimination Policy', data.hasAntiDiscriminationPolicy],
      )},
      ...([data.communityEngagement, data.socialNarrative].map(strip).filter(Boolean).length ? [
        { type: 'subtitle', text: 'Social Narrative' },
        { type: 'text-block', content: [data.communityEngagement, data.socialNarrative].map(strip).filter(Boolean).join('\n\n') },
      ] : []),
    ],
  }
}

function buildB11Page(data) {
  const bsz = n(data.boardSize)
  const bind = n(data.boardIndependentMembers)
  const indPct = bsz > 0 && bind > 0 ? ((bind / bsz) * 100).toFixed(0) : null

  return {
    title: 'B11 — Governance', badge: 'B11',
    blocks: [
      { type: 'section-band', badge: 'B11', title: 'Governance' },
      { type: 'kpi-row', metrics: [
        bsz && { label: 'Board Size', value: bsz, unit: 'members' },
        indPct && { label: 'Independent', value: `${indPct}%`, unit: 'of board' },
        data.boardFemaleMembersPercent && { label: 'Female Board', value: data.boardFemaleMembersPercent, unit: '%' },
      ].filter(Boolean) },
      { type: 'data-table', rows: rows(
        ['Anti-Corruption Policy', data.hasAntiCorruptionPolicy],
        ['Whistleblower Mechanism', data.whistleblowerMechanism],
        ['Data Privacy Policy', data.dataPrivacyPolicy],
      )},
      ...([data.taxTransparency, data.governanceNarrative].map(strip).filter(Boolean).length ? [
        { type: 'subtitle', text: 'Governance Narrative' },
        { type: 'text-block', content: [data.taxTransparency, data.governanceNarrative].map(strip).filter(Boolean).join('\n\n') },
      ] : []),
    ],
  }
}
