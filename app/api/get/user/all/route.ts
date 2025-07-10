import connectMongo from "@/db/mongoose";
import { User } from "@/model/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const filter = searchParams.get('filter');

  await connectMongo();

  if (start !== null) {
    const startIndex = Number(start);
    if (isNaN(startIndex) || startIndex < 0) {
      return NextResponse.json({ error: "Invalid start index" }, { status: 400 });
    }
    const users = await User.find()
      .skip(startIndex)
      .limit(10);
    return NextResponse.json(users, { status: 200 });
  }

  if (filter) {
    const users = await User.find().select(filter)
    return NextResponse.json(users, { status: 200 });
  }

  return NextResponse.json([], { status: 200 });
}
