import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import SurveyResponse from "../../models/SurveyResponse";
import UserProgress from "../../models/UserProgress";

export async function POST(request: NextRequest) {
  try {
    const { 
      username, 
      surveyId, 
      surveyType, 
      response, 
      studyDay, 
      sessionId, 
      timeSpent 
    } = await request.json();

    if (!username || !surveyId || !surveyType || !response) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get user's current study day if not provided
    let currentStudyDay = studyDay;
    if (!currentStudyDay) {
      const userProgress = await UserProgress.findOne({ username });
      currentStudyDay = userProgress?.currentDay || 1;
    }

    // Check if response already exists (prevent duplicates)
    const existingResponse = await SurveyResponse.findOne({
      username,
      surveyId,
      studyDay: currentStudyDay
    });

    if (existingResponse) {
      // Update existing response
      existingResponse.response = response;
      existingResponse.completedAt = new Date();
      if (timeSpent) existingResponse.timeSpent = timeSpent;
      await existingResponse.save();
      
      return NextResponse.json({ 
        message: "Survey response updated successfully",
        responseId: existingResponse._id
      });
    } else {
      // Create new response
      const surveyResponse = new SurveyResponse({
        username,
        surveyId,
        surveyType,
        response,
        studyDay: currentStudyDay,
        sessionId,
        timeSpent
      });

      await surveyResponse.save();

      return NextResponse.json({ 
        message: "Survey response saved successfully",
        responseId: surveyResponse._id
      });
    }
  } catch (error) {
    console.error("Error saving survey response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}