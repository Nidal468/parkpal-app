import connectMongo from "@/db/mongoose";
import { ISpaces, Spaces } from "@/model/spaces";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const available = searchParams.get("available");
    
    await connectMongo();

    const filter: any = {};

    if (available !== null) {
        filter.is_available = true;
    }

    const spaces:ISpaces[] = await Spaces.find(filter);

    return NextResponse.json(spaces, { status: 200 });
}
