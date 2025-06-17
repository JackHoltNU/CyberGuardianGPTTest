import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserProgress from "../../models/UserProgress";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const participants = await UserProgress.find({}, {
      username: 1,
      studyStartDate: 1,
      currentDay: 1,
      completedDays: 1,
      isStudyComplete: 1,
      _id: 0
    }).sort({ username: 1 });

    return NextResponse.json({ participants });
  } catch (error) {
    console.error("Error fetching study participants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}