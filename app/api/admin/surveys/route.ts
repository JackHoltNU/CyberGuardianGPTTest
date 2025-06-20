import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../../lib/mongodb";
import SurveyTemplate from "../../../models/SurveyTemplate";

// GET - List all surveys
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const surveys = await SurveyTemplate.find({})
      .sort({ createdAt: -1 })
      .select('name title studyDays isActive isLocalhost createdAt updatedAt');

    return NextResponse.json({ surveys });
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new survey
export async function POST(request: NextRequest) {
  try {
    const surveyData = await request.json();

    if (!surveyData.name || !surveyData.title || !surveyData.instructions || 
        !surveyData.criteria || !surveyData.items) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if survey name already exists
    const existingSurvey = await SurveyTemplate.findOne({ name: surveyData.name });
    if (existingSurvey) {
      return NextResponse.json(
        { error: "Survey name already exists" },
        { status: 400 }
      );
    }

    const survey = new SurveyTemplate({
      name: surveyData.name,
      title: surveyData.title,
      instructions: surveyData.instructions,
      criteria: surveyData.criteria,
      items: surveyData.items,
      studyDays: surveyData.studyDays || '',
      isActive: surveyData.isActive || false,
      isLocalhost: surveyData.isLocalhost !== false // Default to true
    });

    await survey.save();

    return NextResponse.json({ 
      message: "Survey created successfully",
      survey: survey
    });
  } catch (error) {
    console.error("Error creating survey:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}