import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const FormContext = createContext(null)

const STORAGE_KEY = 'vsme_esg_draft'

const initialData = {
  // B1 General Info
  companyName: '', legalForm: '', registrationNumber: '', country: '', sector: '',
  naceCode: '', employeeCount: '', reportingYear: new Date().getFullYear().toString(),
  reportingPeriodStart: '', reportingPeriodEnd: '', currency: 'EUR',
  contactName: '', contactEmail: '', contactPhone: '',
  companyDescription: '',

  // B2 Policies
  hasESGPolicy: '', esgPolicyDescription: '',
  hasBoardESGOversight: '', boardOversightDescription: '',
  hasCodeOfConduct: '', codeOfConductDescription: '',
  hasSupplierCode: '', supplierCodeDescription: '',

  // B3 Energy
  totalEnergyConsumption: '', energyUnit: 'MWh',
  renewableEnergyConsumption: '', nonRenewableEnergyConsumption: '',
  energyIntensity: '', energyIntensityUnit: '',
  hasEnergyManagementSystem: '', energyNarrative: '',

  // B4 GHG
  scope1Emissions: '', scope2Emissions: '', scope3Emissions: '',
  ghgUnit: 'tCO2e', ghgIntensity: '',
  ghgBaseYear: '', ghgReductionTarget: '',
  methodologyDescription: '', ghgNarrative: '',

  // B5 Water
  totalWaterWithdrawal: '', waterUnit: 'm³',
  waterFromStressedAreas: '', waterRecycled: '',
  hasWaterPolicy: '', waterNarrative: '',

  // B6 Waste
  totalWasteGenerated: '', wasteUnit: 'tonnes',
  wasteHazardous: '', wasteNonHazardous: '',
  wasteRecycled: '', wasteDisposedLandfill: '',
  hasWasteReductionTarget: '', wasteNarrative: '',

  // B7 Workforce
  totalEmployees: '', permanentEmployees: '', temporaryEmployees: '',
  fullTimeEmployees: '', partTimeEmployees: '',
  maleEmployees: '', femaleEmployees: '', otherGenderEmployees: '',
  employeesUnder30: '', employees30to50: '', employeesOver50: '',
  newHires: '', employeeTurnover: '',
  workersByRegion: '', workforceNarrative: '',

  // B8 Health & Safety
  workRelatedInjuries: '', workRelatedFatalities: '', lostDays: '',
  recordableIncidentRate: '', frequencyRate: '',
  hasOHSManagementSystem: '', ohsCertification: '',
  safetyNarrative: '',

  // B9 Pay & Benefits
  maleAvgSalary: '', femaleAvgSalary: '',
  payGapPercent: '',
  ceoToMedianWorkerRatio: '',
  minimumWageCompliance: '', livingWagePolicy: '',
  benefitsDescription: '', payNarrative: '',

  // B10 Social
  avgTrainingHours: '', trainingHoursMale: '', trainingHoursFemale: '',
  trainingInvestment: '',
  hasAntiDiscriminationPolicy: '',
  communityEngagement: '',
  socialNarrative: '',

  // B11 Governance
  boardSize: '', boardIndependentMembers: '',
  boardFemaleMembersPercent: '',
  hasAntiCorruptionPolicy: '', antiCorruptionTraining: '',
  whistleblowerMechanism: '',
  dataPrivacyPolicy: '',
  taxTransparency: '',
  governanceNarrative: '',

  // Meta
  images: {},
  completedSteps: [],
}

export function FormProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...initialData, ...JSON.parse(saved) } : initialData
    } catch {
      return initialData
    }
  })

  const [currentStep, setCurrentStep] = useState(0)
  const [lastSaved, setLastSaved] = useState(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const { images, ...saveable } = data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveable))
        setLastSaved(new Date())
      } catch {}
    }, 800)
    return () => clearTimeout(timeout)
  }, [data])

  const update = useCallback((fields) => {
    setData(prev => ({ ...prev, ...fields }))
  }, [])

  const markStepComplete = useCallback((step) => {
    setData(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step]
    }))
  }, [])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setData(initialData)
    setCurrentStep(0)
  }, [])

  const completionPercent = Math.round((data.completedSteps.length / 11) * 100)

  return (
    <FormContext.Provider value={{
      data, update, currentStep, setCurrentStep,
      markStepComplete, clearDraft, lastSaved, completionPercent
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
