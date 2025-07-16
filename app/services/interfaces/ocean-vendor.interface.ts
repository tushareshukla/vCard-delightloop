export interface OceanPeopleFilters {
  lookalikeLinkedinHandles?: string[];
  countries?: string[];
  excludeLinkedinHandles?: string[];
  seniorities?: Array<'Owner' | 'Founder' | 'Board Member' | 'C-Level' | 'Partner' | 'VP' | 'Head' | 'Director' | 'Manager' | 'Other'>;
  jobTitleKeywords?: {
    allOf?: string[];
    anyOf?: string[];
    noneOf?: string[];
  };
}

export interface OceanCompanyFilters {
  companySizes?: Array<'0-1' | '2-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001-5000' | '5001-10000' | '10001-50000'>;
  primaryCountries?: string[];
  industries?: {
    industries: string[];
    mode?: 'anyOf' | 'allOf';
  };
}

export interface OceanSearchResponse {
  people: Array<{
    id: string;
    domain: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    country: string | null;
    location: string | null;
    linkedinUrl: string | null;
    jobTitle: string | null;
    photo: string | null;
    email?: {
      status: 'verified' | 'guessed' | 'catchAll' | 'notFound';
      address: string | null;
    };
    company: {
      name: string | null;
      logo: string | null;
      companySize: string | null;
    };
  }>;
  detail: string;
  total: number | null;
} 