import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import User from "../../models/User";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const users = await User.find({}, { username: 1, role: 1, _id: 0 }).sort({ username: 1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}