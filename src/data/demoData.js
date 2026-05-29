// Demo SVG images — factory exterior, production floor, workforce
const _coverSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a7d5c"/><stop offset="1" stop-color="#0a1f12"/></linearGradient></defs><rect width="500" height="320" fill="url(#g)"/><rect x="0" y="200" width="500" height="120" fill="#07110a" opacity=".65"/><rect x="20" y="135" width="90" height="185" fill="#0e2c1a" opacity=".95"/><rect x="140" y="90" width="130" height="230" fill="#0b2414" opacity=".95"/><rect x="305" y="145" width="95" height="175" fill="#0e2c1a" opacity=".95"/><rect x="430" y="160" width="70" height="160" fill="#0b2414" opacity=".9"/><rect x="38" y="90" width="12" height="50" fill="#060f0a"/><rect x="168" y="55" width="12" height="40" fill="#060f0a"/><rect x="192" y="62" width="10" height="34" fill="#060f0a"/><rect x="322" y="108" width="11" height="42" fill="#060f0a"/><rect x="35" y="160" width="16" height="13" fill="#5aaa80" opacity=".55"/><rect x="60" y="160" width="16" height="13" fill="#5aaa80" opacity=".45"/><rect x="35" y="183" width="16" height="13" fill="#5aaa80" opacity=".35"/><rect x="155" y="118" width="18" height="13" fill="#5aaa80" opacity=".55"/><rect x="184" y="118" width="18" height="13" fill="#5aaa80" opacity=".45"/><rect x="213" y="118" width="18" height="13" fill="#5aaa80" opacity=".35"/><rect x="155" y="141" width="18" height="13" fill="#5aaa80" opacity=".45"/><rect x="184" y="141" width="18" height="13" fill="#5aaa80" opacity=".5"/><rect x="320" y="168" width="16" height="13" fill="#5aaa80" opacity=".5"/><rect x="346" y="168" width="16" height="13" fill="#5aaa80" opacity=".4"/><rect x="0" y="290" width="500" height="30" fill="#276B4D" opacity=".12"/></svg>`

const _companySVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#295e44"/><stop offset="1" stop-color="#0b1e12"/></linearGradient></defs><rect width="500" height="320" fill="url(#g)"/><polygon points="0,320 250,170 500,320" fill="#07130b" opacity=".55"/><rect x="60" y="165" width="75" height="155" fill="#102b19" rx="3"/><rect x="175" y="140" width="65" height="180" fill="#0d2415" rx="3"/><rect x="285" y="155" width="85" height="165" fill="#102b19" rx="3"/><rect x="410" y="168" width="55" height="152" fill="#0d2415" rx="3"/><rect x="60" y="165" width="75" height="5" fill="#276B4D" opacity=".7" rx="2"/><rect x="175" y="140" width="65" height="5" fill="#276B4D" opacity=".6" rx="2"/><rect x="285" y="155" width="85" height="5" fill="#276B4D" opacity=".7" rx="2"/><rect x="410" y="168" width="55" height="5" fill="#276B4D" opacity=".6" rx="2"/><rect x="95" y="38" width="6" height="88" fill="#3d8a62" opacity=".5"/><rect x="210" y="28" width="6" height="95" fill="#3d8a62" opacity=".45"/><rect x="330" y="33" width="6" height="90" fill="#3d8a62" opacity=".5"/><ellipse cx="98" cy="36" rx="14" ry="5" fill="#d8eee2" opacity=".5"/><ellipse cx="213" cy="26" rx="14" ry="5" fill="#d8eee2" opacity=".45"/><ellipse cx="333" cy="31" rx="14" ry="5" fill="#d8eee2" opacity=".5"/><rect x="80" y="190" width="14" height="11" fill="#5aaa80" opacity=".45"/><rect x="100" y="190" width="14" height="11" fill="#5aaa80" opacity=".4"/><rect x="190" y="168" width="14" height="11" fill="#5aaa80" opacity=".45"/><rect x="210" y="168" width="14" height="11" fill="#5aaa80" opacity=".4"/><rect x="300" y="180" width="14" height="11" fill="#5aaa80" opacity=".45"/><rect x="320" y="180" width="14" height="11" fill="#5aaa80" opacity=".4"/></svg>`

const _workforceSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320"><defs><linearGradient id="g" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#346652"/><stop offset="1" stop-color="#0c1e13"/></linearGradient></defs><rect width="500" height="320" fill="url(#g)"/><rect x="0" y="185" width="500" height="135" fill="#09150d" opacity=".7"/><rect x="90" y="45" width="320" height="55" fill="#276B4D" opacity=".22" rx="4"/><rect x="100" y="55" width="200" height="3" fill="#6ab58c" opacity=".5"/><rect x="100" y="68" width="140" height="3" fill="#6ab58c" opacity=".4"/><ellipse cx="75" cy="148" rx="26" ry="26" fill="#0e2a1b"/><rect x="52" y="172" width="46" height="148" fill="#0e2a1b" rx="4"/><ellipse cx="165" cy="134" rx="26" ry="26" fill="#122e1e"/><rect x="142" y="158" width="46" height="162" fill="#122e1e" rx="4"/><ellipse cx="255" cy="140" rx="28" ry="28" fill="#0e2a1b"/><rect x="230" y="166" width="50" height="154" fill="#0e2a1b" rx="4"/><ellipse cx="345" cy="137" rx="25" ry="25" fill="#122e1e"/><rect x="323" y="160" width="44" height="160" fill="#122e1e" rx="4"/><ellipse cx="430" cy="145" rx="24" ry="24" fill="#0e2a1b"/><rect x="409" y="168" width="42" height="152" fill="#0e2a1b" rx="4"/><ellipse cx="75" cy="148" rx="26" ry="26" fill="#276B4D" opacity=".2"/><ellipse cx="255" cy="140" rx="28" ry="28" fill="#276B4D" opacity=".2"/><ellipse cx="430" cy="145" rx="24" ry="24" fill="#276B4D" opacity=".18"/></svg>`

const _govSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#295e42"/><stop offset="1" stop-color="#091a0e"/></linearGradient></defs><rect width="500" height="320" fill="url(#g)"/><rect x="0" y="280" width="500" height="40" fill="#071510" opacity=".75"/><polygon points="110,140 250,55 390,140" fill="#0a2015" opacity=".9"/><rect x="130" y="140" width="240" height="180" fill="#0d2819" opacity=".95"/><rect x="145" y="140" width="16" height="175" fill="#111f14" opacity=".85"/><rect x="178" y="140" width="16" height="175" fill="#111f14" opacity=".85"/><rect x="211" y="140" width="16" height="175" fill="#111f14" opacity=".85"/><rect x="244" y="140" width="16" height="175" fill="#111f14" opacity=".85"/><rect x="277" y="140" width="16" height="175" fill="#111f14" opacity=".85"/><rect x="310" y="140" width="16" height="175" fill="#111f14" opacity=".85"/><rect x="343" y="140" width="16" height="175" fill="#111f14" opacity=".85"/><rect x="108" y="275" width="284" height="8" fill="#0a1f12" opacity=".9"/><rect x="100" y="283" width="300" height="8" fill="#081510" opacity=".85"/><rect x="155" y="165" width="18" height="13" fill="#5aaa80" opacity=".4"/><rect x="190" y="165" width="18" height="13" fill="#5aaa80" opacity=".35"/><rect x="225" y="165" width="18" height="13" fill="#5aaa80" opacity=".4"/><rect x="260" y="165" width="18" height="13" fill="#5aaa80" opacity=".35"/><rect x="295" y="165" width="18" height="13" fill="#5aaa80" opacity=".4"/><rect x="330" y="165" width="18" height="13" fill="#5aaa80" opacity=".3"/><rect x="155" y="195" width="18" height="13" fill="#5aaa80" opacity=".3"/><rect x="225" y="195" width="18" height="13" fill="#5aaa80" opacity=".35"/><rect x="295" y="195" width="18" height="13" fill="#5aaa80" opacity=".3"/><rect x="215" y="245" width="70" height="75" fill="#081510" opacity=".9"/><rect x="226" y="255" width="20" height="35" fill="#276B4D" opacity=".2"/><rect x="254" y="255" width="20" height="35" fill="#276B4D" opacity=".15"/><rect x="240" y="80" width="20" height="62" fill="#122c1e" opacity=".75"/><rect x="225" y="68" width="50" height="16" fill="#122c1e" opacity=".7"/></svg>`

const demoData = {
  // B1 General Information
  companyName: 'NordGreen Manufacturing A/S',
  legalForm: 'Aktieselskab (A/S)',
  registrationNumber: 'DK38291045',
  country: 'Denmark',
  sector: 'Manufacturing',
  naceCode: 'C25.61',
  employeeCount: '247',
  reportingYear: '2024',
  reportingPeriodStart: '2024-01-01',
  reportingPeriodEnd: '2024-12-31',
  currency: 'EUR',
  balanceSum: '28500000',
  revenue: '42300000',
  reportingBasis: 'individual',
  reportingModule: 'basic',
  contactName: 'Mette Andersen',
  contactEmail: 'sustainability@nordgreen.dk',
  contactPhone: '+45 70 20 30 40',
  companyDescription: '<p>NordGreen Manufacturing A/S is a Danish metal fabrication company specialising in surface treatment and precision components for the automotive and industrial equipment sectors. Founded in 1991 and headquartered in Odense, we operate one production facility covering 18,400 m² and export to 14 countries across Europe.</p><p>Sustainability is central to our long-term business strategy. We are committed to reducing our environmental footprint, ensuring fair and safe working conditions, and maintaining the highest standards of corporate conduct.</p>',

  // B2 Policies & Actions
  policyClimate: 'yes',
  policyClimatePublic: 'yes',
  policyClimateTargets: 'yes',

  policyPollution: 'yes',
  policyPollutionPublic: 'yes',
  policyPollutionTargets: 'in_progress',

  policyWaterMarine: 'yes',
  policyWaterMarinePublic: 'no',
  policyWaterMarineTargets: 'no',

  policyBiodiversity: 'in_progress',
  policyBiodiversityPublic: 'no',
  policyBiodiversityTargets: 'no',

  policyCircular: 'yes',
  policyCircularPublic: 'yes',
  policyCircularTargets: 'yes',

  policyOwnWorkforce: 'yes',
  policyOwnWorkforcePublic: 'yes',
  policyOwnWorkforceTargets: 'yes',

  policyValueChain: 'in_progress',
  policyValueChainPublic: 'no',
  policyValueChainTargets: 'no',

  policyCommunities: 'yes',
  policyCommunitiesPublic: 'no',
  policyCommunitiesTargets: 'no',

  policyConsumers: 'yes',
  policyConsumersPublic: 'yes',
  policyConsumersTargets: 'no',

  policyGovernance: 'yes',
  policyGovernancePublic: 'yes',
  policyGovernanceTargets: 'yes',

  // B3 Energy
  totalEnergyConsumption: '4820',
  energyUnit: 'MWh',
  renewableEnergyConsumption: '1930',
  nonRenewableEnergyConsumption: '2890',
  electricityConsumption: '2140',
  naturalGasConsumption: '48500',
  gasUnit: 'm³',
  fuelOilConsumption: '12800',
  fuelOilUnit: 'L',
  districtHeatingConsumption: '380',
  districtUnit: 'MWh',
  hasEnergyManagementSystem: 'yes',
  energyReductionTarget: '15% reduction in total energy intensity by 2027 (baseline: 2022)',
  energyNarrative: '<p>NordGreen has implemented an ISO 50001-aligned energy management framework covering all production processes. A solar PV installation commissioned in Q2 2023 now supplies approximately 40% of site electricity. Ongoing investments in LED lighting, heat recovery on the paint line, and variable-speed compressor drives contributed to a 7% reduction in energy intensity per tonne of output compared to 2023.</p>',

  // B3 GHG
  scope1Emissions: '312',
  scope2Emissions: '487',
  scope3Emissions: '2140',
  ghgUnit: 'tCO2e',
  ghgBaseYear: '2021',
  ghgReductionTarget: '40% absolute reduction in Scope 1+2 by 2030 vs. 2021 baseline',
  methodologyDescription: 'GHG Protocol Corporate Standard (2004) with location-based method for Scope 2. Emission factors: Danish Energy Agency 2024 grid factor (0.113 kg CO₂e/kWh), IPCC AR6 GWPs.',
  ghgNarrative: '<p>Total Scope 1 and 2 emissions fell by 11% year-on-year, primarily driven by the expanded solar installation and a switch from fuel oil to natural gas in the thermal process furnace. Scope 3 emissions are estimated for upstream purchased goods and services (Category 1), which represent the largest share of our value-chain footprint. A detailed Scope 3 inventory is planned for 2025.</p>',

  // B4 Pollution
  hasPollutionReporting: 'yes',
  pollutionDescription: 'Surface treatment processes (zinc phosphating, electroplating) generate controlled process wastewater containing heavy metals and phosphates. All discharges are pre-treated on-site before release to the municipal sewer system under permit from Odense Municipality (permit ref. OD-2021-0447). Air emissions from solvent-based coating operations are captured by an RTO unit achieving >98% VOC destruction efficiency.',
  pollutionNarrative: '<p>NordGreen operated within all regulatory permit limits throughout 2024. Three minor non-conformances relating to zinc discharge concentrations were detected through self-monitoring in Q1; corrective actions were implemented within 14 days and permit limits were met for the remainder of the year. No enforcement notices or fines were received.</p>',

  // B5 Biodiversity
  hasBiodiversitySites: 'no',
  biodiversityDescription: '',
  landUseTotal: '2.4',
  landUseSensitive: '0',
  biodiversityNarrative: '<p>Our single production facility is located in an established industrial zone on the outskirts of Odense. The site is not adjacent to any Natura 2000 areas or other officially designated sensitive habitats. Total land occupied is 2.4 hectares (fully sealed, impermeable surface). No significant impacts on biodiversity were identified during the reporting year.</p>',

  // B6 Water
  totalWaterWithdrawal: '8450',
  waterUnit: 'm³',
  waterFromStressedAreas: '0',
  waterRecycled: '1240',
  waterDischarge: '7100',
  waterDischargeDestination: 'Municipal wastewater treatment plant (Odense NE WWTP)',
  waterNarrative: '<p>Water is primarily consumed in surface treatment rinsing cascades and cooling circuits. A closed-loop cooling tower upgrade in 2023 reduced make-up water demand by 18%. A new rinse-water recycling system installed in Q3 2024 now recirculates 1,240 m³ annually that would previously have been discharged. Denmark is classified as a low water-stress country; no operations draw from water-stressed catchments.</p>',

  // B7 Resources & Circular Economy
  usesCircularEconomy: 'yes',
  circularEconomyDescription: 'Metal swarf and off-cuts (steel, aluminium) are 100% sold to certified scrap metal recyclers under long-term agreements. Cardboard and plastic packaging from incoming components is sorted and collected for recycling. Chemical drums are returned to suppliers under a take-back scheme. We target zero waste to landfill by 2026.',
  wasteUnit: 'tonnes',
  wasteTypes: [
    { id: '1', typeKey: 'Metal scrap (steel/aluminium)', amount: '268', recycled: '268', hazardous: false },
    { id: '2', typeKey: 'Hazardous chemical waste', amount: '18', recycled: '0', hazardous: true },
    { id: '3', typeKey: 'Packaging (cardboard/plastic)', amount: '14', recycled: '12', hazardous: false },
    { id: '4', typeKey: 'Mixed non-hazardous waste', amount: '12', recycled: '0', hazardous: false },
  ],
  wasteNarrative: '<p>NordGreen achieved an 86% diversion rate from landfill in 2024, up from 79% in 2023. The remaining landfill disposal relates to contaminated mixed waste from maintenance activities for which no recycling route is currently available. Hazardous waste (spent electroplating solutions, solvents) is handled exclusively by licensed hazardous waste contractors in compliance with EU Waste Framework Directive requirements.</p>',

  // B8 Workforce
  totalEmployees: '247',
  permanentEmployees: '218',
  temporaryEmployees: '29',
  fullTimeEmployees: '231',
  partTimeEmployees: '16',
  maleEmployees: '163',
  femaleEmployees: '84',
  otherGenderEmployees: '0',
  notRegisteredGender: '0',
  employeesUnder30: '42',
  employees30to50: '138',
  employeesOver50: '67',
  employeesByCountry: 'Denmark: 223, Poland: 14, Romania: 10',
  newHires: '31',
  employeeTurnover: '9.2',
  nonEmployeeWorkers: '12',
  workforceNarrative: '<p>NordGreen employed 247 people as of 31 December 2024, of whom 218 hold permanent contracts. Women represent 34% of the workforce, an increase from 30% in 2022, driven by targeted recruitment initiatives in engineering and quality roles. The company employs workers from 3 countries. In addition, 12 non-employee contractors (facility maintenance and IT) worked regularly on-site during the year.</p>',

  // B9 Health & Safety
  workRelatedInjuries: '3',
  workRelatedFatalities: '0',
  fatalitiesFromIllHealth: '0',
  workRelatedIllHealth: '1',
  sickLeaveDays: '1842',
  lostDays: '87',
  hasOHSManagementSystem: 'yes',
  ohsCertification: 'ISO 45001:2018 (certified by DNV, valid to 2026)',
  safetyNarrative: '<p>Safety performance improved in 2024, with three recordable injuries compared to five in 2023. All three incidents were minor hand and finger injuries occurring in the pressing department; none resulted in permanent disability. Root cause analyses were completed within 5 working days for each incident and corrective actions implemented. The serious work-related ill-health case relates to one employee diagnosed with occupational noise-induced hearing loss; enhanced audiometric monitoring has been introduced for all press operators.</p>',

  // B10 Pay & Training
  minimumWageCompliance: 'yes',
  maleAvgSalary: '52400',
  femaleAvgSalary: '48900',
  collectiveBargainingCoverage: '78',
  avgTrainingHours: '18',
  avgTrainingHoursMale: '17',
  avgTrainingHoursFemale: '20',
  avgTrainingHoursOther: '',
  trainingInvestment: '186000',
  payNarrative: '<p>All NordGreen employees receive remuneration above the applicable Danish minimum wage. 78% of employees are covered by a collective bargaining agreement with the Danish Metal Workers Union (Dansk Metal). The gender pay gap of 6.7% reflects an underrepresentation of women in senior technical and management roles; a pay equity review was conducted in Q4 2024 and targeted adjustments totalling EUR 34,000 were made.</p>',

  // Appendix — Certifications
  certificationsList: 'ISO 50001:2018 - Energy Management System (certified by Bureau Veritas, valid to 2027)\nISO 45001:2018 - Occupational Health & Safety Management (certified by DNV, valid to 2026)\nISO 9001:2015 - Quality Management System (certified by TÜV SÜD, valid to 2026)\nEU ETS - EU Emissions Trading Scheme participant\nOdense Municipality Environmental Permit - Surface Treatment Operations (ref. OD-2021-0447)',

  // B11 Corporate Conduct
  corruptionConvictions: '0',
  corruptionFinesTotal: '0',
  corruptionNarrative: '<p>NordGreen maintains a zero-tolerance policy on corruption, bribery, and anti-competitive behaviour, set out in our Code of Business Conduct. All employees complete mandatory e-learning on anti-corruption annually; completion rate was 97% in 2024. No cases of corruption or bribery were identified, investigated, or confirmed during the reporting year. A confidential whistleblowing channel received two reports in 2024; both were assessed as unrelated to corruption or misconduct.</p>',

  images: {
    coverPhoto:          'data:image/svg+xml;base64,' + btoa(_coverSVG),
    companyPhoto:        'data:image/svg+xml;base64,' + btoa(_companySVG),
    workforcePhoto:      'data:image/svg+xml;base64,' + btoa(_workforceSVG),
    esgEnvironmentPhoto: 'data:image/svg+xml;base64,' + btoa(_companySVG),
    esgSocialPhoto:      'data:image/svg+xml;base64,' + btoa(_workforceSVG),
    esgGovernancePhoto:  'data:image/svg+xml;base64,' + btoa(_govSVG),
  },
}

export default demoData
