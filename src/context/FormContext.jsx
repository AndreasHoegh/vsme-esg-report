import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const FormContext = createContext(null)
const STORAGE_KEY = 'vsme_esg_draft'

// ─── Which fields indicate a step has meaningful data (for sidebar checkmark) ──
const STEP_INDICATOR_FIELDS = [
  ['companyName', 'country', 'sector', 'employeeCount'],                          // B1
  ['policyClimate', 'policyPollution', 'policyOwnWorkforce'],                     // B2
  ['totalEnergyConsumption', 'scope1Emissions', 'scope2Emissions'],               // B3
  ['hasPollutionReporting'],                                                       // B4
  ['hasBiodiversitySites'],                                                        // B5
  ['totalWaterWithdrawal'],                                                        // B6
  ['totalWasteGenerated', 'usesCircularEconomy'],                                  // B7
  ['totalEmployees', 'permanentEmployees', 'maleEmployees'],                       // B8
  ['workRelatedInjuries', 'workRelatedFatalities'],                                // B9
  ['minimumWageCompliance', 'collectiveBargainingCoverage', 'avgTrainingHours'],   // B10
  ['corruptionConvictions'],                                                       // B11
]

// ─── All fields counted toward the completion % ───────────────────────────────
const ALL_TRACKED_FIELDS = [
  // B1
  'companyName', 'legalForm', 'country', 'sector', 'employeeCount',
  'reportingYear', 'balanceSum', 'revenue', 'reportingBasis',
  // B2
  'policyClimate', 'policyPollution', 'policyWaterMarine', 'policyBiodiversity',
  'policyCircular', 'policyOwnWorkforce', 'policyValueChain', 'policyCommunities',
  'policyConsumers', 'policyGovernance',
  // B3
  'totalEnergyConsumption', 'renewableEnergyConsumption',
  'scope1Emissions', 'scope2Emissions',
  // B4
  'hasPollutionReporting',
  // B5
  'hasBiodiversitySites',
  // B6
  'totalWaterWithdrawal', 'waterDischarge',
  // B7
  'totalWasteGenerated', 'wasteHazardous', 'wasteRecycled', 'usesCircularEconomy',
  // B8
  'totalEmployees', 'permanentEmployees', 'maleEmployees', 'femaleEmployees', 'employeeTurnover',
  // B9
  'workRelatedInjuries', 'workRelatedFatalities',
  // B10
  'minimumWageCompliance', 'collectiveBargainingCoverage', 'avgTrainingHours',
  'avgTrainingHoursMale', 'avgTrainingHoursFemale',
  // B11
  'corruptionConvictions',
]

function isFilled(val) {
  if (val === null || val === undefined) return false
  return String(val).trim() !== ''
}

// ─── Initial data ─────────────────────────────────────────────────────────────
const initialData = {
  // B1 General Information
  companyName: '', legalForm: '', registrationNumber: '', country: '', sector: '',
  naceCode: '', employeeCount: '', reportingYear: new Date().getFullYear().toString(),
  reportingPeriodStart: '', reportingPeriodEnd: '', currency: 'EUR',
  balanceSum: '', revenue: '',
  reportingBasis: '', // 'individual' or 'consolidated'
  reportingModule: '', // 'basic' or 'basic_extended'
  contactName: '', contactEmail: '', contactPhone: '',
  companyDescription: '',

  // B2 Policies & Actions — 10 topic areas × 3 columns
  policyClimate: '', policyClimatePublic: '', policyClimateTargets: '',
  policyPollution: '', policyPollutionPublic: '', policyPollutionTargets: '',
  policyWaterMarine: '', policyWaterMarinePublic: '', policyWaterMarineTargets: '',
  policyBiodiversity: '', policyBiodiversityPublic: '', policyBiodiversityTargets: '',
  policyCircular: '', policyCircularPublic: '', policyCircularTargets: '',
  policyOwnWorkforce: '', policyOwnWorkforcePublic: '', policyOwnWorkforceTargets: '',
  policyValueChain: '', policyValueChainPublic: '', policyValueChainTargets: '',
  policyCommunities: '', policyCommunitiesPublic: '', policyCommunitiesTargets: '',
  policyConsumers: '', policyConsumersPublic: '', policyConsumersTargets: '',
  policyGovernance: '', policyGovernancePublic: '', policyGovernanceTargets: '',

  // B3 Energy & GHG
  totalEnergyConsumption: '', energyUnit: 'MWh',
  renewableEnergyConsumption: '', nonRenewableEnergyConsumption: '',
  electricityConsumption: '', naturalGasConsumption: '',
  fuelOilConsumption: '', districtHeatingConsumption: '',
  gasUnit: 'm³', fuelOilUnit: 'L', districtUnit: 'MWh',
  hasEnergyManagementSystem: '', energyReductionTarget: '', energyNarrative: '',
  // B3 GHG
  scope1Emissions: '', scope2Emissions: '', scope3Emissions: '',
  ghgUnit: 'tCO2e', ghgBaseYear: '', ghgReductionTarget: '',
  methodologyDescription: '', ghgNarrative: '',

  // B4 Pollution
  hasPollutionReporting: '',
  pollutionDescription: '',
  pollutionNarrative: '',

  // B5 Biodiversity
  hasBiodiversitySites: '',
  biodiversityDescription: '',
  landUseTotal: '', landUseSensitive: '',
  biodiversityNarrative: '',

  // B6 Water
  totalWaterWithdrawal: '', waterUnit: 'm³',
  waterFromStressedAreas: '', waterRecycled: '',
  waterDischarge: '', waterDischargeDestination: '',
  waterNarrative: '',

  // B7 Resources, Circular Economy & Waste
  usesCircularEconomy: '',
  circularEconomyDescription: '',
  totalWasteGenerated: '', wasteUnit: 'tonnes',
  wasteHazardous: '', wasteNonHazardous: '',
  wasteRecycled: '', wasteRecycledForReuse: '',
  wasteToIncineration: '', wasteDisposedLandfill: '',
  materialFlowDescription: '',
  wasteNarrative: '',

  // B8 Workforce Characteristics
  totalEmployees: '', permanentEmployees: '', temporaryEmployees: '',
  fullTimeEmployees: '', partTimeEmployees: '',
  maleEmployees: '', femaleEmployees: '', otherGenderEmployees: '', notRegisteredGender: '',
  employeesUnder30: '', employees30to50: '', employeesOver50: '',
  employeesByCountry: '',
  newHires: '', employeeTurnover: '',
  nonEmployeeWorkers: '',
  workforceNarrative: '',

  // B9 Health & Safety
  workRelatedInjuries: '', workRelatedFatalities: '',
  fatalitiesFromIllHealth: '',
  workRelatedIllHealth: '', sickLeaveDays: '', lostDays: '',
  hasOHSManagementSystem: '', ohsCertification: '',
  safetyNarrative: '',

  // B10 Pay & Training
  minimumWageCompliance: '',
  maleAvgSalary: '', femaleAvgSalary: '',
  collectiveBargainingCoverage: '',
  avgTrainingHours: '',
  avgTrainingHoursMale: '', avgTrainingHoursFemale: '', avgTrainingHoursOther: '',
  trainingInvestment: '',
  payNarrative: '',

  // B11 Corporate Conduct
  corruptionConvictions: '',
  corruptionFinesTotal: '',
  corruptionNarrative: '',

  // Meta
  images: {},
}

export function FormProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...initialData, ...JSON.parse(saved) } : initialData
    } catch { return initialData }
  })

  const [currentStep, setCurrentStep] = useState(0)
  const [lastSaved, setLastSaved] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const { images, ...saveable } = data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveable))
        setLastSaved(new Date())
      } catch {}
    }, 800)
    return () => clearTimeout(t)
  }, [data])

  const update = useCallback((fields) => setData(prev => ({ ...prev, ...fields })), [])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setData(initialData)
    setCurrentStep(0)
  }, [])

  // Computed: which steps have at least one filled indicator field
  const completedSteps = useMemo(() =>
    STEP_INDICATOR_FIELDS
      .map((fields, i) => ({ i, filled: fields.some(f => isFilled(data[f])) }))
      .filter(({ filled }) => filled)
      .map(({ i }) => i),
    [data]
  )

  // Completion %: how many tracked fields are filled
  const completionPercent = useMemo(() => {
    const filled = ALL_TRACKED_FIELDS.filter(f => isFilled(data[f])).length
    return Math.round((filled / ALL_TRACKED_FIELDS.length) * 100)
  }, [data])

  return (
    <FormContext.Provider value={{
      data, update, currentStep, setCurrentStep,
      completedSteps, clearDraft, lastSaved, completionPercent,
    }}>
      {children}
    </FormContext.Provider>
  )
}

export const useForm = () => {
  const ctx = useContext(FormContext)
  if (!ctx) throw new Error('useForm must be used within FormProvider')
  return ctx
}
