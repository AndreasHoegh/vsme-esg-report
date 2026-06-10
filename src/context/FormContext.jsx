import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import demoData from "../data/demoData";

const FormContext = createContext(null);
const STORAGE_KEY = "vsme_esg_draft";
const IMAGES_KEY = "vsme_esg_images";

// ─── Which fields indicate a step has meaningful data (for sidebar checkmark) ──
const STEP_INDICATOR_FIELDS = [
  ["companyName", "country", "sector", "employeeCount"], // B1
  ["policyClimate", "policyPollution", "policyOwnWorkforce"], // B2
  ["totalEnergyConsumption", "scope1Emissions", "scope2Emissions"], // B3
  ["hasPollutionReporting"], // B4
  ["hasBiodiversitySites"], // B5
  ["totalWaterWithdrawal"], // B6
  ["wasteTypes", "usesCircularEconomy"], // B7
  ["totalEmployees", "permanentEmployees", "maleEmployees"], // B8
  ["workRelatedInjuries", "workRelatedFatalities"], // B9
  ["minimumWageCompliance", "collectiveBargainingCoverage", "avgTrainingHours"], // B10
  ["corruptionConvictions"], // B11
];

// ─── All fields counted toward the completion % ───────────────────────────────
const ALL_TRACKED_FIELDS = [
  // B1
  "companyName",
  "legalForm",
  "country",
  "sector",
  "employeeCount",
  "reportingYear",
  "balanceSum",
  "revenue",
  "reportingBasis",
  // B2
  "policyClimate",
  "policyPollution",
  "policyWaterMarine",
  "policyBiodiversity",
  "policyCircular",
  "policyOwnWorkforce",
  "policyValueChain",
  "policyCommunities",
  "policyConsumers",
  "policyGovernance",
  // B3
  "totalEnergyConsumption",
  "renewableEnergyConsumption",
  "scope1Emissions",
  "scope2Emissions",
  // B4
  "hasPollutionReporting",
  // B5
  "hasBiodiversitySites",
  // B6
  "totalWaterWithdrawal",
  "waterDischarge",
  // B7
  "totalWasteGenerated",
  "wasteHazardous",
  "wasteRecycled",
  "usesCircularEconomy",
  // B8
  "totalEmployees",
  "permanentEmployees",
  "maleEmployees",
  "femaleEmployees",
  "employeeTurnover",
  // B9
  "workRelatedInjuries",
  "workRelatedFatalities",
  // B10
  "minimumWageCompliance",
  "collectiveBargainingCoverage",
  "avgTrainingHours",
  "avgTrainingHoursMale",
  "avgTrainingHoursFemale",
  // B11
  "corruptionConvictions",
];

function isFilled(val) {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) return val.length > 0;
  return String(val).trim() !== "";
}

// ─── Initial data ─────────────────────────────────────────────────────────────
const initialData = {
  // B1 General Information
  companyName: "",
  legalForm: "",
  registrationNumber: "",
  country: "",
  sector: "",
  naceCode: "",
  address: "",
  secondaryAddress: "",
  website: "",
  employeeCount: "",
  reportingYear: new Date().getFullYear().toString(),
  reportingPeriodStart: "",
  reportingPeriodEnd: "",
  currency: "EUR",
  balanceSum: "",
  revenue: "",
  reportingBasis: "", // 'individual' or 'consolidated'
  reportingModule: "", // 'basic' or 'basic_extended'
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  companyDescription: "",
  coverIntro: "", // long opening statement shown on the report cover
  sdgGoals: [],
  sdgNarrative: "",

  // B2 Policies & Actions — 10 topic areas × 3 columns
  policyClimate: "",
  policyClimatePublic: "",
  policyClimateTargets: "",
  policyPollution: "",
  policyPollutionPublic: "",
  policyPollutionTargets: "",
  policyWaterMarine: "",
  policyWaterMarinePublic: "",
  policyWaterMarineTargets: "",
  policyBiodiversity: "",
  policyBiodiversityPublic: "",
  policyBiodiversityTargets: "",
  policyCircular: "",
  policyCircularPublic: "",
  policyCircularTargets: "",
  policyOwnWorkforce: "",
  policyOwnWorkforcePublic: "",
  policyOwnWorkforceTargets: "",
  policyValueChain: "",
  policyValueChainPublic: "",
  policyValueChainTargets: "",
  policyCommunities: "",
  policyCommunitiesPublic: "",
  policyCommunitiesTargets: "",
  policyConsumers: "",
  policyConsumersPublic: "",
  policyConsumersTargets: "",
  policyGovernance: "",
  policyGovernancePublic: "",
  policyGovernanceTargets: "",

  // B3 Energy & GHG
  totalEnergyConsumption: "",
  energyUnit: "MWh",
  renewableEnergyConsumption: "",
  nonRenewableEnergyConsumption: "",
  electricityConsumption: "",
  naturalGasConsumption: "",
  fuelOilConsumption: "",
  districtHeatingConsumption: "",
  gasUnit: "m³",
  fuelOilUnit: "L",
  districtUnit: "MWh",
  hasEnergyManagementSystem: "",
  energyReductionTarget: "",
  energyNarrative: "",
  // B3 GHG
  ghgUnit: "tCO2e",
  // Scope 1 — direct
  scope1Emissions: "",
  scope1Stationary: "", // on-site combustion (boilers, generators)
  scope1Mobile: "", // company vehicles
  scope1Fugitive: "", // refrigerants, gas leaks
  scope1Process: "", // industrial process emissions
  // Scope 2 — purchased energy
  scope2Emissions: "", // market-based (primary figure)
  scope2LocationBased: "", // location-based (grid average)
  scope2Electricity: "", // purchased electricity component
  scope2Heating: "", // district heating / steam component
  // Scope 3 — value chain (voluntary)
  scope3Emissions: "", // total scope 3
  scope3BusinessTravel: "",
  scope3Commuting: "",
  scope3PurchasedGoods: "",
  scope3Waste: "",
  scope3UpstreamTransport: "",
  scope3DownstreamTransport: "",
  scope3UseOfProducts: "",
  ghgBaseYear: "",
  ghgReductionTarget: "",
  methodologyDescription: "",
  ghgNarrative: "",

  // B4 Pollution
  hasPollutionReporting: "",
  pollutionDescription: "",
  pollutionNarrative: "",

  // B5 Biodiversity
  hasBiodiversitySites: "",
  biodiversityDescription: "",
  landUseTotal: "",
  landUseSensitive: "",
  biodiversityNarrative: "",

  // B6 Water
  totalWaterWithdrawal: "",
  waterUnit: "m³",
  waterFromStressedAreas: "",
  waterRecycled: "",
  waterDischarge: "",
  waterDischargeDestination: "",
  waterNarrative: "",

  // B7 Resources, Circular Economy & Waste
  usesCircularEconomy: "",
  circularEconomyDescription: "",
  wasteTypes: [],
  wasteUnit: "tonnes",
  materialFlowDescription: "",
  wasteNarrative: "",

  // B8 Workforce Characteristics
  totalEmployees: "",
  permanentEmployees: "",
  temporaryEmployees: "",
  fullTimeEmployees: "",
  partTimeEmployees: "",
  maleEmployees: "",
  femaleEmployees: "",
  otherGenderEmployees: "",
  notRegisteredGender: "",
  employeesUnder30: "",
  employees30to50: "",
  employeesOver50: "",
  employeesByCountry: "",
  newHires: "",
  employeeTurnover: "",
  nonEmployeeWorkers: "",
  workforceNarrative: "",

  // B9 Health & Safety
  workRelatedInjuries: "",
  workRelatedFatalities: "",
  fatalitiesFromIllHealth: "",
  workRelatedIllHealth: "",
  sickLeaveDays: "",
  lostDays: "",
  hasOHSManagementSystem: "",
  ohsCertification: "",
  safetyNarrative: "",

  // B10 Pay & Training
  minimumWageCompliance: "",
  maleAvgSalary: "",
  femaleAvgSalary: "",
  collectiveBargainingCoverage: "",
  avgTrainingHours: "",
  avgTrainingHoursMale: "",
  avgTrainingHoursFemale: "",
  avgTrainingHoursOther: "",
  trainingInvestment: "",
  payNarrative: "",

  // B11 Corporate Conduct
  corruptionConvictions: "",
  corruptionFinesTotal: "",
  corruptionNarrative: "",

  // Appendix — Certifications & Standards
  certificationsList: "",

  // SDG per-goal narratives { "3": "text...", "7": "text..." }
  sdgGoalNarratives: {},

  // B3 Energy — renewable splits (for electricity/fuels split in report)
  electricityRenewable: "",
  districtHeatingRenewable: "",

  // ─── Comprehensive Module (Udvidet Modul) C1–C9 ──────────────────────────────
  // Only surfaced when reportingModule === 'comprehensive'. Each C point is
  // grouped in the report with its related Basic-module disclosure.

  // C1 — Strategy: business model & sustainability initiatives (with B1)
  c1Products: "",
  c1Markets: "",
  c1BusinessRelations: "",
  c1StrategyElements: "",

  // C2 — Description of policies, actions & future initiatives (with B2)
  // Keyed by the same topic keys as B2; values are narrative strings.
  c2Current: {},
  c2Future: {},
  c2ResponsibleLevel: "",

  // C3 — GHG reduction targets & climate transition (with B3)
  c3HasTargets: "",
  c3BaselineYear: "",
  c3Scope1Target: "",
  c3Scope2Target: "",
  c3Scope3Target: "",
  c3Scope1Baseline: "",
  c3Scope2Baseline: "",
  c3Scope3Baseline: "",
  c3Actions: "",
  c3TransitionPlan: "",

  // C4 — Climate risks (with B3 / Environment)
  c4HasRisks: "",
  c4PhysicalRisks: "", // chronic + acute hazards description
  c4TransitionRisks: "", // policy / tech / market / reputation
  c4TimeHorizon: "", // 'short' | 'medium' | 'long'
  c4Adaptation: "", // yes/no — adaptation actions started
  c4AdaptationDescription: "",
  c4FinancialImpact: "",

  // C5 — Additional workforce characteristics (with B8)
  c5FemaleManagers: "",
  c5MaleManagers: "",
  c5SelfEmployed: "",
  c5AgencyWorkers: "",

  // C6 — Human rights policies & processes, own workforce (with B8)
  c6HasPolicy: "",
  c6HasGrievance: "",
  c6CoversChildLabour: "",
  c6CoversForcedLabour: "",
  c6CoversTrafficking: "",
  c6CoversDiscrimination: "",
  c6CoversAccidentPrevention: "",
  c6CoversOther: "",

  // C7 — Severe negative human-rights incidents (with B8)
  c7ChildLabour: "",
  c7ForcedLabour: "",
  c7Trafficking: "",
  c7Discrimination: "",
  c7OwnWorkforceActions: "",
  c7ValueChainWorkers: "",
  c7ValueChainCommunities: "",
  c7ValueChainConsumers: "",

  // C8 — Revenues from certain sectors & EU benchmark exclusion (with B11)
  c8RevWeapons: "",
  c8RevTobacco: "",
  c8RevCoal: "",
  c8RevOil: "",
  c8RevGas: "",
  c8RevPesticides: "",
  c8BenchmarkCoal: "",
  c8BenchmarkOil: "",
  c8BenchmarkGas: "",
  c8BenchmarkElectricity: "",

  // C9 — Gender diversity in the top governance body (with B11)
  c9FemaleBoard: "",
  c9MaleBoard: "",

  // Meta
  images: {},
  excludedSections: [],
};

export function FormProvider({ children }) {
  // Indsæt dette øverst i FormProvider, hvis du ikke vil slette alt koden
  const images = [];
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const images = (() => {
        try {
          return JSON.parse(localStorage.getItem(IMAGES_KEY) || "{}");
        } catch {
          return {};
        }
      })();
      return saved
        ? { ...initialData, ...JSON.parse(saved), images }
        : { ...initialData, images };
    } catch {
      return initialData;
    }
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const { images, ...saveable } = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveable));
        try {
          localStorage.setItem(IMAGES_KEY, JSON.stringify(images || {}));
        } catch {}
        setLastSaved(new Date());
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [data]);

  const update = useCallback(
    (fields) => setData((prev) => ({ ...prev, ...fields })),
    [],
  );

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(IMAGES_KEY);
    localStorage.removeItem("vsme_canvas_draft");
    localStorage.removeItem("vsme_canvas_page_overrides");
    setData(initialData);
    setCurrentStep(0);
  }, []);

  const loadDemo = useCallback(() => {
    // Vi fjerner 'images' herfra, da vi ikke længere har data til dem
    const merged = { ...initialData, ...demoData };

    // Vi gemmer kun de data, vi har
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    // Vi fjerner referencen til IMAGES_KEY, da der ikke er noget at gemme
    localStorage.removeItem(IMAGES_KEY);

    localStorage.removeItem("vsme_canvas_draft");
    localStorage.removeItem("vsme_canvas_page_overrides");

    setData(merged);
    setCurrentStep(0);

    // VIGTIGT: Fjern 'images' fra dependency-arrayet herunder
  }, [initialData, demoData]);

  // Computed: which steps have at least one filled indicator field
  const completedSteps = useMemo(
    () =>
      STEP_INDICATOR_FIELDS.map((fields, i) => ({
        i,
        filled: fields.some((f) => isFilled(data[f])),
      }))
        .filter(({ filled }) => filled)
        .map(({ i }) => i),
    [data],
  );

  // Completion %: how many tracked fields are filled
  const completionPercent = useMemo(() => {
    const filled = ALL_TRACKED_FIELDS.filter((f) => isFilled(data[f])).length;
    return Math.round((filled / ALL_TRACKED_FIELDS.length) * 100);
  }, [data]);

  return (
    <FormContext.Provider
      value={{
        data,
        update,
        currentStep,
        setCurrentStep,
        completedSteps,
        clearDraft,
        loadDemo,
        lastSaved,
        completionPercent,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export const useForm = () => {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error("useForm must be used within FormProvider");
  return ctx;
};
