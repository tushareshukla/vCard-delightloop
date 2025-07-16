// Test URLs for development and testing purposes
const TEST_LINKEDIN_URLS = [
    //"https://www.linkedin.com/in/deborah-lin/",
    "https://www.linkedin.com/in/drkm/"
    //"https://www.linkedin.com/in/williamhgates/"
];

interface LinkedInUserResponse {
    lead: {
        first_name: string;
        last_name: string;
        job_title: string;
        company_url: string;
        profile_url: string;
        profile_picture?: string;
        location_country?: string;
        location_city?: string;
    };
}

interface CompanyDetails {
    company_type: string;
    industry: string;
    name: string;
    specialities: string[];
    headcount_range: string;
    hq_country: string;
}

interface LinkedInCompanyResponse {
    amount: number;
    company: {
        company_type: string;
        name: string;
        industry: string;
        specialities: string[];
        headcount_range: string;
        hq_country: string;
        linkedin_link: string;
    };
}

interface LinkedInCompaniesResponse {
    companies: Array<{
        name: string;
        linkedin_link: string;
        headcount_range: string;
        hq_country: string;
        industry: string;
        specialities: string[];
    }>;
    amount: number;
    time_cached: string | null;
}

interface LinkedInLeadsResponse {
    leads: Array<{
        first_name: string;
        last_name: string;
        job_title: string;
        linkedin_url: string;
        profile_photo?: string;
        location_country?: string;
        location_city?: string;
    }>;
}

interface SimilarProfile {
    id: string;
    name: string;
    email: string;
    company: string;
    jobtitle: string;
    phone: string;
    linkedin_url: string;
    linkedin?: string;
    photo: string;
    country: string;
    city: string;
}

interface IcpSearchParams {
    company_types: string[];
    locations: string[];
    industries: string[];
    keywords: string[];
    headcounts: string[];
    limit_by: number;
}

interface IcpLeadSearchParams {
    company_link: string;
    locations: string[];
    personas: [string, string[], string[], string[]][];
    limit_by: number;
    company_headcounts: string[];
}

export class LinkedInService {
    private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
        try {
            const response = await fetch('/api/linkedin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint,
                    data
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }

            const responseData = await response.json();
            if (responseData.error) {
                throw new Error(responseData.error);
            }

            return responseData;
        } catch (error) {
            console.error(`LinkedIn API error for endpoint ${endpoint}:`, error);
            throw new Error(`Failed to fetch from ${endpoint}: ${error.message}`);
        }
    }

    async getUserDetails(linkedinUrl: string): Promise<LinkedInUserResponse> {
        return this.makeRequest<LinkedInUserResponse>('leads/by_link/', {
            comments: false,
            url: linkedinUrl
        });
    }

    async getCompanyDetails(companyUrl: string): Promise<LinkedInCompanyResponse> {
        return this.makeRequest<LinkedInCompanyResponse>('companies/by_link/', {
            url: companyUrl
        });
    }

    private getCompanyTypes(type: string): string[] {
        const defaultTypes = [
            "Public Company",
            "Self Employed",
            "Self Owned",
            "Privately Held",
            "Partnership"
        ];
        return type ? [type, ...defaultTypes] : defaultTypes;
    }

    // Method to get test URLs
    // getTestUrls(): string[] {
    //     return TEST_LINKEDIN_URLS;
    // }

    async findSimilarProfiles(
        linkedinUrls: string[],
        selectedNumber: number
    ): Promise<SimilarProfile[]> {
        const similarProfiles: SimilarProfile[] = [];

        // Use test URLs for development, comment out for production
        //const urlsToProcess = TEST_LINKEDIN_URLS;
        // Uncomment below line for production
        const urlsToProcess = linkedinUrls;

        for (const linkedinUrl of urlsToProcess) {
            try {
                // Step 1: Get user details
                const userData = await this.getUserDetails(linkedinUrl);
                console.log('Step 1 - User Details:', userData);

                if (!userData?.lead?.company_url) {
                    console.log('No company URL found for profile:', linkedinUrl);
                    continue;
                }

                // Step 2: Get company details
                const companyData = await this.getCompanyDetails(userData.lead.company_url);
                console.log('Step 2 - Company Details:', companyData);

                // Step 3: Prepare ICP search parameters
                const icpParams: IcpSearchParams = {
                    company_types: this.getCompanyTypes(companyData.company.company_type),
                    locations: [companyData.company.hq_country || "United States"],
                    industries: [companyData.company.industry],
                    keywords: companyData.company.specialities || [],
                    headcounts: [companyData.company.headcount_range],
                    limit_by: selectedNumber || 15
                };
                console.log('Step 3 - Search Parameters:', icpParams);

                // Step 4: Find similar companies
                const similarCompanies = await this.getSimilarCompanies(icpParams);
                console.log('Step 4 - Similar Companies:', similarCompanies);

                // Step 5: Find similar profiles in those companies (limit to 3 companies)
                for (const company of similarCompanies.companies.slice(0, 3)) {
                    try {
                        console.log('Processing company:', company.name);
                        const similarLeads = await this.getSimilarLeads(
                            company.linkedin_link,
                            userData.lead.job_title,
                            company.hq_country || "United States",
                            company.headcount_range,
                            Math.ceil(selectedNumber / 3) // Divide profiles among companies
                        );
                        console.log('Similar Leads for company:', company.name, similarLeads);

                        // Transform and add to similarProfiles array
                        similarLeads.leads.forEach((lead) => {
                            similarProfiles.push({
                                id: lead.linkedin_url,
                                name: `${lead.first_name} ${lead.last_name}`,
                                email: '',
                                company: company.name,
                                jobtitle: lead.job_title,
                                phone: '',
                                linkedin_url: lead.linkedin_url,
                                photo: lead.profile_photo || '',
                                country: lead.location_country || '',
                                city: lead.location_city || ''
                            });
                        });
                    } catch (error) {
                        console.error(`Error processing company ${company.name}:`, error);
                        continue; // Continue with next company if one fails
                    }
                }
            } catch (error) {
                console.error('Error processing LinkedIn URL:', linkedinUrl, error);
            }
        }

        console.log('Final similar profiles:', similarProfiles);
        return similarProfiles;
    }

    async getSimilarCompanies(
        params: IcpSearchParams
    ): Promise<LinkedInCompaniesResponse> {
        return this.makeRequest<LinkedInCompaniesResponse>('companies/by_icp/', {
            company_types: params.company_types,
            locations: params.locations,
            industries: params.industries,
            keywords: params.keywords,
            headcounts: params.headcounts,
            limit_by: params.limit_by
        });
    }

    async getSimilarLeads(
        companyLink: string,
        jobTitle: string,
        location: string,
        headcount: string,
        limitBy: number
    ): Promise<LinkedInLeadsResponse> {
        // Create persona based on job title
        const persona: [string, string[], string[], string[]] = [
            jobTitle,
            [jobTitle], // exact matches
            [jobTitle], // similar roles
            ["Assistant", "Intern", "Student"] // excluded roles
        ];

        const params: IcpLeadSearchParams = {
            company_link: companyLink,
            locations: [location],
            personas: [persona],
            limit_by: limitBy,
            company_headcounts: [headcount]
        };

        return this.makeRequest<LinkedInLeadsResponse>('leads/by_icp/', params);
    }
}

export const linkedInService = new LinkedInService(); 