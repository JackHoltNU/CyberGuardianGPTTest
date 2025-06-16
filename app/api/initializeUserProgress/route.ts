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
    
    // Check if user progress already exists
    const existingProgress = await UserProgress.findOne({ username });
    
    if (existingProgress) {
      return NextResponse.json({ 
        message: "User progress already exists",
        userProgress: existingProgress 
      });
    }

    // Create new user progress
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
      message: "User progress initialized successfully",
      userProgress: newUserProgress 
    });
  } catch (error) {
    console.error("Error initializing user progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}