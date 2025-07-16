interface OceanPeopleFilters {
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

interface OceanSearchResponse {
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

class OceanService {
  private apiToken: string;
  private baseUrl: string = 'https://api.ocean.io/v3';

  constructor() {
    this.apiToken = process.env.OCEAN_API_TOKEN || '';
  }

  private generateDummyProfile(index: number) {
    const companies = ['Google', 'Microsoft', 'Apple', 'Meta', 'Amazon', 'Netflix', 'Tesla', 'IBM'];
    const jobTitles = ['Software Engineer', 'Product Manager', 'Marketing Director', 'Sales Manager', 'CEO', 'CTO'];
    const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia'];
    const cities = ['New York', 'London', 'Berlin', 'Paris', 'Toronto', 'Sydney'];
    
    return {
      id: `dummy-${Date.now()}-${index}`,
      name: `John Doe ${index}`,
      email: `johndoe${index}@example.com`,
      phone: '',
      linkedin: `https://linkedin.com/in/johndoe${index}`,
      company: companies[Math.floor(Math.random() * companies.length)],
      jobtitle: jobTitles[Math.floor(Math.random() * jobTitles.length)],
      photo: `https://i.pravatar.cc/150?img=${index}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      city: cities[Math.floor(Math.random() * cities.length)]
    };
  }

  private async getDummyProfiles(count: number) {
    const profiles = [];
    
    for (let i = 0; i < count; i++) {
      // Add a 5-second delay for each profile
      await new Promise(resolve => setTimeout(resolve, 5000));
      profiles.push(this.generateDummyProfile(i + 1));
    }
    
    return profiles;
  }

  async findSimilarProfiles(linkedinUrls: string[], count: number = 50) {
    try {
      const peopleFilters: OceanPeopleFilters = {
        lookalikeLinkedinHandles: linkedinUrls.map(url => 
          url.replace(/^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?/i, '')
        )
      };

      const response = await fetch(
        `${this.baseUrl}/search/people?apiToken=${this.apiToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            size: count,
            peopleFilters,
            jobTitleThreshold: 0.8
          })
        }
      );

      if (!response.ok) {
        console.log('Ocean API failed, returning dummy data');
        return this.getDummyProfiles(count);
      }

      const data: OceanSearchResponse = await response.json();

      return data.people.map(person => ({
        id: person.id,
        name: person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
        email: person.email?.address || '',
        phone: '',
        linkedin: person.linkedinUrl || '',
        company: person.company.name || '',
        jobtitle: person.jobTitle || '',
        photo: person.photo || '',
        country: person.country || '',
        city: person.location?.split(',')[0] || ''
      }));

    } catch (error) {
      console.error('Error in Ocean.io findSimilarProfiles:', error);
      console.log('Returning dummy data due to API error');
      return this.getDummyProfiles(count);
    }
  }

  async validateApiToken(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/people?apiToken=${this.apiToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            size: 1,
            peopleFilters: {
              lookalikeLinkedinHandles: []
            }
          })
        }
      );

      return response.status !== 403;
    } catch (error) {
      return false;
    }
  }
}

export const oceanService = new OceanService();
