import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import connectMongo from "@/db/mongoose";
import { User } from "@/model/user";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json('Unauthorized', { status: 401 });
  };

  await connectMongo();
  const id = session.user.id;
  const user = await User.findById(id)
  return NextResponse.json(user, { status: 200 });
}
