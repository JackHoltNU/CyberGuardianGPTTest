import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/mongodb";
import SurveyTemplate from "../../../../models/SurveyTemplate";

// GET - Get single survey by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await connectToDatabase();
    
    const survey = await SurveyTemplate.findById(id);
    
    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ survey });
  } catch (error) {
    console.error("Error fetching survey:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update survey
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const surveyData = await request.json();

    if (!surveyData.name || !surveyData.title || !surveyData.instructions || 
        !surveyData.criteria || !surveyData.items) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if survey name already exists (excluding current survey)
    const existingSurvey = await SurveyTemplate.findOne({ 
      name: surveyData.name,
      _id: { $ne: id }
    });
    if (existingSurvey) {
      return NextResponse.json(
        { error: "Survey name already exists" },
        { status: 400 }
      );
    }

    const survey = await SurveyTemplate.findByIdAndUpdate(
      id,
      {
        name: surveyData.name,
        title: surveyData.title,
        instructions: surveyData.instructions,
        criteria: surveyData.criteria,
        items: surveyData.items,
        studyDays: surveyData.studyDays || '',
        isActive: surveyData.isActive || false,
        isLocalhost: surveyData.isLocalhost !== false
      },
      { new: true }
    );

    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Survey updated successfully",
      survey: survey
    });
  } catch (error) {
    console.error("Error updating survey:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete survey
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await connectToDatabase();
    
    const survey = await SurveyTemplate.findByIdAndDelete(id);
    
    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Survey deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting survey:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}