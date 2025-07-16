import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Gift from "@/models/Gifts";

export async function GET(_request: Request, context: any): Promise<Response> {
  try {
    await dbConnect();

    const { id } = context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Gift ID is required" },
        { status: 400 }
      );
    }

    const gift = await Gift.findById(id).select({
      _id: 1,
      name: 1,
      price: 1,
      "images.primaryImgUrl": 1,
      descShort: 1,
    });

    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    return NextResponse.json(gift);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch gift" },
      { status: 500 }
    );
  }
}
