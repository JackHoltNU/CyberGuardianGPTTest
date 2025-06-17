import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserProgress from "../../models/UserProgress";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Check if user is in study
    const userProgress = await UserProgress.findOne({ username });
    if (!userProgress) {
      return NextResponse.json(
        { error: "User is not in the study" },
        { status: 404 }
      );
    }

    // Remove user from study
    await UserProgress.deleteOne({ username });

    return NextResponse.json({ 
      message: "User removed from study successfully"
    });
  } catch (error) {
    console.error("Error removing user from study:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}