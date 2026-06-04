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

// Energy unit conversion — used for renewable-share denominator (Scope 1+2 only)
const _ENERGY_TO_KWH = { kWh: 1, MWh: 1000, GJ: 277.778, TJ: 277778 }
const _ENERGY_UNIT_SET = new Set(['kWh', 'MWh', 'GJ', 'TJ'])
function _cvtEnergy(v, from, to) {
  return v * (_ENERGY_TO_KWH[from] || 1) / (_ENERGY_TO_KWH[to] || 1)
}
// Returns total Scope 1+2 energy in the report's energy unit
function calcScope12Energy(data) {
  const eUnit = data.energyUnit || 'MWh'
  const elec  = n(data.electricityConsumption)
  const dist  = n(data.districtHeatingConsumption)
  const gasE  = _ENERGY_UNIT_SET.has(data.gasUnit)     ? _cvtEnergy(n(data.naturalGasConsumption), data.gasUnit, eUnit) : 0
  const oilE  = _ENERGY_UNIT_SET.has(data.fuelOilUnit) ? _cvtEnergy(n(data.fuelOilConsumption), data.fuelOilUnit, eUnit) : 0
  return elec + dist + gasE + oilE
}

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
    case 'ghg-scope-chart': {
      const count = [block.scope1, block.scope2, block.scope3].filter(v => v > 0).length
      return 24 + count * 38 + 10
    }
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
    case 'sdg-list': {
      return (block.goals || []).reduce((sum, goal) => {
        const lines = Math.max(2, Math.ceil((goal.narrative?.length || 0) / 108))
        return sum + Math.max(62, 12 + 14 + lines * 12 + 14 + 12)
      }, 0)
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

function buildESGDividerPage(letter, title, description, phId, imageSrc, focusAreas = [], kpis = [], year = '') {
  return {
    title: `${letter} — ${title}`,
    badge: '',
    blocks: [{ type: 'esg-section-cover', letter, title, description, phId, imageSrc, focusAreas, kpis, year }],
  }
}

function fmtKpi(v, decimals = 0) {
  const num = parseFloat(v)
  if (!num && num !== 0) return '—'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 10000)   return Math.round(num).toLocaleString()
  if (decimals)       return num.toFixed(decimals)
  return num % 1 === 0 ? String(Math.round(num)) : num.toFixed(1)
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
    ...(ex.has('B3') ? [] : buildB3Pages(data)),
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

  // ── Compute per-pillar KPIs and focus areas for divider pages
  const year = data.reportingYear || String(new Date().getFullYear())

  // E — Environment
  const totalEnergy  = n(data.totalEnergyConsumption)
  const renew        = n(data.renewableEnergyConsumption)
  const _s12E        = calcScope12Energy(data)
  const renewPct     = _s12E > 0 && renew > 0 ? ((renew / _s12E) * 100).toFixed(1) : null
  const eS1          = n(data.scope1Emissions), eS2 = n(data.scope2Emissions)
  const eWater       = n(data.totalWaterWithdrawal)

  const eFocusAreas = [
    { title: 'Climate & Energy',         text: 'Tracking and reducing energy consumption and GHG emissions across our operations.' },
    { title: 'Water & Biodiversity',     text: 'Responsible water management and safeguarding natural ecosystems.' },
    { title: 'Circular Economy & Waste', text: 'Minimising waste generation and promoting circular resource flows throughout our value chain.' },
  ]
  const eKpis = [
    { topLabel: 'ENERGY USE',  value: fmtKpi(totalEnergy), unit: data.energyUnit || 'MWh',      subLabel: 'total consumed' },
    { topLabel: 'GHG SCOPE 1+2', value: fmtKpi(eS1 + eS2), unit: data.ghgUnit || 'tCO2e',       subLabel: 'direct emissions' },
    renewPct
      ? { topLabel: 'RENEWABLE', value: renewPct,           unit: '%',                           subLabel: 'scope 1+2 share' }
      : { topLabel: 'WATER USE', value: fmtKpi(eWater),     unit: data.waterUnit || 'm³',         subLabel: 'total withdrawal' },
  ]

  // S — Social
  const totalEmp  = n(data.totalEmployees)
  const femaleEmp = n(data.femaleEmployees)
  const femalePct = totalEmp > 0 && femaleEmp > 0 ? ((femaleEmp / totalEmp) * 100).toFixed(0) : null
  const injuries  = n(data.workRelatedInjuries)

  const sFocusAreas = [
    { title: 'Workforce & Inclusion', text: 'Building a diverse, inclusive team where every employee can thrive.' },
    { title: 'Health & Safety',       text: 'Zero-harm working environment with robust OHS management systems.' },
    { title: 'Pay & Development',     text: 'Fair wages, equal opportunities, and continuous skills development for all.' },
  ]
  const sKpis = [
    { topLabel: 'EMPLOYEES',    value: fmtKpi(totalEmp),                    unit: 'FTE',    subLabel: 'total workforce' },
    femalePct
      ? { topLabel: 'FEMALE',   value: femalePct,                           unit: '%',      subLabel: 'of workforce' }
      : { topLabel: 'INJURIES', value: fmtKpi(injuries),                    unit: 'cases',  subLabel: 'work-related' },
    data.avgTrainingHours
      ? { topLabel: 'TRAINING', value: fmtKpi(data.avgTrainingHours, 1),    unit: 'hrs',    subLabel: 'avg per employee' }
      : { topLabel: 'INJURIES', value: fmtKpi(injuries),                    unit: 'cases',  subLabel: 'work-related' },
  ]

  // G — Governance
  const POLICY_FIELDS = [
    'policyClimate','policyPollution','policyWaterMarine','policyBiodiversity','policyCircular',
    'policyOwnWorkforce','policyValueChain','policyCommunities','policyConsumers','policyGovernance',
  ]
  const PUBLIC_FIELDS = [
    'policyClimatePublic','policyPollutionPublic','policyWaterMarinePublic','policyBiodiversityPublic',
    'policyCircularPublic','policyOwnWorkforcePublic','policyValueChainPublic','policyCommunitiesPublic',
    'policyConsumersPublic','policyGovernancePublic',
  ]
  const adoptedCount = POLICY_FIELDS.filter(f => data[f] === 'yes' || data[f] === 'in-progress' || data[f] === 'in_progress').length
  const publicCount  = PUBLIC_FIELDS.filter(f => data[f] === 'yes').length

  const gFocusAreas = [
    { title: 'Anti-Corruption',  text: 'Zero tolerance for bribery and corruption across all business activities.' },
    { title: 'Transparency',     text: 'Open, accurate, and timely disclosure of ESG performance to all stakeholders.' },
    { title: 'Ethical Conduct',  text: 'Strong governance policies and a culture of integrity throughout the organisation.' },
  ]
  const gKpis = [
    { topLabel: 'POLICIES',     value: adoptedCount > 0 ? String(adoptedCount) : '—', unit: 'adopted',   subLabel: 'of 10 ESG topics' },
    { topLabel: 'PUBLIC',       value: publicCount  > 0 ? String(publicCount)  : '—', unit: 'disclosed', subLabel: 'policies available' },
    { topLabel: 'CONVICTIONS',  value: fmtKpi(n(data.corruptionConvictions)),          unit: 'cases',     subLabel: 'corruption' },
  ]

  // Assemble in order, inserting divider pages before each category group
  const allContentPages = [
    ...generalPacked,
    ...(ePacked.length > 0 ? [
      buildESGDividerPage('E', 'Environment',
        'Our environmental approach covers climate action, energy efficiency, pollution prevention, water stewardship, and circular waste management.',
        'esg-e-photo', data.images?.['esg-e-photo'] || data.images?.esgEnvironmentPhoto, eFocusAreas, eKpis, year),
      ...ePacked,
    ] : []),
    ...(sPacked.length > 0 ? [
      buildESGDividerPage('S', 'Social',
        'Our social commitments centre on a safe, inclusive workplace — fair pay, skills development, and the well-being of every person in our team.',
        'esg-s-photo', data.images?.['esg-s-photo'] || data.images?.esgSocialPhoto, sFocusAreas, sKpis, year),
      ...sPacked,
    ] : []),
    ...(gPacked.length > 0 ? [
      buildESGDividerPage('G', 'Governance',
        'Our governance framework upholds the highest standards of ethical conduct, anti-corruption, and transparent accountability to all stakeholders.',
        'esg-g-photo', data.images?.['esg-g-photo'] || data.images?.esgGovernancePhoto, gFocusAreas, gKpis, year),
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
        { type: 'text-photo', content: strip(data.companyDescription), phId: 'b1-company-photo', height: 155, imageSrc: data.images?.['b1-company-photo'] || data.images?.companyPhoto },
      ] : [
        { type: 'photo-placeholder', phId: 'b1-company-photo', height: 155, imageSrc: data.images?.['b1-company-photo'] || data.images?.companyPhoto },
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

// B3 — Energy & GHG Emissions (split into per-scope pages)

// Page 1: narrative only — no KPIs, no data tables. The numbers are presented on the
// per-scope pages and summarised on the GHG Summary page at the end.
function buildB3OverviewPage(data) {
  return {
    title: 'B3 — Energy & GHG', badge: 'B3',
    blocks: [
      { type: 'section-band', badge: 'B3', title: 'Energy & GHG Emissions' },
      ...(data.energyNarrative ? [
        { type: 'subtitle', text: 'Energy & GHG Narrative' },
        { type: 'text-block-2col', content: strip(data.energyNarrative) },
      ] : []),
    ],
  }
}

// Page 2: Scope 1 — direct emissions + the fuel sources that cause them
function buildB3Scope1Page(data) {
  const s1 = n(data.scope1Emissions)
  const hasFuels = data.naturalGasConsumption || data.fuelOilConsumption
  if (!s1 && !data.scope1Stationary && !data.scope1Mobile && !data.scope1Fugitive && !data.scope1Process && !hasFuels) return null

  const ghgUnit     = data.ghgUnit || 'tCO2e'
  const g           = (v) => v ? `${v} ${ghgUnit}` : ''
  const totalKnown  = n(data.scope1Stationary) + n(data.scope1Mobile) + n(data.scope1Fugitive) + n(data.scope1Process)
  const unaccounted = s1 > 0 && totalKnown > 0 && s1 > totalKnown ? s1 - totalKnown : 0

  return {
    title: 'B3 — GHG Scope 1', badge: 'B3',
    blocks: [
      { type: 'section-band', badge: '', title: 'GHG Emissions — Scope 1 (Direct)' },
      { type: 'kpi-row', metrics: [
        { label: 'Total Scope 1', value: s1 || '0', unit: ghgUnit },
        data.scope1Stationary && { label: 'Stationary', value: n(data.scope1Stationary), unit: ghgUnit },
        data.scope1Mobile     && { label: 'Mobile',     value: n(data.scope1Mobile),     unit: ghgUnit },
      ].filter(Boolean) },
      { type: 'subtitle', text: 'GHG Breakdown by Source' },
      { type: 'data-table', columns: 1, rows: rows(
        ['Own facilities — stationary combustion',   g(data.scope1Stationary)],
        ['Company vehicles — mobile combustion',     g(data.scope1Mobile)],
        ['Fugitive emissions (refrigerants, leaks)', g(data.scope1Fugitive)],
        ['Industrial process emissions',             g(data.scope1Process)],
        ...(unaccounted > 0 ? [['Other / unspecified', `${unaccounted.toFixed(2)} ${ghgUnit}`]] : []),
        ['Total Scope 1',                            g(data.scope1Emissions)],
      )},
      // Show the fuel sources here — they are the direct cause of Scope 1 emissions
      ...(hasFuels ? [
        { type: 'subtitle', text: 'Fuel Consumption (Scope 1 Sources)' },
        { type: 'data-table', columns: 1, rows: rows(
          ['Natural gas',       data.naturalGasConsumption ? `${data.naturalGasConsumption} ${data.gasUnit || 'm³'}` : ''],
          ['Fuel oil / diesel', data.fuelOilConsumption    ? `${data.fuelOilConsumption} ${data.fuelOilUnit || 'L'}` : ''],
        )},
      ] : []),
    ],
  }
}

// Page 3: Scope 2 — purchased energy emissions + electricity/heating consumption detail
function buildB3Scope2Page(data) {
  const s2 = n(data.scope2Emissions)
  if (!s2 && !data.scope2LocationBased && !data.scope2Electricity && !data.scope2Heating) return null

  const ghgUnit    = data.ghgUnit || 'tCO2e'
  const eUnit      = data.energyUnit || 'MWh'
  const g          = (v) => v ? `${v} ${ghgUnit}` : ''
  const elec       = n(data.electricityConsumption)
  const elecRenew  = n(data.electricityRenewable)
  const elecNonRenew = elec > 0 ? elec - elecRenew : 0
  const distTotal  = n(data.districtHeatingConsumption)
  const distRenew  = n(data.districtHeatingRenewable)
  const hasElec    = elec > 0
  const hasDist    = distTotal > 0

  return {
    title: 'B3 — GHG Scope 2', badge: 'B3',
    blocks: [
      { type: 'section-band', badge: '', title: 'GHG Emissions — Scope 2 (Purchased Energy)' },
      { type: 'kpi-row', metrics: [
        { label: 'Scope 2 (market)',    value: s2 || '0', unit: ghgUnit },
        data.scope2LocationBased && { label: 'Scope 2 (location)', value: n(data.scope2LocationBased), unit: ghgUnit },
      ].filter(Boolean) },
      { type: 'subtitle', text: 'GHG from Purchased Energy' },
      { type: 'data-table', columns: 1, rows: rows(
        ['Purchased electricity — market-based',   g(data.scope2Emissions)],
        ['Purchased electricity — location-based', g(data.scope2LocationBased)],
        ['District heating / cooling component',   g(data.scope2Heating)],
      )},
      // Electricity consumption detail — renewable share is % of electricity only,
      // NOT of all energy, so it cannot be misread as covering diesel/gas as well.
      ...(hasElec ? [
        { type: 'subtitle', text: 'Purchased Electricity Consumption' },
        { type: 'data-table', columns: 1, rows: rows(
          ['Total electricity',             `${elec.toFixed(2)} ${eUnit}`],
          ['Renewable electricity',         elecRenew > 0    ? `${elecRenew.toFixed(2)} ${eUnit}`    : ''],
          ['Non-renewable electricity',     elecNonRenew > 0 ? `${elecNonRenew.toFixed(2)} ${eUnit}` : ''],
          ['Renewable share of electricity',elec > 0 && elecRenew > 0 ? `${((elecRenew / elec) * 100).toFixed(1)} %` : ''],
        )},
      ] : []),
      ...(hasDist ? [
        { type: 'subtitle', text: 'District Heating / Cooling' },
        { type: 'data-table', columns: 1, rows: rows(
          ['Total district heating/cooling',          `${distTotal.toFixed(2)} ${eUnit}`],
          ['of which renewable',                      distRenew > 0 ? `${distRenew.toFixed(2)} ${eUnit}` : ''],
          ['Non-renewable district heating',          (() => { const r = distRenew; return distTotal > 0 && r > 0 ? `${(distTotal - r).toFixed(2)} ${eUnit}` : '' })()],
          ['Renewable share of district heating',     distTotal > 0 && distRenew > 0 ? `${((distRenew / distTotal) * 100).toFixed(1)} %` : ''],
        )},
      ] : []),
    ],
  }
}

function buildB3Scope3Page(data) {
  const s3 = n(data.scope3Emissions)
  const hasS3Detail = data.scope3BusinessTravel || data.scope3Commuting || data.scope3PurchasedGoods ||
                      data.scope3Waste || data.scope3UpstreamTransport || data.scope3DownstreamTransport || data.scope3UseOfProducts
  if (!s3 && !hasS3Detail) return null

  const ghgUnit  = data.ghgUnit || 'tCO2e'
  const g        = (v) => v ? `${v} ${ghgUnit}` : ''

  return {
    title: 'B3 — GHG Scope 3', badge: 'B3',
    blocks: [
      { type: 'section-band', badge: '', title: 'GHG Emissions — Scope 3 (Value Chain)' },
      { type: 'kpi-row', metrics: [
        { label: 'Total Scope 3', value: s3 || '0', unit: ghgUnit },
      ] },
      { type: 'subtitle', text: 'Scope 3 Breakdown' },
      { type: 'data-table', columns: 1, rows: rows(
        ['Business travel',                        g(data.scope3BusinessTravel)],
        ['Employee commuting',                     g(data.scope3Commuting)],
        ['Procurement (goods, materials, services)',g(data.scope3PurchasedGoods)],
        ['Waste and recycling',                    g(data.scope3Waste)],
        ['Upstream transport',                     g(data.scope3UpstreamTransport)],
        ['Downstream transport (to customer)',     g(data.scope3DownstreamTransport)],
        ['Use of sold products',                   g(data.scope3UseOfProducts)],
        ['Total Scope 3',                          g(data.scope3Emissions)],
      )},
    ],
  }
}

function buildB3GHGSummaryPage(data) {
  const s1 = n(data.scope1Emissions), s2 = n(data.scope2Emissions), s3 = n(data.scope3Emissions)
  const totalGHG  = s1 + s2 + s3
  const emp       = n(data.employeeCount)
  const ghgUnit   = data.ghgUnit || 'tCO2e'
  const ghgIntEmp = totalGHG > 0 && emp > 0 ? (totalGHG / emp).toFixed(2) : null

  return {
    title: 'B3 — GHG Summary', badge: 'B3',
    blocks: [
      { type: 'section-band', badge: '', title: 'GHG Emissions — Summary' },
      { type: 'kpi-row', metrics: [
        { label: 'Scope 1',    value: s1 || '0',               unit: ghgUnit },
        { label: 'Scope 2',    value: s2 || '0',               unit: ghgUnit },
        s3 > 0 && { label: 'Scope 3', value: s3,               unit: ghgUnit },
        totalGHG > 0 && { label: 'Total CO2', value: totalGHG.toFixed(2), unit: ghgUnit },
      ].filter(Boolean) },
      ...(s1 > 0 || s2 > 0 ? [{ type: 'ghg-scope-chart', scope1: s1, scope2: s2, scope3: s3 > 0 ? s3 : null, unit: ghgUnit }] : []),
      { type: 'data-table', rows: rows(
        ['GHG Intensity (per emp)', ghgIntEmp ? `${ghgIntEmp} ${ghgUnit}/emp` : ''],
        ['GHG Base Year',           data.ghgBaseYear],
        ['GHG Reduction Target',    data.ghgReductionTarget],
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

function buildB3Pages(data) {
  if (!data.totalEnergyConsumption && !data.renewableEnergyConsumption &&
      !data.scope1Emissions && !data.scope2Emissions && !data.scope3Emissions &&
      !data.energyNarrative && !data.ghgNarrative) return []

  const s1 = n(data.scope1Emissions), s2 = n(data.scope2Emissions)
  const hasGHG = s1 > 0 || s2 > 0 || n(data.scope3Emissions) > 0

  return [
    buildB3OverviewPage(data),
    hasGHG ? buildB3Scope1Page(data) : null,
    hasGHG ? buildB3Scope2Page(data) : null,
    buildB3Scope3Page(data),
    hasGHG ? buildB3GHGSummaryPage(data) : null,
  ].filter(Boolean)
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
        { type: 'text-photo', content: strip(data.workforceNarrative), phId: 'b8-workforce-photo', height: 140, imageSrc: data.images?.['b8-workforce-photo'] || data.images?.workforcePhoto || data.images?.workforceImage },
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

const SDG_NAMES = {
  1: 'No Poverty',                              2: 'Zero Hunger',
  3: 'Good Health and Well-Being',              4: 'Quality Education',
  5: 'Gender Equality',                         6: 'Clean Water and Sanitation',
  7: 'Affordable and Clean Energy',             8: 'Decent Work and Economic Growth',
  9: 'Industry, Innovation and Infrastructure', 10: 'Reduced Inequalities',
  11: 'Sustainable Cities and Communities',     12: 'Responsible Consumption and Production',
  13: 'Climate Action',                         14: 'Life Below Water',
  15: 'Life on Land',                           16: 'Peace, Justice and Strong Institutions',
  17: 'Partnerships for the Goals',
}
const SDG_COLORS_PB = {
  1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
  6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
  11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
  16: '#00689D', 17: '#19486A',
}

// Appendix — UN Sustainable Development Goals (Verdensmål)
function buildSDGPage(data) {
  const goals = data.sdgGoals || []
  if (!goals.length && !data.sdgNarrative) return null

  const narratives  = data.sdgGoalNarratives || {}
  const hasNarratives = goals.some(g => (narratives[g] || '').trim())

  if (hasNarratives) {
    const goalItems = [...goals].sort((a, b) => a - b).map(g => ({
      num:       Number(g),
      name:      SDG_NAMES[g] || `Goal ${g}`,
      color:     SDG_COLORS_PB[g] || '#888888',
      narrative: strip(narratives[g] || ''),
    }))

    return {
      title: 'UN Sustainable Development Goals', badge: 'SDG', showFooter: true,
      blocks: [
        { type: 'section-band', badge: 'SDG', title: 'UN Sustainable Development Goals' },
        ...(data.sdgNarrative ? [
          { type: 'text-block', content: strip(data.sdgNarrative) },
          { type: 'spacer', height: 8 },
        ] : []),
        { type: 'sdg-list', goals: goalItems },
      ],
    }
  }

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
