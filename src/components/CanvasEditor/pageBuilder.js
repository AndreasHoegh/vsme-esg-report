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
    case 'section-band':       return 58  // actual applyBlock return: y+58
    case 'kpi-row':            return 76  // actual: bh(64)+12=76
    case 'data-table': {
      const n = block.rows?.length || 0
      const step = block.columns === 1 ? n : Math.ceil(n / 2)
      return Math.max(step, 1) * 20 + 14
    }
    case 'policy-matrix':      return (block.rows?.length || 0) * 22 + (block.skipped?.length ? 20 : 0) + 10
    case 'subtitle':           return 30
    case 'text-block':         return Math.ceil((block.content?.length || 0) / 120) * 14 + 22
    case 'photo-placeholder':  return (block.height || 160) + 24
    case 'text-photo':         return (block.height || 160) + 24
    case 'esg-section-cover':  return 595
    case 'sdg-grid': {
      // Only selected goals appear; 4 per row, ≤130px tall tiles
      const count = (block.selectedGoals || []).length
      if (!count) return 0
      const perRow = count <= 12 ? 4 : 5
      const numRows = Math.ceil(count / perRow)
      return numRows * 140 + (numRows - 1) * 10
    }
    case 'image':              return 220
    case 'spacer':             return block.height || 16
    default:                   return 20
  }
}

// Split blocks into [fits-within-maxH, remainder].
// Always includes at least one block in the first part.
// Never ends a chunk on a bare subtitle — keeps subtitle with whatever follows it.
function splitAt(blocks, maxH) {
  let i = 0, h = 0
  while (i < blocks.length) {
    const bh = estimateBlockHeight(blocks[i])
    if (i > 0 && h + bh > maxH) break
    h += bh; i++
  }
  let n = Math.max(i, 1)
  // Pull back past any trailing subtitle so it stays with its content
  while (n > 1 && blocks[n - 1]?.type === 'subtitle') n--
  return [blocks.slice(0, n), blocks.slice(n)]
}

// Pack B1–B11 sections onto pages, allowing large sections to span multiple pages.
// Small sections are merged with adjacent ones when space permits.
function packSections(sections) {
  const USABLE_H    = 550  // first page of a section (starts at y=0)
  const CONT_H      = 510  // continuation pages (start at y=40 due to top margin)
  const SECTION_GAP = 20
  // Only attempt to overflow a section onto the current page if this much space remains.
  // Prevents splitting after just a section-band header with no content below it.
  const MIN_SPLIT_H = 140

  const pages = []
  let cur = null

  const flush = () => { if (cur) { pages.push(cur); cur = null } }

  const merge = (title, badge, blocks) => {
    const h = blocks.reduce((s, b) => s + estimateBlockHeight(b), 0)
    if (!cur) {
      cur = { title, badge, blocks: [...blocks], usedH: h }
    } else {
      cur.blocks.push({ type: 'spacer', height: SECTION_GAP })
      cur.blocks.push(...blocks)
      cur.usedH += SECTION_GAP + h
      cur.title = cur.title.replace(/ · .*$/, '') + ' · ' + badge
      cur.badge = cur.badge + '/' + badge
    }
  }

  // Place all blocks for a section, splitting across as many pages as needed.
  // firstMaxH is the budget for the first chunk (may be smaller if filling a partial page).
  const placeAll = (title, badge, blocks, firstMaxH) => {
    let remaining = blocks
    let maxH = firstMaxH
    while (remaining.length) {
      const [chunk, rest] = splitAt(remaining, maxH)
      merge(title, badge, chunk)
      if (rest.length) flush()
      remaining = rest
      maxH = CONT_H  // all pages after the first chunk are continuation pages (y=40 offset)
    }
  }

  for (const sec of sections) {
    const secH = sec.blocks.reduce((s, b) => s + estimateBlockHeight(b), 0)
    const avail = cur ? USABLE_H - cur.usedH - SECTION_GAP : USABLE_H

    if (secH <= avail) {
      // Whole section fits in the remaining space on the current page
      merge(sec.title, sec.badge, sec.blocks)
    } else if (avail >= MIN_SPLIT_H) {
      // Current page has meaningful space — fill it with the start of this section,
      // then continue the rest on subsequent pages
      placeAll(sec.title, sec.badge, sec.blocks, avail)
    } else {
      // Too little room left — start a fresh page for this section
      flush()
      placeAll(sec.title, sec.badge, sec.blocks, USABLE_H)
    }
  }

  flush()
  return pages
}

// ─── ESG divider page ─────────────────────────────────────────────────────────

function buildESGDividerPage(letter, title, description, phId, imageSrc) {
  return {
    title: `${letter} — ${title}`,
    badge: '',
    blocks: [{ type: 'esg-section-cover', letter, title, description, phId, imageSrc }],
  }
}

// ─── Top-level builder ────────────────────────────────────────────────────────

export function buildAllPages(data) {
  const ex = new Set(data.excludedSections || [])

  // Pack each ESG category's sections independently so they don't bleed across dividers
  const generalSections = [
    buildB1Page(data),
    ex.has('B2') ? null : buildB2Page(data),
  ].filter(Boolean)
  const eSections = [
    ex.has('B3') ? null : buildB3Page(data),
    ex.has('B4') ? null : buildB4Page(data),
    ex.has('B5') ? null : buildB5Page(data),
    ex.has('B6') ? null : buildB6Page(data),
    ex.has('B7') ? null : buildB7Page(data),
  ].filter(Boolean)
  const sSections = [
    ex.has('B8')  ? null : buildB8Page(data),
    ex.has('B9')  ? null : buildB9Page(data),
    ex.has('B10') ? null : buildB10Page(data),
  ].filter(Boolean)
  const gSections = [
    ex.has('B11') ? null : buildB11Page(data),
  ].filter(Boolean)

  const generalPacked = packSections(generalSections)
  const ePacked       = packSections(eSections)
  const sPacked       = packSections(sSections)
  const gPacked       = packSections(gSections)

  const sdgPage = buildSDGPage(data)

  // Assemble in order, inserting divider pages before each category group
  const allContentPages = [
    ...generalPacked,
    ...(ePacked.length > 0 ? [
      buildESGDividerPage('E', 'Environment',
        'Our environmental approach covers climate action, energy efficiency, pollution prevention, water stewardship, and circular waste management.',
        'esg-e-photo', data.images?.esgEnvironmentPhoto),
      ...ePacked,
    ] : []),
    ...(sPacked.length > 0 ? [
      buildESGDividerPage('S', 'Social',
        'Our social commitments centre on a safe, inclusive workplace — fair pay, skills development, and the well-being of every person in our team.',
        'esg-s-photo', data.images?.esgSocialPhoto),
      ...sPacked,
    ] : []),
    ...(gPacked.length > 0 ? [
      buildESGDividerPage('G', 'Governance',
        'Our governance framework upholds the highest standards of ethical conduct, anti-corruption, and transparent accountability to all stakeholders.',
        'esg-g-photo', data.images?.esgGovernancePhoto),
      ...gPacked,
    ] : []),
    ...(sdgPage ? [sdgPage] : []),
  ]

  // Badge → page-number map for the TOC (cover=1, toc=2, content starts at 3)
  const pageMap = {}
  allContentPages.forEach((page, i) => {
    page.blocks
      .filter(b => b.type === 'section-band')
      .forEach(b => { if (b.badge) pageMap[b.badge] = i + 3 })
  })

  const certPage = buildCertificationsPage(data)
  // Certifications is appended after allContentPages, so its page number is calculated here
  if (certPage) pageMap['CERT'] = allContentPages.length + 3

  return [
    buildCoverPage(data),
    buildTOCPage(pageMap),
    ...allContentPages,
    ...(certPage ? [certPage] : []),
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
        ['Address',          data.address],
        ['Website',          data.website],
        ['Contact',          [data.contactName, data.contactEmail].filter(Boolean).join('  ·  ')],
      )},
      ...(data.companyDescription ? [
        { type: 'subtitle', text: 'About the Company' },
        { type: 'text-photo', content: strip(data.companyDescription), phId: 'b1-company-photo', height: 155, imageSrc: data.images?.companyPhoto },
      ] : [
        { type: 'photo-placeholder', phId: 'b1-company-photo', height: 155, imageSrc: data.images?.companyPhoto },
      ]),
    ],
  }
}

// B2 — Policies & Commitments
function buildB2Page(data) {
  const TOPICS = [
    ['Climate Change',   'policyClimate',     'policyClimatePublic',     'policyClimateTargets',    'E'],
    ['Pollution',        'policyPollution',    'policyPollutionPublic',   'policyPollutionTargets',  'E'],
    ['Water & Marine',   'policyWaterMarine',  'policyWaterMarinePublic', 'policyWaterMarineTargets','E'],
    ['Biodiversity',     'policyBiodiversity', 'policyBiodiversityPublic','policyBiodiversityTargets','E'],
    ['Circular Economy', 'policyCircular',     'policyCircularPublic',    'policyCircularTargets',   'E'],
    ['Own Workforce',    'policyOwnWorkforce', 'policyOwnWorkforcePublic','policyOwnWorkforceTargets','S'],
    ['Value Chain',      'policyValueChain',   'policyValueChainPublic',  'policyValueChainTargets', 'S'],
    ['Communities',      'policyCommunities',  'policyCommunitiesPublic', 'policyCommunitiesTargets','S'],
    ['Consumers',        'policyConsumers',    'policyConsumersPublic',   'policyConsumersTargets',  'S'],
    ['Governance',       'policyGovernance',   'policyGovernancePublic',  'policyGovernanceTargets', 'G'],
  ]

  const adopted  = TOPICS.filter(([, f]) => data[f] === 'yes' || data[f] === 'in-progress' || data[f] === 'in_progress')
  const skipped  = TOPICS.filter(([, f]) => !adopted.some(a => a[1] === f)).map(([label]) => label)
  if (!adopted.length) return null

  const publicCount = adopted.filter(([,, pf])  => data[pf] === 'yes').length
  const withTargets = adopted.filter(([,,, tf]) => data[tf] === 'yes').length

  return {
    title: 'B2 — Policies', badge: 'B2',
    blocks: [
      { type: 'section-band', badge: 'B2', title: 'Policies & Commitments' },
      { type: 'kpi-row', metrics: [
        { label: 'Policies Adopted',   value: adopted.length,  unit: `of ${TOPICS.length} topics` },
        { label: 'Publicly Available', value: publicCount,      unit: 'policies' },
        { label: 'With Targets',       value: withTargets,      unit: 'topics' },
      ] },
      { type: 'policy-matrix',
        rows: adopted.map(([label, f, pf, tf, cat]) => ({
          label, category: cat,
          status:     data[f]  || '',
          isPublic:   data[pf] === 'yes',
          hasTargets: data[tf] === 'yes',
        })),
        skipped,
      },
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
        { type: 'text-photo', content: strip(data.workforceNarrative), phId: 'b8-workforce-photo', height: 140, imageSrc: data.images?.workforcePhoto },
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
        ['OHS Certification',        data.hasOHSManagementSystem === 'yes' ? data.ohsCertification : ''],
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

// Appendix — UN Sustainable Development Goals (Verdensmål)
function buildSDGPage(data) {
  const goals = data.sdgGoals || []
  if (!goals.length && !data.sdgNarrative) return null

  return {
    title: 'UN Sustainable Development Goals', badge: 'SDG', showFooter: true,
    blocks: [
      { type: 'section-band', badge: 'SDG', title: 'UN Sustainable Development Goals' },
      { type: 'sdg-grid', selectedGoals: goals },
      ...(data.sdgNarrative ? [
        { type: 'subtitle', text: 'Our Approach to the Sustainable Development Goals' },
        { type: 'text-block', content: strip(data.sdgNarrative) },
      ] : []),
    ],
  }
}

// Appendix — Certifications & Standards
function buildCertificationsPage(data) {
  const lines = (data.certificationsList || '').split('\n').map(s => s.trim()).filter(Boolean)
  const ohsCert = data.hasOHSManagementSystem === 'yes' ? data.ohsCertification : null

  // Aggregate all certifications
  const certs = [...lines]
  if (ohsCert && !certs.some(c => c.includes(ohsCert.split('(')[0].trim()))) {
    certs.push(ohsCert)
  }

  // Auto-build standards used
  const standards = [['Reporting Framework', 'VSME Basic Module (B1–B11), EFRAG 2023']]
  if (data.scope1Emissions || data.scope2Emissions) {
    standards.push(['GHG Accounting', data.methodologyDescription ? strip(data.methodologyDescription).split('.')[0] : 'GHG Protocol Corporate Standard (2004)'])
  }
  if (data.reportingPeriodStart && data.reportingPeriodEnd) {
    standards.push(['Reporting Period', `${data.reportingPeriodStart} – ${data.reportingPeriodEnd}`])
  }
  if (data.reportingBasis) {
    standards.push(['Reporting Basis', data.reportingBasis === 'individual' ? 'Individual (single entity)' : 'Consolidated (group)'])
  }

  if (!certs.length && standards.length <= 1) return null

  const certRows = certs.map(c => {
    const dashIdx = c.indexOf(' - ')
    return dashIdx > -1
      ? { label: c.slice(0, dashIdx).trim(), value: c.slice(dashIdx + 3).trim() }
      : { label: c, value: '' }
  })

  return {
    title: 'Certifications & Standards', badge: 'CERT', showFooter: true,
    blocks: [
      { type: 'section-band', badge: 'CERT', title: 'Certifications & Standards' },
      ...(certRows.length > 0 ? [
        { type: 'subtitle', text: 'Company Certifications & Permits' },
        { type: 'data-table', columns: 1, rows: certRows },
      ] : []),
      { type: 'subtitle', text: 'Reporting Standards & Frameworks' },
      { type: 'data-table', columns: 1, rows: standards.map(([label, value]) => ({ label, value })) },
      ...(data.contactName || data.contactEmail ? [
        { type: 'subtitle', text: 'Report Contact' },
        { type: 'data-table', rows: rows(
          ['Name',  data.contactName],
          ['Email', data.contactEmail],
          ['Phone', data.contactPhone],
        )},
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
