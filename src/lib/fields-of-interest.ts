export const FIELDS_OF_INTEREST = {
  "Software Engineering": {
  placeholder: "e.g., Backend or Frontend Engineer",
  subFields: [
    "Backend & API Development",
    "Frontend & Web Development",
    "Mobile & Embedded Development",
    "Quality, Tools & Test Automation"
  ]
},
"Data & AI": {
  placeholder: "e.g., Data Scientist / ML Engineer",
  subFields: [
    "Data Science & Analytics",
    "Data Engineering & Pipelines",
    "Machine Learning & MLOps",
    "Business Intelligence & Reporting"
  ]
},
"Cloud & Infrastructure": {
  placeholder: "e.g., Cloud / DevOps Engineer",
  subFields: [
    "Cloud Architecture & Platform",
    "DevOps & CI/CD",
    "Site Reliability & Performance",
    "Networking & Systems"
  ]
},
"Security & Privacy": {
  placeholder: "e.g., Security Engineer",
  subFields: [
    "Application & Software Security",
    "Cloud & Infrastructure Security",
    "Privacy, Policy & Compliance",
    "Threat Detection & Incident Response"
  ]
},
"Product & Design": {
  placeholder: "e.g., Product Manager / Designer",
  subFields: [
    "Product Management & Strategy",
    "UX/UI & User Research",
    "Design Systems & Prototyping",
    "Growth, Analytics & Experimentation"
  ]
},
  "Business & Finance": {
    placeholder: "e.g., Business Analyst",
    subFields: [
      "Marketing (General)",
      "Digital Marketing",
      "Performance Marketing",
      "Sales",
      "Finance & Accounting",
      "Human Resources (HR)",
      "Operations Management",
      "Business Analyst",
      "Product Management",
      "Investment Banking",
      "Management Consulting",
      "Corporate Strategy",
      "Venture Capital & Private Equity",
      "Risk Management"
    ]
  },
  "Healthcare": {
    placeholder: "e.g., Healthcare Administrator",
    subFields: [
      "Nursing",
      "Healthcare Administration",
      "Medical Research",
      "Public Health",
      "Pharmaceuticals",
      "Medical Devices",
      "Clinical Trials",
      "Physiotherapy & Rehabilitation",
      "Health Informatics"
    ]
  },
  "Creative & Media": {
    placeholder: "e.g., Graphic Designer",
    subFields: [
      "Graphic Design",
      "Content Writing & Strategy",
      "Video Production",
      "Journalism & Reporting",
      "Public Relations",
      "Animation",
      "Photography",
      "Podcasting",
      "Copywriting",
      "Creative Direction"
    ]
  },
  "Engineering (Core)": {
    placeholder: "e.g., Mechanical Engineer",
    subFields: [
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering",
      "Chemical Engineering",
      "Aerospace Engineering",
      "Industrial Engineering",
      "Materials Engineering",
      "Systems Engineering"
    ]
  },
  "Education": {
    placeholder: "e.g., Curriculum Developer",
    subFields: [
      "K-12 Teaching",
      "Higher Education",
      "Instructional Design",
      "EdTech (Education Technology)",
      "Corporate Training",
      "Academic Research",
      "Special Education"
    ]
  },

  // New / expanded categories
  "Legal & Compliance": {
    placeholder: "e.g., Corporate Counsel",
    subFields: [
      "Corporate Law",
      "Compliance & Regulatory Affairs",
      "Intellectual Property",
      "Contract Law",
      "Litigation",
      "Privacy & Data Protection"
    ]
  },
  "Environment & Sustainability": {
    placeholder: "e.g., Sustainability Analyst",
    subFields: [
      "Environmental Science",
      "Sustainability & CSR",
      "Renewable Energy",
      "Climate Policy",
      "Conservation & Ecology",
      "Waste Management"
    ]
  },
  "Trades & Skilled Labor": {
    placeholder: "e.g., Electrician",
    subFields: [
      "Electrician",
      "Plumbing",
      "Carpentry",
      "HVAC",
      "Welding",
      "Automotive Technician",
      "Construction Worker"
    ]
  },
  "Research & Academia": {
    placeholder: "e.g., Research Scientist",
    subFields: [
      "Basic Research",
      "Applied Research",
      "Clinical Research",
      "Laboratory Technician",
      "Academic Administration",
      "Grant Writing"
    ]
  },
  "Entrepreneurship & Startups": {
    placeholder: "e.g., Founder / Startup Operator",
    subFields: [
      "Startup Founding",
      "Incubators & Accelerators",
      "Startup Operations",
      "Growth & Acquisition",
      "Fundraising",
      "Product & Market Fit"
    ]
  },
  "Government & Public Policy": {
    placeholder: "e.g., Policy Analyst",
    subFields: [
      "Public Policy",
      "Diplomacy",
      "Urban Planning",
      "Regulatory Affairs",
      "Public Administration",
      "Defense & Security"
    ]
  },
  "Hospitality & Travel": {
    placeholder: "e.g., Hotel Manager",
    subFields: [
      "Hotel & Resort Management",
      "Travel & Tourism",
      "Food & Beverage Management",
      "Event Management",
      "Customer Experience"
    ]
  },
  "Logistics & Supply Chain": {
    placeholder: "e.g., Supply Chain Analyst",
    subFields: [
      "Supply Chain Management",
      "Procurement",
      "Warehouse Operations",
      "Transportation & Shipping",
      "Inventory Management",
      "Fleet Management"
    ]
  },
  "Real Estate & Property": {
    placeholder: "e.g., Property Manager",
    subFields: [
      "Residential Real Estate",
      "Commercial Real Estate",
      "Property Management",
      "Real Estate Development",
      "Facility Management",
      "Real Estate Investment"
    ]
  },
  "Arts & Entertainment": {
    placeholder: "e.g., Music Producer",
    subFields: [
      "Performing Arts",
      "Film & TV Production",
      "Music Production",
      "Theatre Production",
      "Fine Arts",
      "Gallery & Curation"
    ]
  }
};

 /**
  * Finds the main category and sub-field for a given field of interest.
  * Case-insensitive and trims input to improve matching (returns first exact subfield match).
  * @param fieldOfInterest - The user's saved field (e.g., "Data Science & Analytics").
  * @returns An object with the category and field, or null if not found.
  */
 export function findFieldDetails(fieldOfInterest: string | undefined | null): { category: string; field: string } | null {
   if (!fieldOfInterest) {
     return null;
   }

   const normalizedInput = fieldOfInterest.trim().toLowerCase();

   for (const category in FIELDS_OF_INTEREST) {
     const categoryData = FIELDS_OF_INTEREST[category as keyof typeof FIELDS_OF_INTEREST];
     // check exact (case-insensitive) subField match
     const matched = categoryData.subFields.find(sf => sf.toLowerCase() === normalizedInput);
     if (matched) {
       return {
         category,
         field: matched
       };
     }
   }

   // second pass: check substring / partial matches (e.g., "data science" -> "Data Science & Analytics")
   for (const category in FIELDS_OF_INTEREST) {
     const categoryData = FIELDS_OF_INTEREST[category as keyof typeof FIELDS_OF_INTEREST];
     const matched = categoryData.subFields.find(sf => sf.toLowerCase().includes(normalizedInput) || normalizedInput.includes(sf.toLowerCase()));
     if (matched) {
       return {
         category,
         field: matched
       };
     }
   }

   // Fallback if no match found
   return null;
 }
