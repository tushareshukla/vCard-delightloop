import { NextRequest, NextResponse } from "next/server";
import Event from "@/models/Event";
import dbConnect from "@/lib/database/dbConnect";

export async function GET(request: NextRequest) {
  console.log("🚀 Starting GET events request");
  try {
    console.log("1. Connecting to database...");
    await dbConnect();
    console.log("✅ Database connected");

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type"); // Filter by event type
    const organizationId = searchParams.get("organizationId"); // Filter by organization
    const upcoming = searchParams.get("upcoming") === "true"; // Filter upcoming events

    console.log("2. Query parameters:", {
      page,
      limit,
      search,
      type,
      organizationId,
      upcoming,
      url: request.url,
    });

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Create search query
    const searchQuery: any = {};

    // Add search filter (name, location, description)
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { eventDesc: { $regex: search, $options: "i" } },
      ];
    }

    // Add type filter
    if (type) {
      searchQuery.type = type;
    }

    // Add organization filter
    if (organizationId) {
      searchQuery.organizationId = organizationId;
    }

    // Add upcoming events filter
    if (upcoming) {
      searchQuery.eventDate = { $gte: new Date() };
    }

    console.log("3. MongoDB query:", {
      searchQuery,
      skip,
      limit,
      sort: { eventDate: -1 },
    });

    // Get total count for pagination
    const totalEvents = await Event.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalEvents / limit);

    console.log("4. Pagination info:", {
      totalEvents,
      totalPages,
      currentPage: page,
    });

    // Fetch events with pagination
    console.log("5. Fetching events...");
    const events = await Event.find(searchQuery)
      .sort({ eventDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("creatorUserId", "name email")
      .populate("organizationId", "name")
      .populate("campaignIds", "name status");

    console.log("6. Events fetched:", {
      count: events.length,
      eventIds: events.map((e) => e._id),
    });

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          total: totalEvents,
          totalPages,
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching events:", {
      error_message: error instanceof Error ? error.message : "Unknown error",
      error_stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch events",
      },
      { status: 500 }
    );
  }
}
