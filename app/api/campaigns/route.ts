import { NextRequest, NextResponse } from "next/server";
import Campaign from "@/models/Campaign";
import dbConnect from "@/lib/database/dbConnect";
import { validateUser } from "@/middleware/authMiddleware";

export async function GET(request: NextRequest) {
  console.log("🚀 Starting GET campaigns request");
  try {
    console.log("1. Connecting to database...");
    await dbConnect();
    console.log("✅ Database connected");

    // Get pagination params from query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const parentOnly = searchParams.get("parentOnly") === "true";
    const organizationId = searchParams.get("organizationId"); // Optional organization filter

    console.log("2. Query parameters:", {
      page,
      limit,
      search,
      parentOnly,
      organizationId,
      url: request.url,
    });

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Create search query
    const searchQuery: any = {
      ...(search && { name: { $regex: search, $options: "i" } }),
      ...(organizationId && { organization_id: organizationId }),
    };

    // Add parent-only filter if requested
    if (parentOnly) {
      searchQuery.parentCampaignId = { $exists: false };
    }

    console.log("3. MongoDB query:", {
      searchQuery,
      skip,
      limit,
      sort: { createdAt: -1 },
    });

    // Get total count for pagination
    const totalCampaigns = await Campaign.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCampaigns / limit);

    console.log("4. Pagination info:", {
      totalCampaigns,
      totalPages,
      currentPage: page,
    });

    // Fetch campaigns with pagination
    console.log("5. Fetching campaigns...");
    const campaigns = await Campaign.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("6. Campaigns fetched:", {
      count: campaigns.length,
      campaignIds: campaigns.map((c) => c._id),
    });

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          total: totalCampaigns,
          totalPages,
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching campaigns:", {
      error_message: error instanceof Error ? error.message : "Unknown error",
      error_stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch campaigns",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("🚀 Starting POST campaign request");
  try {
    console.log("1. Connecting to database...");
    await dbConnect();
    console.log("✅ Database connected");

    // Validate user and get organization details
    console.log("2. Starting user validation...");
    const validation = await validateUser(request);
    console.log("User validation result:", {
      success: validation.success,
      error: validation.error,
      user: validation.user
        ? {
            id: validation.user.id,
            organization_id: validation.user.organization_id,
          }
        : null,
    });

    if (!validation.success) {
      console.error("❌ Authentication failed:", validation.error);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 401 }
      );
    }

    const { user } = validation;
    console.log("3. Authenticated user:", {
      id: user.id,
      organization_id: user.organization_id,
    });

    console.log("4. Parsing request body...");
    const body = await request.json();
    console.log("Request body:", {
      name: body.name,
      description: body.description,
      goal: body.goal,
      budget: body.budget,
    });

    // Create campaign with user's organization_id and default values
    console.log("5. Creating campaign...");
    const campaign = await Campaign.create({
      // Required fields from body
      name: body.name,
      description: body.description || "Default campaign description",
      goal: body.goal || "Delight Event Attendees",

      // User context
      organization_id: user.organization_id,
      creatorId: user.id,
      companyId: user.organization_id,

      // Default values
      budget: {
        total: body.budget?.total || 0,
        perGift: {
          min: body.budget?.perGift?.min || 0,
          max: body.budget?.perGift?.max || 0,
        },
        spent: 0,
      },
      settings: {
        targeting: {
          regions: body.settings?.targeting?.regions || [],
          industries: body.settings?.targeting?.industries || [],
          titles: body.settings?.targeting?.titles || [],
        },
        notifications: {
          email: body.settings?.notifications?.email ?? true,
          slack: body.settings?.notifications?.slack ?? false,
        },
        customization: {
          message: body.settings?.customization?.message || "",
        },
      },
      giftRules: body.giftRules || [],
      icpFinder: {
        enabled: body.icpFinder?.enabled || false,
        status: "pending",
        searchCriteria: body.icpFinder?.searchCriteria || {},
      },
      dateRange: {
        startDate: body.dateRange?.startDate || new Date(),
        approvedDate: body.dateRange?.approvedDate || null,
        eventDate: body.dateRange?.eventDate || null,
        endDate: body.dateRange?.endDate || null,
      },
      metrics: {
        totalRecipients: 0,
        giftsSelected: 0,
        giftsSent: 0,
        totalSpent: 0,
        engagementRate: 0,
      },
      giftIds: body.giftIds || [],
      bundleIds: body.bundleIds || [],
      status: "draft",
      total_recipients: 0,
    });

    console.log("✅ Campaign created successfully:", {
      id: campaign._id,
      name: campaign.name,
      organization_id: campaign.organization_id,
    });

    return NextResponse.json({
      success: true,
      data: campaign,
      message: "Campaign created successfully",
    });
  } catch (error) {
    console.error("❌ Campaign creation error:", {
      error_message: error instanceof Error ? error.message : "Unknown error",
      error_stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create campaign",
      },
      { status: 500 }
    );
  }
}
