import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserProgress from "../../models/UserProgress";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: "Username parameter is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const userProgress = await UserProgress.findOne({ username });

    if (!userProgress) {
      return NextResponse.json(
        { error: "User progress not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ userProgress });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}