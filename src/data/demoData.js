// Example data based on the Capra Robotics ApS VSME 2025 report.
// Basic-module content (B1, B3, B6, B7, B8, B9, B10, B11, SDG, CERT) mirrors that
// report; B2, B4 and B5 are intentionally left empty so they do not generate pages.
// Comprehensive-module (C1–C9) example data is also filled in and the report is set
// to 'comprehensive' so the C sections render. Switch Reporting Module back to
// "Basic" in step B1 to see the basic-only version. C2 has no content because it
// elaborates B2 policies, which are not used in this example.
const demoData = {
  // B1 General Information
  companyName: "Capra Robotics ApS",
  legalForm: "ApS",
  registrationNumber: "39052636",
  country: "Denmark",
  sector: "Manufacture of lifting and handling equipment",
  naceCode: "282200",
  address: "Skanderborgvej 232, 8260 Viby J, Denmark",
  secondaryAddress: "Sletvej 50Y. 8310 Tranbjerg J, Denmark",
  website: "https://capra.ooo/",
  employeeCount: "52",
  reportingYear: "2025",
  reportingPeriodStart: "2025-01-01",
  reportingPeriodEnd: "2025-12-31",
  currency: "DKK",
  balanceSum: "74323000",
  revenue: "", // Excluded — classified as confidential commercial information
  reportingBasis: "individual",
  reportingModule: "basic",
  contactName: "Alexander Mundt Schärfe",
  contactEmail: "Alexander@capra.ooo",
  contactPhone: "",
  companyDescription: `<p>Capra Robotics® is a Danish deep-tech company revolutionizing the use of mobile robots. We deliver end-to-end robotics solutions built on a patented, highly versatile wheel frame that delivers unmatched agility and robustness across indoor and outdoor environments.</p><p>We focus on developing robotics solutions that address concrete operational challenges. By providing adaptable, standardized solutions for inspection, logistics, and maintenance, we enable organizations to automate demanding tasks, strengthen process reliability, and scale their operations – allowing teams to focus on higher-value work.</p>`,
  coverIntro: `At Capra Robotics, we believe that understanding our environmental and social impact is part of building a responsible business. This is our first voluntary sustainability report, prepared in accordance with the VSME Basic Module (B1–B11). We have chosen to report ahead of regulation, both because our B2B customers increasingly expect transparent ESG data, and because we want to know our own footprint in order to reduce it.

Our direct operational footprint is modest, at 11.0 tCO₂e across scope 1 and 2 in 2025. The more significant impact lies in scope 3, particularly in the production of components for our robots. A preliminary screening indicates that the embedded footprint of our products is several times larger than our own operations, and this is where our reduction work needs to focus going forward.

We have chosen to be honest about what is still missing. Use-phase and end-of-life emissions are not yet quantified, and several circular economy initiatives are at the assessment stage rather than in operation. This report is a foundation to build on.

In accordance with the VSME standard's provisions for omissions, turnover has been excluded from this report as it is classified as confidential commercial information.`,

  // B3 Energy & GHG Emissions
  totalEnergyConsumption: "94776",
  energyUnit: "kWh",
  renewableEnergyConsumption: "90271",
  electricityConsumption: "74303",
  electricityRenewable: "74303",
  districtHeatingConsumption: "20472.70",
  districtHeatingRenewable: "15968",
  districtUnit: "kWh",
  naturalGasConsumption: "",
  fuelOilConsumption: "916",
  fuelOilUnit: "L",
  energyNarrative: `<p>Capra Robotics' direct climate footprint comes primarily from purchased energy and a small fleet of company vehicles used for sales and service visits. Scope 1 emissions (2.4 tCO₂e) stem from diesel consumption (916 L) for these vehicles. Scope 2 emissions (8.6 tCO₂e, market-based) reflect the energy use of our offices, development and assembly areas.</p><p>Our electricity is covered by a green electricity agreement with AURA, where consumption is matched with guarantees of origin from renewable sources such as wind, solar, hydropower and biomass. As a result, 100% of our purchased electricity is reported as renewable. We acknowledge that the physical electricity reaching our facilities is a mix of renewable and non-renewable sources, in line with the shared Danish grid, but our agreement ensures that an equivalent amount of renewable electricity is purchased on our behalf. Our district heating is 78% renewable, based on the supplier's reported mix.</p><p>While our operational footprint is modest, our scope 3 emissions are several times larger. A preliminary screening indicates a cradle-to-gate footprint of approximately 11.52 tCO₂e per year, allocated to procurement of components and materials. This figure covers the production of one of our products (the Capra 500) multiplied by 2025 sales volumes, and represents an order-of-magnitude estimate based on customs codes and component weight. It does not include use-phase emissions, end-of-life, transport or business travel, all of which remain to be quantified. Obtaining a full life-cycle assessment is a stated goal for the years ahead.</p>`,

  // B3 GHG
  scope1Emissions: "2.4",
  scope2Emissions: "8.6",
  scope3Emissions: "11.52",
  scope3PurchasedGoods: "11.52",
  ghgUnit: "tCO2e",

  // B6 Water
  totalWaterWithdrawal: "117.6",
  waterUnit: "m³",
  waterFromStressedAreas: "0",
  waterRecycled: "",
  waterDischarge: "117.6",
  waterDischargeDestination: "",
  waterNarrative: `<p>Capra Robotics operates from office, development and light assembly facilities. None of which involve water-intensive processes. Our total withdrawal of 117.6 m³ in 2025 stems from sanitary use, kitchen facilities and cleaning. We are not located in a water-stressed area. Water is not a material issue for our operations.</p>`,

  // B7 Resources & Circular Economy
  usesCircularEconomy: "yes",
  circularEconomyDescription: `Capra's products are built primarily from aluminium, steel and plastic — durable materials suited to harsh operating conditions. Our circular economy work is at an early stage and currently consists of three concrete actions: (1) we sort waste at our facilities and achieved a recycling rate of 27% in 2025, with 100% of metal, plastic and paper waste recycled; (2) we are testing repair and refurbishment options for end-of-life robots returned by customers; (3) we have begun evaluating design choices that affect recyclability, including the painting of aluminium parts, which currently complicates material recovery.

Areas under active assessment for 2026–2027 include: design for disassembly, a formalised take-back system, and a leasing/robot-as-a-service business model. These are explicitly described here as goals under evaluation, not implemented practices.`,
  wasteUnit: "kg",
  wasteTypes: [
    {
      id: "1",
      typeKey: "Paper & Cardboard",
      amount: "850",
      recycled: "850",
      hazardous: false,
    },
    {
      id: "2",
      typeKey: "Residual waste",
      amount: "1540",
      recycled: "0",
      hazardous: false,
    },
    {
      id: "3",
      typeKey: "Organic / Food Waste",
      amount: "1615",
      recycled: "0",
      hazardous: false,
    },
    {
      id: "4",
      typeKey: "Plastic",
      amount: "30",
      recycled: "30",
      hazardous: false,
    },
    {
      id: "5",
      typeKey: "Electronic Waste (e-waste)",
      amount: "71",
      recycled: "64",
      hazardous: false,
    },
    {
      id: "6",
      typeKey: "Metal / Scrap",
      amount: "225",
      recycled: "225",
      hazardous: false,
    },
  ],
  wasteNarrative: `<p>At our location, we sort waste according to current regulations, and reuse and recycle whenever possible.</p><p>We want to transition from a linear model of take-make-waste to a circular model that can help safeguard the world's finite resources and eliminate waste. Therefore, we will prioritize to focus on material efficiency in our innovation process and focus on reuse, upgrading customers' robots, and extending the product life.</p><p>Going forward, we will assess the possibility of incorporating "design for disassembly", which involves products' ability to be separated into components to help the recyclability of each individual part of the product. Additionally, we will assess the possibility of a take-back system for our robots and explore the possibility of developing a business model around leasing our robots.</p>`,

  // B8 Workforce
  totalEmployees: "52.3",
  permanentEmployees: "52.3",
  temporaryEmployees: "0",
  fullTimeEmployees: "",
  partTimeEmployees: "",
  maleEmployees: "46.6",
  femaleEmployees: "5.7",
  otherGenderEmployees: "0",
  notRegisteredGender: "0",
  newHires: "",
  employeeTurnover: "",
  nonEmployeeWorkers: "",
  workforceNarrative: `<p>Capra Robotics employed 52.3 people at year-end 2025, all on permanent, full-time contracts and located in Denmark. The team is 10.2% female, reflecting the broader gender imbalance in the Danish robotics industry.</p>`,

  // B9 Health & Safety
  workRelatedInjuries: "0",
  workRelatedFatalities: "0",
  fatalitiesFromIllHealth: "0",
  workRelatedIllHealth: "",
  sickLeaveDays: "548",
  lostDays: "0",
  hasOHSManagementSystem: "no",
  ohsCertification: "",
  safetyNarrative: `<p>We recorded zero injuries and zero fatalities in 2025. Total sick leave of 548 days corresponds to approximately 9.8 days per employee, in line with the Danish national average. We do not currently operate a certified OHS management system, but follow Danish working environment regulations and conduct regular workplace assessments (APV).</p>`,

  // B10 Pay & Training
  minimumWageCompliance: "yes",
  maleAvgSalary: "36476",
  femaleAvgSalary: "35151",
  collectiveBargainingCoverage: "100",
  avgTrainingHours: "8.04",
  avgTrainingHoursMale: "",
  avgTrainingHoursFemale: "",
  trainingInvestment: "",
  payNarrative: `<p>Our gender pay gap of 3.6% (male average DKK 36,476 vs. female DKK 35,151) is below the Danish national average. All employees are covered by collective bargaining agreements. Average training was 8.04 hours per employee in 2025.</p>`,

  // Appendix — Certifications
  certificationsList: "",

  // B11 Corporate Conduct
  corruptionConvictions: "0",
  corruptionFinesTotal: "0",
  corruptionNarrative: `<p>Capra Robotics is committed to the highest standards of integrity and legal compliance, we maintained a clean record in 2025 with zero confirmed incidents of corruption or anti-competitive conduct. Our business operations strictly adhere to Danish and EU competition law, GDPR, and all applicable tax regulations. These commitments are reinforced by our internal employee handbook and business code of conduct, which mandates ethical conduct across all levels of the organization.</p><p>Some of our Core Compliance Pillars:</p><p>AVOIDING CONFLICTS OF INTEREST<br>We pride ourselves on making decisions based on objective considerations and not to be improperly guided by personal interests. Our approach to conflicts of interest aligns with the OECD Guidelines, which call for ethical business conduct, transparency, and integrity in professional decisions and actions.</p><p>FREE COMPETITION<br>We adhere to the OECD Guidelines for fair competition and comply with antitrust regulations to promote fair and open markets. We refrain from engaging in concerted practices deliberately or incidentally designed to bypass, restrict, or distort competition as defined by antitrust laws, or abuse a dominant market position.</p><p>CORRUPTION<br>We adhere to UN Global Compact Principle 10, which emphasizes the importance of working against corruption, bribery, and extortion in all forms. This is reinforced by the OECD Guidelines' stance on transparent, ethical business conduct.</p><p>MONEY LAUNDERING<br>Capra Robotics complies with OECD Guidelines, which emphasize ethical financial practices and compliance with anti-money laundering regulations.</p><p>CONFLICT MINERALS<br>Our commitment to ethical sourcing aligns with the OECD Due Diligence Guidance for Responsible Supply Chains of Minerals, promoting conflict-free sourcing practices.</p><p>DATA PRIVACY AND DATA SECURITY<br>Capra Robotics upholds the OECD Guidelines on data privacy and security, adhering to best international practices and data protection laws to ensure all personal and sensitive information is securely handled.</p>`,

  // SDG — UN Sustainable Development Goals
  sdgGoals: [9, 11, 12, 13],
  sdgNarrative: `Capra Robotics aligns its environmental commitment with UN Sustainable Development Goals 9, 11, 12, and 13, which encourage precautionary approaches to environmental challenges, promoting greater environmental responsibility, and fostering environmentally friendly technologies. We also reference the OECD Guidelines' recommendations on responsible environmental management.`,
  sdgGoalNarratives: {
    9: "Our autonomous robots are designed to support industrial automation and infrastructure maintenance, contributing to more efficient and resilient industrial systems.",
    11: "Our maintenance robots (e.g. salt spreading, street cleaning) directly support cleaner, safer urban environments.",
    12: "Our work on circular economy — material recycling, exploring take-back and refurbishment — aligns with this goal. We acknowledge that implementation is at an early stage.",
    13: "By measuring and disclosing our scope 1, 2 and partial scope 3 emissions, we are working to understand and reduce our climate impact.",
  },

  // ─── Comprehensive Module (Udvidet Modul) C1–C9 ──────────────────────────────
  // C2 is omitted: it elaborates the B2 policy matrix, which is empty in this example.

  // C1 — Strategy: business model & sustainability initiatives (with B1)
  c1Products: `Capra Robotics designs and manufactures autonomous mobile robots (AMRs) built on a patented, highly versatile wheel frame. Our core platforms (including the Capra Hircus and Capra 500) are delivered with software and integration services for inspection, logistics, and maintenance tasks.`,
  c1Markets: `We sell primarily B2B to industrial, municipal, and facility-management customers across Europe, with a growing presence in North America. Sales run both directly and through a network of certified system-integrator partners.`,
  c1BusinessRelations: `Around 40 active suppliers provide electronics, motors, batteries, and machined aluminium and steel components, mainly in Denmark, Germany, and Eastern Europe. Customers range from utilities and municipalities to logistics and manufacturing firms. Robots reach end-users via direct sales and integration partners.`,
  c1StrategyElements: `Sustainability is embedded in our product strategy: durable, repairable hardware designed for a long service life, a shift toward circular business models (refurbishment and robot-as-a-service), and reducing the embedded carbon of our components — which represents the largest part of our footprint.`,

  // C3 — GHG reduction targets & climate transition (with B3)
  c3HasTargets: "yes",
  c3BaselineYear: "2025",
  c3Scope1Target: "-50% by 2030",
  c3Scope1Baseline: "2.4",
  c3Scope2Target: "-50% by 2030",
  c3Scope2Baseline: "8.6",
  c3Scope3Target: "Quantify and set a target by 2027",
  c3Scope3Baseline: "60",
  c3Actions: `Transition the company vehicle fleet to electric
Maintain 100% renewable electricity via guarantees of origin
Increase the renewable share of district heating
Engage key component suppliers on emission data and lower-carbon materials
Complete a full Scope 3 life-cycle assessment`,
  c3TransitionPlan: `Capra's transition plan focuses on the embedded carbon of our products, which a preliminary screening shows is several times larger than our operational footprint. In the near term we are decarbonising our own operations through fleet electrification and renewable energy. In the medium term we will work with suppliers to reduce component emissions and design products for lower lifecycle impact. A full life-cycle assessment, planned for 2026–2027, will allow us to set a science-based Scope 3 reduction target.`,

  // C4 — Climate risks (with B3 / Environment)
  c4HasRisks: "yes",
  c4PhysicalRisks: `As an asset-light company operating from offices and light-assembly facilities in Denmark, our direct physical climate exposure is low. The main chronic risk is potential disruption to our supply chain from extreme weather affecting component manufacturers and logistics in more exposed regions.`,
  c4TransitionRisks: `Transition risks include tightening EU product and battery regulations, growing customer expectations for low-carbon and circular products, and rising costs or constrained supply of low-carbon materials. These also represent an opportunity, as demand for energy-efficient automation is expected to grow.`,
  c4TimeHorizon: "medium",
  c4Adaptation: "yes",
  c4AdaptationDescription: `We are diversifying our supplier base and beginning to factor climate resilience into procurement and product-design decisions.`,
  c4FinancialImpact: `Climate-related risks are not currently assessed as material to short-term financial performance, but supply-chain and regulatory factors could affect component costs over the medium term.`,

  // C5 — Additional workforce characteristics (with B8)
  c5FemaleManagers: "1",
  c5MaleManagers: "6",
  c5SelfEmployed: "0",
  c5AgencyWorkers: "0",

  // C6 — Human rights policies & processes, own workforce (with B8)
  c6HasPolicy: "yes",
  c6HasGrievance: "yes",
  c6CoversChildLabour: "yes",
  c6CoversForcedLabour: "yes",
  c6CoversTrafficking: "yes",
  c6CoversDiscrimination: "yes",
  c6CoversAccidentPrevention: "yes",
  c6CoversOther: "Freedom of association and fair working conditions",

  // C7 — Severe negative human-rights incidents (with B8)
  c7ChildLabour: "no",
  c7ForcedLabour: "no",
  c7Trafficking: "no",
  c7Discrimination: "no",
  c7OwnWorkforceActions: "",
  c7ValueChainWorkers: "",
  c7ValueChainCommunities: "",
  c7ValueChainConsumers: "",

  // C8 — Revenues from certain sectors & EU benchmark exclusion (with B11)
  // Capra has no activity in these sectors, so revenue fields stay blank and the
  // company does not exceed any EU Paris-aligned benchmark exclusion threshold.
  c8BenchmarkCoal: "no",
  c8BenchmarkOil: "no",
  c8BenchmarkGas: "no",
  c8BenchmarkElectricity: "no",

  // C9 — Gender diversity in the top governance body (with B11)
  c9FemaleBoard: "1",
  c9MaleBoard: "4",
};

export default demoData;
