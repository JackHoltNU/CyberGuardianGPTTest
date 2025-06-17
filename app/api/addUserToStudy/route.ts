import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserProgress from "../../models/UserProgress";
import User from "../../models/User";

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
    
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already in study
    const existingProgress = await UserProgress.findOne({ username });
    if (existingProgress) {
      return NextResponse.json(
        { error: "User is already in the study" },
        { status: 400 }
      );
    }

    // Create new user progress entry
    const newUserProgress = new UserProgress({
      username,
      studyStartDate: new Date(),
      dailyInteractions: [],
      currentDay: 1,
      completedDays: 0,
      isStudyComplete: false
    });

    await newUserProgress.save();

    return NextResponse.json({ 
      message: "User added to study successfully",
      userProgress: newUserProgress 
    });
  } catch (error) {
    console.error("Error adding user to study:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}