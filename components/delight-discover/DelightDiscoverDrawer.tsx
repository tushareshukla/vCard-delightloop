import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  ChevronUp,
  X,
  Search,
  Filter,
  Users,
  Building2,
  MapPin,
  Briefcase,
  Trophy,
  Calendar,
  Zap,
  Check,
  Plus,
  Target,
  Brain,
  TrendingUp,
  Globe,
  BarChart3,
  UserCheck,
  Lightbulb,
  Newspaper,
  Linkedin,
  Code,
  DollarSign,
  Sparkles,
  BookOpen,
  Filter as FilterIcon,
  ArrowRight,
  Bot,
  Star,
  TrendingUp as TrendIcon,
  AlertCircle,
  Sliders,
  Eye,
  Settings,
  ChevronRight,
  Minimize2,
  Maximize2,
  Info,
} from "lucide-react";

// Add scrollbar hiding styles and toggle animations
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Global Toggle Animations */
  @keyframes apple-toggle-shimmer {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(200%) rotate(45deg); }
  }
  
  @keyframes apple-toggle-liquid {
    0%, 100% { 
      transform: translateX(-20%) scale(1);
      opacity: 0.3;
    }
    50% { 
      transform: translateX(20%) scale(1.2);
      opacity: 0.6;
    }
  }
  
  @keyframes apple-toggle-pulse {
    0%, 100% { 
      transform: scale(0.4);
      opacity: 0.6;
    }
    50% { 
      transform: scale(0.6);
      opacity: 0.8;
    }
  }
  
  @keyframes apple-toggle-rotate {
    from { transform: scale(0.7) rotate(0deg); }
    to { transform: scale(0.7) rotate(360deg); }
  }
  
  @keyframes apple-toggle-checkmark {
    0% {
      opacity: 0;
      transform: scale(0.5) rotate(45deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }
  
  @keyframes apple-toggle-ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  @keyframes apple-toggle-fade-in {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

// Add the CSS to the document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = scrollbarHideStyles;
  if (!document.head.querySelector("style[data-scrollbar-hide]")) {
    styleElement.setAttribute("data-scrollbar-hide", "true");
    document.head.appendChild(styleElement);
  }
}

interface FilterSection {
  id: string;
  title: string;
  icon: any;
  isOpen: boolean;
  count: number;
}

interface DelightDiscoverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

export default function DelightDiscoverDrawer({
  isOpen,
  onClose,
  onApplyFilters,
}: DelightDiscoverDrawerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "advanced" | "signals">(
    "basic"
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [estimatedResults, setEstimatedResults] = useState(0);

  // Modal state for info descriptions
  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const [sections, setSections] = useState<FilterSection[]>([
    {
      id: "company",
      title: "Company",
      icon: Building2,
      isOpen: true,
      count: 0,
    },
    {
      id: "industry",
      title: "Industry",
      icon: Briefcase,
      isOpen: false,
      count: 0,
    },
    {
      id: "location",
      title: "Location",
      icon: MapPin,
      isOpen: false,
      count: 0,
    },
    {
      id: "role",
      title: "Role",
      icon: Briefcase,
      isOpen: false,
      count: 0,
    },
    {
      id: "seniority",
      title: "Seniority",
      icon: Trophy,
      isOpen: false,
      count: 0,
    },
    {
      id: "experience",
      title: "Experience",
      icon: Calendar,
      isOpen: false,
      count: 0,
    },
    {
      id: "delightSense",
      title: "Delight Sense",
      icon: Brain,
      isOpen: false,
      count: 0,
    },
  ]);

  const [filters, setFilters] = useState({
    linkedinUrl: "",
    company: {
      name: "",
      headcount: [] as string[],
    },
    industry: [] as string[],
    location: [] as string[],
    role: {
      title: "",
      jobTitles: [] as string[],
    },
    seniority: {
      levels: [] as string[],
    },
    experience: {
      yearsRange: [] as string[],
    },
    signals: {
      delightSense: false,
      mentionedInNews: false,
      postedOnLinkedin: false,
      technologies: false,
      funding: false,
    },
    targetCount: 100,
  });

  const [dropdownStates, setDropdownStates] = useState({
    // Keeping this for potential future use or legacy compatibility
  });

  // Job title suggestions for autocomplete
  const jobTitleSuggestions = [
    "CEO",
    "CTO",
    "CFO",
    "CMO",
    "VP of Engineering",
    "VP of Sales",
    "VP of Marketing",
    "Engineering Director",
    "Sales Director",
    "Marketing Director",
    "Product Manager",
    "Software Engineer",
    "Data Scientist",
    "UX Designer",
    "DevOps Engineer",
    "Business Development Manager",
    "Account Executive",
    "Customer Success Manager",
    "HR Director",
    "Operations Manager",
    "Project Manager",
    "Consultant",
  ];

  const [jobTitleSuggestions_filtered, setJobTitleSuggestionsFiltered] =
    useState<string[]>([]);
  const [showJobTitleSuggestions, setShowJobTitleSuggestions] = useState(false);

  const toggleSection = (id: string) => {
    setSections(
      sections.map((section) =>
        section.id === id ? { ...section, isOpen: !section.isOpen } : section
      )
    );
  };

  const handleInputChange = (category: string, field: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category as keyof typeof prev] as object),
        [field]: value,
      },
    }));
    updateSectionCounts();
  };

  const handleJobTitleChange = (value: string) => {
    handleInputChange("role", "title", value);

    if (value.length > 0) {
      const filtered = jobTitleSuggestions
        .filter((title) => title.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 6);
      setJobTitleSuggestionsFiltered(filtered);
      setShowJobTitleSuggestions(true);
    } else {
      setShowJobTitleSuggestions(false);
    }
  };

  // Handler for seniority levels
  const handleSeniorityChange = (value: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      seniority: {
        ...prev.seniority,
        levels: checked
          ? [...prev.seniority.levels, value]
          : prev.seniority.levels.filter((item) => item !== value),
      },
    }));
    updateSectionCounts();
  };

  // Handler for role job titles
  const handleJobTitlesChange = (value: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      role: {
        ...prev.role,
        jobTitles: checked
          ? [...prev.role.jobTitles, value]
          : prev.role.jobTitles.filter((item) => item !== value),
      },
    }));
    updateSectionCounts();
  };

  const handleArrayChange = (
    category: string,
    field: string,
    value: string,
    checked: boolean
  ) => {
    setFilters((prev) => {
      const currentCategory = (prev as any)[category];
      const currentArray = currentCategory[field] as string[];
      return {
        ...prev,
        [category]: {
          ...(currentCategory as object),
          [field]: checked
            ? [...currentArray, value]
            : currentArray.filter((item) => item !== value),
        },
      };
    });
    updateSectionCounts();
  };

  const handleRootArrayChange = (
    field: string,
    value: string,
    checked: boolean
  ) => {
    setFilters((prev) => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      return {
        ...prev,
        [field]: checked
          ? [...currentArray, value]
          : currentArray.filter((item) => item !== value),
      };
    });
    updateSectionCounts();
  };

  const handleSignalChange = (signal: string, checked: boolean) => {
    setFilters((prev) => {
      // If turning off Delight Sense, turn off all sub-signals
      if (signal === "delightSense" && !checked) {
        return {
          ...prev,
          signals: {
            ...prev.signals,
            [signal]: checked,
            mentionedInNews: false,
            postedOnLinkedin: false,
            technologies: false,
            funding: false,
          },
        };
      }

      // If turning on any sub-signal, automatically turn on Delight Sense
      if (signal !== "delightSense" && checked) {
        return {
          ...prev,
          signals: {
            ...prev.signals,
            delightSense: true,
            [signal]: checked,
          },
        };
      }

      // Default behavior
      return {
        ...prev,
        signals: {
          ...prev.signals,
          [signal]: checked,
        },
      };
    });
    updateSectionCounts();
  };

  const removeChip = (category: string, field: string, value: string) => {
    if (category === "root") {
      handleRootArrayChange(field, value, false);
    } else {
      handleArrayChange(category, field, value, false);
    }
  };

  // Helper function to get section descriptions
  const getSectionDescription = (sectionId: string) => {
    const descriptions: { [key: string]: string } = {
      delightSense:
        "AI-powered intent detection analyzes behavioral patterns and engagement signals to identify prospects with the highest likelihood of being interested in your products or services.",
      mentionedInNews:
        "Find people who have been featured in recent news articles, indicating they may be in decision-making positions or involved in company changes that make them ideal prospects.",
      postedOnLinkedin:
        "Target individuals who have posted content on LinkedIn in the last 30 days, showing they are active professionals and likely to be responsive to outreach.",
      technologies:
        "Identify companies using specific technology stacks that complement your products or services, helping you find technically relevant prospects.",
      funding:
        "Discover companies that have recently announced funding rounds, indicating growth phases where they may be more likely to invest in new solutions.",
    };
    return descriptions[sectionId] || "";
  };

  // Function to show info modal
  const showInfoModal = (sectionId: string, title: string) => {
    const description = getSectionDescription(sectionId);
    setInfoModal({
      isOpen: true,
      title,
      description,
    });
  };

  // Function to close info modal
  const closeInfoModal = () => {
    setInfoModal({
      isOpen: false,
      title: "",
      description: "",
    });
  };

  // Helper function to get chips for each section
  const getSectionChips = (sectionId: string) => {
    const chips: Array<{
      label: string;
      value: string;
      category: string;
      field: string;
    }> = [];

    switch (sectionId) {
      case "company":
        if (filters.company.name) {
          chips.push({
            label: filters.company.name,
            value: filters.company.name,
            category: "company",
            field: "name",
          });
        }
        filters.company.headcount.forEach((headcount) => {
          chips.push({
            label: headcount,
            value: headcount,
            category: "company",
            field: "headcount",
          });
        });
        break;
      case "industry":
        filters.industry.forEach((industry) => {
          chips.push({
            label: industry,
            value: industry,
            category: "root",
            field: "industry",
          });
        });
        break;
      case "location":
        filters.location.forEach((location) => {
          chips.push({
            label: location,
            value: location,
            category: "root",
            field: "location",
          });
        });
        break;
      case "role":
        if (filters.role.title) {
          chips.push({
            label: filters.role.title,
            value: filters.role.title,
            category: "role",
            field: "title",
          });
        }
        filters.role.jobTitles.forEach((title) => {
          chips.push({
            label: title,
            value: title,
            category: "role",
            field: "jobTitles",
          });
        });
        break;
      case "seniority":
        filters.seniority.levels.forEach((level) => {
          chips.push({
            label: level,
            value: level,
            category: "seniority",
            field: "levels",
          });
        });
        break;
      case "experience":
        filters.experience.yearsRange.forEach((range) => {
          chips.push({
            label: range,
            value: range,
            category: "experience",
            field: "yearsRange",
          });
        });
        break;
    }

    return chips;
  };

  // Helper function to remove chip
  const removeChipFromSection = (
    category: string,
    field: string,
    value: string
  ) => {
    if (category === "root") {
      handleRootArrayChange(field, value, false);
    } else if (
      category === "profile" &&
      (field === "firstName" || field === "lastName" || field === "school")
    ) {
      handleInputChange(category, field, "");
    } else if (category === "company" && field === "name") {
      handleInputChange(category, field, "");
    } else if (category === "role" && field === "title") {
      handleInputChange(category, field, "");
    } else {
      handleArrayChange(category, field, value, false);
    }
  };

  // Helper function to clear all filters for a specific section
  const clearSectionFilters = (sectionId: string) => {
    switch (sectionId) {
      case "company":
        setFilters((prev) => ({
          ...prev,
          company: {
            name: "",
            headcount: [],
          },
        }));
        break;
      case "industry":
        setFilters((prev) => ({
          ...prev,
          industry: [],
        }));
        break;
      case "location":
        setFilters((prev) => ({
          ...prev,
          location: [],
        }));
        break;
      case "role":
        setFilters((prev) => ({
          ...prev,
          role: {
            title: "",
            jobTitles: [],
          },
        }));
        break;
      case "seniority":
        setFilters((prev) => ({
          ...prev,
          seniority: {
            levels: [],
          },
        }));
        break;
      case "experience":
        setFilters((prev) => ({
          ...prev,
          experience: {
            yearsRange: [],
          },
        }));
        break;
      case "delightSense":
      case "mentionedInNews":
      case "postedOnLinkedin":
      case "technologies":
      case "funding":
        setFilters((prev) => ({
          ...prev,
          signals: {
            ...prev.signals,
            [sectionId]: false,
          },
        }));
        break;
    }
    updateSectionCounts();
  };

  const updateSectionCounts = () => {
    setSections((prevSections) =>
      prevSections.map((section) => {
        let count = 0;

        switch (section.id) {
          case "company":
            if (filters.company.name) count++;
            count += filters.company.headcount.length;
            break;
          case "industry":
            count = filters.industry.length;
            break;
          case "location":
            count = filters.location.length;
            break;
          case "role":
            if (filters.role.title) count++;
            count += filters.role.jobTitles.length;
            break;
          case "seniority":
            count = filters.seniority.levels.length;
            break;
          case "experience":
            count = filters.experience.yearsRange.length;
            break;
          case "delightSense":
            // Count how many sub-signals are active
            count = [
              filters.signals.mentionedInNews,
              filters.signals.postedOnLinkedin,
              filters.signals.technologies,
              filters.signals.funding,
            ].filter(Boolean).length;
            break;
        }

        return { ...section, count };
      })
    );
  };

  const generateSyntheticData = (filters: any) => {
    // Enhanced synthetic data generation based on filters
    const names = [
      "Alex Chen",
      "Sarah Williams",
      "Michael Rodriguez",
      "Emily Zhang",
      "David Kim",
      "Jessica Patel",
      "Christopher Johnson",
      "Amanda Garcia",
      "Matthew Brown",
      "Ashley Taylor",
      "Ryan Murphy",
      "Nicole Davis",
      "Kevin Lee",
      "Rachel Green",
      "Andrew Wilson",
      "Lauren Martinez",
    ];

    const companies = [
      "TechFlow Solutions",
      "DataSync Corp",
      "CloudVision Inc",
      "AI Ventures Lab",
      "StartupHub",
      "InnovateTech",
      "FutureSoft",
      "SmartSystems",
      "DigitalEdge",
      "TechPioneer",
      "DataStream",
      "CloudFirst",
    ];

    const jobTitles = {
      "C-Level": ["CEO", "CTO", "CFO", "CMO", "CPO"],
      "VP/SVP": [
        "VP of Engineering",
        "SVP Marketing",
        "VP Sales",
        "VP Product",
      ],
      Director: [
        "Engineering Director",
        "Marketing Director",
        "Sales Director",
      ],
      Manager: ["Product Manager", "Engineering Manager", "Marketing Manager"],
      Senior: [
        "Senior Software Engineer",
        "Senior Data Scientist",
        "Senior Designer",
      ],
      Individual: [
        "Software Engineer",
        "Data Analyst",
        "UX Designer",
        "Marketing Specialist",
      ],
    };

    const getJobTitleBySeniority = (seniority: string) => {
      const seniorityMap: { [key: string]: string } = {
        "C-Level (CEO, CTO, CFO)": "C-Level",
        "VP/SVP": "VP/SVP",
        Director: "Director",
        "Senior Manager": "Manager",
        Manager: "Manager",
        "Senior Individual Contributor": "Senior",
        "Individual Contributor": "Individual",
      };
      const category = seniorityMap[seniority] || "Individual";
      const titles = jobTitles[category as keyof typeof jobTitles];
      return titles[Math.floor(Math.random() * titles.length)];
    };

    const filteredIndustries =
      filters.industry.length > 0
        ? filters.industry
        : [
            "Software & Technology",
            "Healthcare & Life Sciences",
            "Financial Services",
          ];

    const filteredLocations =
      filters.location.length > 0
        ? filters.location
        : ["San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX"];

    const data = Array.from({ length: filters.targetCount }, (_, i) => {
      // Apply name filters
      let selectedName = names[i % names.length];

      // Apply company filters
      let selectedCompany = companies[i % companies.length];
      if (filters.company.name) {
        selectedCompany = filters.company.name;
      }

      // Apply seniority/role filters
      let jobTitle = "Software Engineer";
      if (filters.seniority.levels.length > 0) {
        const randomSeniority =
          filters.seniority.levels[
            Math.floor(Math.random() * filters.seniority.levels.length)
          ];
        jobTitle = getJobTitleBySeniority(randomSeniority);
      }
      if (filters.role.jobTitles.length > 0) {
        jobTitle = filters.role.jobTitles[0];
      }
      if (filters.role.title) {
        jobTitle = filters.role.title;
      }

      const selectedIndustry =
        filteredIndustries[i % filteredIndustries.length];
      const selectedLocation = filteredLocations[i % filteredLocations.length];

      return {
        id: `synthetic-${Date.now()}-${i}`,
        name: selectedName,
        email: `${selectedName
          .toLowerCase()
          .replace(/\s+/g, ".")}@${selectedCompany
          .toLowerCase()
          .replace(/\s+/g, "")}.com`,
        phone: `+1 (555) ${String(
          Math.floor(Math.random() * 900) + 100
        )}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        linkedin: `linkedin.com/in/${selectedName
          .toLowerCase()
          .replace(/\s+/g, "-")}`,
        company: selectedCompany,
        jobtitle: jobTitle,
        industry: selectedIndustry,
        country: "United States",
        city: selectedLocation.split(",")[0],
        state: selectedLocation.split(",")[1]?.trim() || "CA",
        address: {
          line1: `${Math.floor(Math.random() * 9999) + 1} ${
            ["Main St", "Oak Ave", "Pine Blvd", "First St"][
              Math.floor(Math.random() * 4)
            ]
          }`,
          line2: "",
          city: selectedLocation.split(",")[0],
          state: selectedLocation.split(",")[1]?.trim() || "CA",
          zip: `${Math.floor(Math.random() * 90000) + 10000}`,
          country: "United States",
        },
        enrichment: {
          data: {
            verified: true,
            confidence: Math.random() > 0.3,
            industry: selectedIndustry,
            seniority:
              filters.seniority.levels.length > 0
                ? filters.seniority.levels[0]
                : "Individual Contributor",
            connectionLevel: "2nd",
            signals: {
              delightSense: filters.signals.delightSense
                ? Math.random() > 0.3
                : false,
              mentionedInNews: filters.signals.mentionedInNews
                ? Math.random() > 0.7
                : false,
              postedOnLinkedin: filters.signals.postedOnLinkedin
                ? Math.random() > 0.5
                : false,
              technologies: filters.signals.technologies
                ? Math.random() > 0.6
                : false,
              funding: filters.signals.funding ? Math.random() > 0.8 : false,
            },
          },
          likelihood: Math.floor(Math.random() * 40) + 60,
        },
      };
    });

    return data;
  };

  const handlePreviewClick = () => {
    const syntheticData = generateSyntheticData(filters);
    onApplyFilters({ ...filters, syntheticData });
  };

  const clearAllFilters = () => {
    setFilters({
      linkedinUrl: "",
      company: {
        name: "",
        headcount: [],
      },
      industry: [],
      location: [],
      role: {
        title: "",
        jobTitles: [],
      },
      seniority: {
        levels: [],
      },
      experience: {
        yearsRange: [],
      },
      signals: {
        delightSense: false,
        mentionedInNews: false,
        postedOnLinkedin: false,
        technologies: false,
        funding: false,
      },
      targetCount: 100,
    });
    updateSectionCounts();
  };

  // Enhanced sample data
  const industries = [
    "Software & Technology",
    "Healthcare & Life Sciences",
    "Financial Services",
    "Manufacturing",
    "Retail & E-commerce",
    "Professional Services",
    "Media & Entertainment",
    "Education",
    "Real Estate",
    "Energy & Utilities",
    "Automotive",
    "Aerospace & Defense",
    "Telecommunications",
    "Food & Beverage",
  ];

  const locations = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Australia",
    "Singapore",
    "Japan",
    "India",
    "Brazil",
    "New York, NY",
    "San Francisco, CA",
    "Los Angeles, CA",
    "Chicago, IL",
    "Boston, MA",
    "Seattle, WA",
    "Austin, TX",
    "London, UK",
    "Berlin, Germany",
    "Paris, France",
    "Toronto, Canada",
    "Remote",
  ];

  const seniorityLevels = [
    "C-Level (CEO, CTO, CFO)",
    "VP/SVP",
    "Director",
    "Senior Manager",
    "Manager",
    "Senior Individual Contributor",
    "Individual Contributor",
    "Entry Level",
    "Intern",
  ];

  const connectionLevels = [
    "1st (Direct)",
    "2nd (Friend of Friend)",
    "3rd+ (Extended)",
  ];

  const headcountRanges = [
    "1-10 (Startup)",
    "11-50 (Small)",
    "51-200 (Medium)",
    "201-500 (Growing)",
    "501-1000 (Large)",
    "1001-5000 (Enterprise)",
    "5000+ (Fortune 500)",
  ];

  const experienceRanges = [
    "0-1 years",
    "2-3 years",
    "4-5 years",
    "6-10 years",
    "11-15 years",
    "15+ years",
  ];

  // Info Modal Component
  const InfoModal = () => {
    if (!infoModal.isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={closeInfoModal}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform scale-100 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {infoModal.title}
              </h3>
            </div>
            <button
              onClick={closeInfoModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            <p className="text-gray-700 leading-relaxed text-sm">
              {infoModal.description}
            </p>
          </div>

          {/* Modal Footer */}
          <div className="px-6 pb-6">
            <button
              onClick={closeInfoModal}
              className="w-full px-4 py-2.5 bg-[#7F56D9] hover:bg-[#6941C6] text-white rounded-lg font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Chip Component with brand colors and hover-only cross icon
  const Chip = ({
    label,
    onRemove,
  }: {
    label: string;
    onRemove: () => void;
  }) => (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs border border-primary/20 group hover:bg-red-100 hover:text-red-700 hover:border-red-200 transition-colors">
      <span className="truncate max-w-[100px]">{label}</span>
      <button
        onClick={onRemove}
        className="flex-shrink-0 w-3 h-3 rounded-full bg-red-200 hover:bg-red-300 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
      >
        <X className="w-2 h-2" />
      </button>
    </div>
  );

  // Direct Multi-Select Component with Checkboxes
  const DirectMultiSelectSection = React.memo(
    ({
      options,
      selectedValues,
      onSelectionChange,
      placeholder,
      allowManualEntry = true,
      maxHeight = "200px",
    }: {
      options: string[];
      selectedValues: string[];
      onSelectionChange: (value: string, checked: boolean) => void;
      placeholder: string;
      allowManualEntry?: boolean;
      maxHeight?: string;
    }) => {
      const [searchTerm, setSearchTerm] = useState("");
      const [manualEntryValue, setManualEntryValue] = useState("");
      const scrollContainerRef = useRef<HTMLDivElement>(null);

      const filteredOptions = React.useMemo(
        () =>
          options.filter((option) =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        [options, searchTerm]
      );

      const handleSelectionChange = React.useCallback(
        (value: string, checked: boolean) => {
          const currentScrollTop = scrollContainerRef.current?.scrollTop || 0;
          onSelectionChange(value, checked);
          // Restore scroll position after state update
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = currentScrollTop;
            }
          }, 0);
        },
        [onSelectionChange]
      );

      const handleManualAdd = React.useCallback(() => {
        if (
          manualEntryValue.trim() &&
          !selectedValues.includes(manualEntryValue.trim())
        ) {
          onSelectionChange(manualEntryValue.trim(), true);
          setManualEntryValue("");
        }
      }, [manualEntryValue, selectedValues, onSelectionChange]);

      const handleKeyPress = React.useCallback(
        (e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleManualAdd();
          } else if (e.key === ",") {
            e.preventDefault();
            handleManualAdd();
          }
        },
        [handleManualAdd]
      );

      return (
        <div className="space-y-3">
          {/* Manual Entry Input */}
          {allowManualEntry && (
            <div className="relative">
              <input
                type="text"
                placeholder="Type and press Enter or comma to add..."
                value={manualEntryValue}
                onChange={(e) => setManualEntryValue(e.target.value)}
                onKeyPress={handleKeyPress}                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              {manualEntryValue && (
                <button
                  onClick={handleManualAdd}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-primary hover:bg-primary-dark transition-colors flex items-center justify-center"
                >
                  <Plus className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Scrollable Options with Fade Effects */}
          <div className="relative">
            {/* Top fade effect */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>

            {/* Options Container */}
            <div
              ref={scrollContainerRef}
              className="scrollbar-hide overflow-y-auto space-y-1 py-2"
              style={{
                maxHeight,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center p-3 hover:bg-primary/5 cursor-pointer transition-colors rounded-lg group"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option)}
                      onChange={(e) =>
                        handleSelectionChange(option, e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                      ${
                        selectedValues.includes(option)
                          ? "bg-primary border-primary"
                          : "border-gray-300 hover:border-primary/60"
                      }
                    `}
                    >
                      {selectedValues.includes(option) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-sm text-gray-900 flex-1">
                    {option}
                  </span>
                </label>
              ))}

              {filteredOptions.length === 0 && (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No matching options found
                </div>
              )}
            </div>

            {/* Bottom fade effect */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
          </div>

          {/* Selected Chips - Always at Bottom */}
          {selectedValues.length > 0 && (
            <div className="pt-2 animate-in fade-in duration-200">
              <div className="flex flex-wrap gap-1">
                {selectedValues.map((value) => (
                  <div
                    key={value}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs border border-primary/20 group hover:bg-orange-100 hover:text-orange-700 hover:border-orange-200 transition-all duration-200"
                  >
                    <span className="truncate max-w-[80px] text-xs">
                      {value}
                    </span>
                    <button
                      onClick={() => onSelectionChange(value, false)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-2.5 h-2.5 rounded-full bg-orange-200 hover:bg-orange-300 transition-all duration-200 flex items-center justify-center"
                    >
                      <X className="w-1.5 h-1.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
  );

  // Scrollable checkbox list with fade effects
  const ScrollableCheckboxList = ({
    options,
    selectedValues,
    onChange,
    searchValue = "",
    onSearchChange,
    placeholder = "Search options...",
    showSearch = true,
  }: {
    options: Array<{ value: string; label: string }>;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    placeholder?: string;
    showSearch?: boolean;
  }) => {
    const filteredOptions = searchValue
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchValue.toLowerCase())
        )
      : options;

    const handleToggle = (value: string) => {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange(newValues);
    };

    return (
      <div className="space-y-3">
        {showSearch && onSearchChange && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        )}

        <div className="relative">
          {/* Top fade gradient */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />

          {/* Scrollable content */}
          <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-2 px-1">
            {filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/5 cursor-pointer group transition-colors"
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                    className="sr-only"
                  />
                  <div
                    className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                      ${
                        selectedValues.includes(option.value)
                          ? "bg-primary border-primary"
                          : "border-gray-300 hover:border-primary/60"
                      }
                    `}
                  >
                    {selectedValues.includes(option.value) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {option.label}
                </span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No options found
              </div>
            )}
          </div>

          {/* Bottom fade gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        </div>
      </div>
    );
  };

  // Direct Multi-Select Component without dropdown (always expanded)
  const DirectMultiSelect = React.memo(
    ({
      options,
      selectedValues,
      onSelectionChange,
      placeholder,
      searchable = true,
    }: {
      options: string[];
      selectedValues: string[];
      onSelectionChange: (value: string, checked: boolean) => void;
      placeholder: string;
      searchable?: boolean;
    }) => {
      const [searchTerm, setSearchTerm] = useState("");
      const scrollContainerRef = useRef<HTMLDivElement>(null);

      const filteredOptions = React.useMemo(
        () =>
          searchable
            ? options.filter((option) =>
                option.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : options,
        [options, searchTerm, searchable]
      );

      const handleSelectionChange = React.useCallback(
        (value: string, checked: boolean) => {
          const currentScrollTop = scrollContainerRef.current?.scrollTop || 0;
          onSelectionChange(value, checked);
          // Restore scroll position after state update
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = currentScrollTop;
            }
          }, 0);
        },
        [onSelectionChange]
      );

      const handleRemoveChip = React.useCallback(
        (value: string) => {
          onSelectionChange(value, false);
        },
        [onSelectionChange]
      );

      return (
        <div className="space-y-3">
          {/* Search Input */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Direct checkbox list with fade effects */}
          <div className="relative">
            {/* Top fade gradient */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />

            {/* Scrollable content */}
            <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-2 px-1">
              {filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/5 cursor-pointer group transition-colors"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option)}
                      onChange={(e) =>
                        onSelectionChange(option, e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                      ${
                        selectedValues.includes(option)
                          ? "bg-primary border-primary"
                          : "border-gray-300 hover:border-primary/60"
                      }
                    `}
                    >
                      {selectedValues.includes(option) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {option}
                  </span>
                </label>
              ))}
              {filteredOptions.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No options found
                </div>
              )}
            </div>

            {/* Bottom fade gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
          </div>

          {/* Chips at Bottom - Always visible when there are selections */}
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 animate-in fade-in duration-200">
              {selectedValues.map((value) => (
                <div
                  key={value}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs border border-primary/20 group hover:bg-orange-100 hover:text-orange-700 hover:border-orange-200 transition-all duration-200"
                >
                  <span className="truncate max-w-[80px] text-xs">{value}</span>
                  <button
                    onClick={() => handleRemoveChip(value)}
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-orange-200 hover:bg-orange-300 transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                  >
                    <X className="w-1.5 h-1.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  );

  // Custom SVG Icon for Delight Discover with proper brand styling
  const DelightDiscoverIcon = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="text-primary"
    >
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" />
      <circle cx="11" cy="11" r="3" fill="currentColor" />
      <path d="M8 11h6M11 8v6" stroke="white" strokeWidth="1.5" />
    </svg>
  );

  useEffect(() => {
    updateSectionCounts();
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showJobTitleSuggestions) {
        const target = event.target as Element;
        if (!target.closest("[data-job-title-container]")) {
          setShowJobTitleSuggestions(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showJobTitleSuggestions]);

  // Add animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready, then trigger animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-out ${
          isAnimating ? "opacity-20" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer with slide animation */}
      <div
        className={`fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 transform transition-transform duration-300 ease-out ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          willChange: "transform",
          transitionTimingFunction: isAnimating
            ? "cubic-bezier(0.25, 0.46, 0.45, 0.94)" // Smooth ease-out for opening
            : "cubic-bezier(0.55, 0.085, 0.68, 0.53)", // Smooth ease-in for closing
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <DelightDiscoverIcon />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Delight Discover
              </h2>
              <p className="text-sm text-gray-600">
                AI-powered filters to find more Leads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto pb-4">
          {/* Added bottom padding */}
          {/* LinkedIn URL Input - Enhanced */}
          <div className="mx-4 mt-6 mb-6 p-5 bg-gradient-to-br from-primary/5 to-white border border-primary/20 rounded-xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Linkedin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Start with LinkedIn Profile or Company
                </h3>
                <p className="text-xs text-gray-600">
                  Paste any LinkedIn URL to build similar profiles
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="https://linkedin.com/in/example or https://linkedin.com/company/example"
                className="w-full p-3.5 pl-12 pr-4 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white/80 hover:bg-white text-sm"
                value={filters.linkedinUrl}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    linkedinUrl: e.target.value,
                  }))
                }
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/60" />
              {filters.linkedinUrl && (
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, linkedinUrl: "" }))
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-gray-600" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-primary">
              <Sparkles className="w-3 h-3" />
              <span>
                AI will analyze and find similar profiles automatically
              </span>
            </div>
          </div>

          {/* Filter Sections */}
          {sections.map((section) => {
            const IconComponent = section.icon;

            // Special handling for Delight Sense as expandable section with sub-toggles
            if (section.id === "delightSense") {
              const handleDelightSenseToggle = (checked: boolean) => {
                // Handle both the toggle and the expansion/collapse
                handleSignalChange("delightSense", checked);
                // Toggle section open/close based on the switch state
                if (checked && !section.isOpen) {
                  toggleSection(section.id);
                } else if (!checked && section.isOpen) {
                  toggleSection(section.id);
                }
              };

              return (
                <div
                  key={section.id}
                  className={`mx-4 mb-4 transition-all duration-500 ease-in-out ${
                    filters.signals.delightSense
                      ? "bg-gradient-to-br from-primary/5 to-white border border-primary/20 shadow-md"
                      : "bg-white border border-gray-200 hover:bg-gradient-to-br hover:from-primary/5 hover:to-white hover:border-primary/20 hover:shadow-sm"
                  } rounded-xl overflow-hidden`}
                  style={{
                    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <div
                    className={`w-full flex justify-between items-center p-4 transition-all duration-300 group ${
                      filters.signals.delightSense
                        ? "text-primary-dark"
                        : "text-gray-900 hover:text-primary-dark"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          filters.signals.delightSense
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
                        }`}
                      >
                        <IconComponent size={16} />
                      </div>
                      <div className="text-left">
                        <span
                          className={`font-medium transition-colors ${
                            filters.signals.delightSense
                              ? "text-primary-dark"
                              : "text-gray-900 group-hover:text-primary-dark"
                          }`}
                        >
                          {section.title}
                        </span>
                        <div className="text-xs text-gray-500 mt-0.5">
                          AI-powered intent detection
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Coming Soon badge */}
                      <div className="px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 text-xs rounded-full font-medium border border-orange-200 shadow-sm">
                        Coming Soon
                      </div>

                      {/* Count badge if any sub-features are active */}
                      {section.count > 0 && (
                        <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium border border-primary/20">
                          {section.count}
                        </div>
                      )}

                      {/* Info button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showInfoModal(section.id, section.title);
                        }}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-primary/10 transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-105 group/info"
                        title="Learn more about this feature"
                      >
                        <Info className="w-4 h-4 text-gray-500 group-hover/info:text-primary transition-colors" />
                      </button>

                      {/* Main Delight Sense Toggle - Enhanced Visibility */}
                      <Switch
                        checked={filters.signals.delightSense}
                        onCheckedChange={handleDelightSenseToggle}
                        className="scale-110"
                      />
                    </div>
                  </div>

                  {/* Delight Sense Sub-toggles with smooth height animation */}
                  <div
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      filters.signals.delightSense && section.isOpen
                        ? "max-h-[400px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                    style={{
                      transition:
                        "max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out",
                    }}
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <div className="text-xs text-gray-600 mb-3 px-2">
                        {filters.signals.delightSense
                          ? "Select the signals you want to detect:"
                          : "Enable Delight Sense to configure signals"}
                      </div>

                      {/* Mentioned in News */}
                      <div
                        className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg transition-all group/sub ${
                          filters.signals.delightSense
                            ? "hover:border-primary/20 hover:shadow-sm"
                            : "opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center group-hover/sub:bg-primary/10 transition-colors">
                            <Newspaper
                              size={14}
                              className={`${
                                filters.signals.delightSense
                                  ? "text-gray-600 group-hover/sub:text-primary"
                                  : "text-gray-400"
                              } transition-colors`}
                            />
                          </div>
                          <div>
                            <span
                              className={`text-sm font-medium ${
                                filters.signals.delightSense
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              Mentioned in News
                            </span>
                            <div
                              className={`text-xs ${
                                filters.signals.delightSense
                                  ? "text-gray-500"
                                  : "text-gray-400"
                              }`}
                            >
                              Recent media coverage
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={filters.signals.mentionedInNews}
                          onCheckedChange={(checked) =>
                            handleSignalChange("mentionedInNews", checked)
                          }
                          disabled={!filters.signals.delightSense}
                          className="disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Posted on LinkedIn */}
                      <div
                        className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg transition-all group/sub ${
                          filters.signals.delightSense
                            ? "hover:border-primary/20 hover:shadow-sm"
                            : "opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center group-hover/sub:bg-primary/10 transition-colors">
                            <Linkedin
                              size={14}
                              className={`${
                                filters.signals.delightSense
                                  ? "text-gray-600 group-hover/sub:text-primary"
                                  : "text-gray-400"
                              } transition-colors`}
                            />
                          </div>
                          <div>
                            <span
                              className={`text-sm font-medium ${
                                filters.signals.delightSense
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              Posted on LinkedIn
                            </span>
                            <div
                              className={`text-xs ${
                                filters.signals.delightSense
                                  ? "text-gray-500"
                                  : "text-gray-400"
                              }`}
                            >
                              Active on LinkedIn
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={filters.signals.postedOnLinkedin}
                          onCheckedChange={(checked) =>
                            handleSignalChange("postedOnLinkedin", checked)
                          }
                          disabled={!filters.signals.delightSense}
                          className="disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Technologies */}
                      <div
                        className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg transition-all group/sub ${
                          filters.signals.delightSense
                            ? "hover:border-primary/20 hover:shadow-sm"
                            : "opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center group-hover/sub:bg-primary/10 transition-colors">
                            <Code
                              size={14}
                              className={`${
                                filters.signals.delightSense
                                  ? "text-gray-600 group-hover/sub:text-primary"
                                  : "text-gray-400"
                              } transition-colors`}
                            />
                          </div>
                          <div>
                            <span
                              className={`text-sm font-medium ${
                                filters.signals.delightSense
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              Technologies
                            </span>
                            <div
                              className={`text-xs ${
                                filters.signals.delightSense
                                  ? "text-gray-500"
                                  : "text-gray-400"
                              }`}
                            >
                              Tech stack signals
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={filters.signals.technologies}
                          onCheckedChange={(checked) =>
                            handleSignalChange("technologies", checked)
                          }
                          disabled={!filters.signals.delightSense}
                          className="disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Recent Funding */}
                      <div
                        className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg transition-all group/sub ${
                          filters.signals.delightSense
                            ? "hover:border-primary/20 hover:shadow-sm"
                            : "opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center group-hover/sub:bg-primary/10 transition-colors">
                            <DollarSign
                              size={14}
                              className={`${
                                filters.signals.delightSense
                                  ? "text-gray-600 group-hover/sub:text-primary"
                                  : "text-gray-400"
                              } transition-colors`}
                            />
                          </div>
                          <div>
                            <span
                              className={`text-sm font-medium ${
                                filters.signals.delightSense
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              Recent Funding
                            </span>
                            <div
                              className={`text-xs ${
                                filters.signals.delightSense
                                  ? "text-gray-500"
                                  : "text-gray-400"
                              }`}
                            >
                              Funding announcements
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={filters.signals.funding}
                          onCheckedChange={(checked) =>
                            handleSignalChange("funding", checked)
                          }
                          disabled={!filters.signals.delightSense}
                          className="disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Render expandable sections for non-toggle sections
            return (
              <div
                key={section.id}
                className={`mx-4 mb-4 transition-all duration-500 ease-in-out ${
                  section.isOpen
                    ? "bg-gradient-to-br from-primary/5 to-white border border-primary/20 shadow-md"
                    : "bg-white border border-gray-200 hover:bg-gradient-to-br hover:from-primary/5 hover:to-white hover:border-primary/20 hover:shadow-sm"
                } rounded-xl overflow-hidden`}
              >
                <button
                  className={`w-full flex justify-between items-center p-4 transition-all duration-300 group ${
                    section.isOpen
                      ? "text-primary-dark"
                      : "text-gray-900 hover:text-primary-dark"
                  }`}
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        section.isOpen
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
                      }`}
                    >
                      <IconComponent size={16} />
                    </div>
                    <span
                      className={`font-medium transition-colors ${
                        section.isOpen
                          ? "text-primary-dark"
                          : "text-gray-900 group-hover:text-primary-dark"
                      }`}
                    >
                      {section.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.count > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSectionFilters(section.id);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium border border-primary/20 hover:bg-red-100 hover:text-red-700 hover:border-red-200 transition-all duration-200 group/count"
                      >
                        <span>{section.count}</span>
                        <X className="w-3 h-3 transition-all duration-200" />
                      </button>
                    )}
                    {section.isOpen ? (
                      <ChevronUp
                        size={18}
                        className={`transition-colors ${
                          section.isOpen
                            ? "text-primary"
                            : "text-gray-400 group-hover:text-primary"
                        }`}
                      />
                    ) : (
                      <ChevronDown
                        size={18}
                        className={`transition-colors ${
                          section.isOpen
                            ? "text-primary"
                            : "text-gray-400 group-hover:text-primary"
                        }`}
                      />
                    )}
                  </div>
                </button>

                {/* Chip Footer - Always visible when section is closed and has chips */}
                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    !section.isOpen && getSectionChips(section.id).length > 0
                      ? "max-h-24 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1 pt-1">
                      {getSectionChips(section.id).map((chip, index) => (
                        <div
                          key={`${chip.category}-${chip.field}-${chip.value}-${index}`}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs border border-primary/20 group hover:bg-orange-100 hover:text-orange-700 hover:border-orange-200 transition-all duration-200"
                        >
                          <span className="truncate max-w-[80px] text-xs">
                            {chip.label}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeChipFromSection(
                                chip.category,
                                chip.field,
                                chip.value
                              );
                            }}
                            className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-orange-200 hover:bg-orange-300 transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                          >
                            <X className="w-1.5 h-1.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Content - Expandable with smooth height transition */}
                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    section.isOpen
                      ? "max-h-[800px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 pb-4 space-y-4">
                    {/* Company Section */}
                    {section.id === "company" && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Company Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Microsoft, Apple, Startup"
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            value={filters.company.name}
                            onChange={(e) =>
                              handleInputChange(
                                "company",
                                "name",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Company Headcount
                          </label>
                          <DirectMultiSelect
                            options={headcountRanges}
                            selectedValues={filters.company.headcount}
                            onSelectionChange={(value, checked) =>
                              handleArrayChange(
                                "company",
                                "headcount",
                                value,
                                checked
                              )
                            }
                            placeholder="Select company sizes"
                            searchable={false}
                          />
                        </div>
                      </>
                    )}

                    {/* Industry Section */}
                    {section.id === "industry" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Industry
                        </label>
                        <DirectMultiSelect
                          options={industries}
                          selectedValues={filters.industry}
                          onSelectionChange={(value, checked) =>
                            handleRootArrayChange("industry", value, checked)
                          }
                          placeholder="Select industries"
                        />
                      </div>
                    )}

                    {/* Location Section */}
                    {section.id === "location" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <DirectMultiSelect
                          options={locations}
                          selectedValues={filters.location}
                          onSelectionChange={(value, checked) =>
                            handleRootArrayChange("location", value, checked)
                          }
                          placeholder="Select locations"
                        />
                      </div>
                    )}

                    {/* Role Section */}
                    {section.id === "role" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Job Titles
                        </label>
                        <DirectMultiSelectSection
                          options={jobTitleSuggestions}
                          selectedValues={filters.role.jobTitles}
                          onSelectionChange={handleJobTitlesChange}
                          placeholder="Job Titles"
                          allowManualEntry={true}
                          maxHeight="200px"
                        />
                      </div>
                    )}

                    {/* Seniority Section */}
                    {section.id === "seniority" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Seniority Levels
                        </label>
                        <DirectMultiSelectSection
                          options={seniorityLevels}
                          selectedValues={filters.seniority.levels}
                          onSelectionChange={handleSeniorityChange}
                          placeholder="Seniority Levels"
                          allowManualEntry={false}
                          maxHeight="200px"
                        />
                      </div>
                    )}

                    {/* Experience Section */}
                    {section.id === "experience" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Years of Experience
                        </label>
                        <DirectMultiSelect
                          options={experienceRanges}
                          selectedValues={filters.experience.yearsRange}
                          onSelectionChange={(value, checked) =>
                            handleArrayChange(
                              "experience",
                              "yearsRange",
                              value,
                              checked
                            )
                          }
                          placeholder="Select experience ranges"
                          searchable={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Target Count Input - More Compact */}
          <div className="mx-4 mb-6 p-4 bg-gradient-to-br from-primary/10 to-white border border-primary/30 rounded-xl hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#7F56D9] rounded-lg flex items-center justify-center group-hover:bg-[#6941C6] transition-colors">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Target Audience Size
                </h3>
                <p className="text-xs text-gray-600">
                  How many qualified leads do you want to discover?
                </p>
              </div>
            </div>

            <div className="relative mb-3">
              <div className="flex items-center gap-2">
                {/* Decrease Button - Smaller */}
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      targetCount: Math.max((prev.targetCount || 100) - 1, 1),
                    }))
                  }
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white transition-all duration-200 border border-[#7F56D9] hover:border-[#6941C6]"
                  aria-label="Decrease target count"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 12h14" />
                  </svg>
                </button>

                {/* Input Field - Smaller */}
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    placeholder="100"
                    className="w-full p-2.5 pr-16 pl-3 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all text-center font-semibold text-base bg-white/90 hover:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={filters.targetCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 100;
                      setFilters((prev) => ({
                        ...prev,
                        targetCount: Math.min(Math.max(value, 1), 200),
                      }));
                    }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-primary-dark pointer-events-none">
                    <Users className="w-3 h-3" />
                    <span className="text-xs font-medium">leads</span>
                  </div>
                </div>

                {/* Increase Button - Smaller */}
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      targetCount: Math.min((prev.targetCount || 100) + 1, 200),
                    }))
                  }
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white transition-all duration-200 border border-[#7F56D9] hover:border-[#6941C6]"
                  aria-label="Increase target count"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Select Buttons - Smaller */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[50, 100, 150, 200].map((count) => (
                <button
                  key={count}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, targetCount: count }))
                  }
                  className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filters.targetCount === count
                      ? "bg-primary text-white shadow-sm border border-primary"
                      : "bg-white text-primary hover:bg-primary hover:text-white border border-primary"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-500">
                <AlertCircle className="w-3 h-3" />
                <span>Range: 1 to 200 leads</span>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <Brain className="w-3 h-3" />
                <span>AI-powered matching</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePreviewClick}
              className="flex-1 px-4 py-2.5 bg-[#7F56D9] hover:bg-[#6941C6] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                Find {filters.targetCount} Leads
                <ArrowRight size={16} />
              </div>
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            AI-powered leads will be added to your contact list
          </p>
        </div>

        {/* Info Modal */}
        <InfoModal />
      </div>
    </>
  );
}
