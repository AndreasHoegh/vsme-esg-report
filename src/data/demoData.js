// Demo data: NordGreen Manufacturing A/S — fictional Danish metal components company
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

  // B2 Policies & Actions — 10 topic areas × 3 columns
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

  // B7 Resources, Circular Economy & Waste
  usesCircularEconomy: 'yes',
  circularEconomyDescription: 'Metal swarf and off-cuts (steel, aluminium) are 100% sold to certified scrap metal recyclers under long-term agreements. Cardboard and plastic packaging from incoming components is sorted and collected for recycling. Chemical drums are returned to suppliers under a take-back scheme. We target zero waste to landfill by 2026.',
  totalWasteGenerated: '312',
  wasteUnit: 'tonnes',
  wasteHazardous: '18',
  wasteNonHazardous: '294',
  wasteRecycled: '268',
  wasteRecycledForReuse: '24',
  wasteToIncineration: '14',
  wasteDisposedLandfill: '6',
  materialFlowDescription: 'Primary input materials: steel coil (85% of material input by weight), aluminium sheet (10%), process chemicals (5%). Total material throughput 2024: ~4,800 tonnes.',
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
  payNarrative: '<p>All NordGreen employees receive remuneration above the applicable Danish minimum wage. 78% of employees are covered by a collective bargaining agreement with the Danish Metal Workers Union (Dansk Metal). The gender pay gap of 6.7% (female average salary as a percentage of male) reflects an underrepresentation of women in senior technical and management roles; a pay equity review was conducted in Q4 2024 and targeted adjustments totalling EUR 34,000 were made. Average training investment of EUR 753 per employee includes both mandatory safety training and technical skills development.</p>',

  // B11 Corporate Conduct
  corruptionConvictions: '0',
  corruptionFinesTotal: '0',
  corruptionNarrative: '<p>NordGreen maintains a zero-tolerance policy on corruption, bribery, and anti-competitive behaviour, set out in our Code of Business Conduct (publicly available on our website). All employees complete mandatory e-learning on anti-corruption annually; completion rate was 97% in 2024. No cases of corruption or bribery were identified, investigated, or confirmed during the reporting year. No fines, penalties, or non-monetary sanctions for corporate misconduct were imposed. A confidential whistleblowing channel managed by an independent third party received two reports in 2024; both were assessed as unrelated to corruption or misconduct.</p>',

  images: {},
}

export default demoData
