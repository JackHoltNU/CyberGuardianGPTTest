import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import SurveyTemplate from "../../models/SurveyTemplate";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studyDay = parseInt(searchParams.get('studyDay') || '1');
    const isLocalhost = searchParams.get('isLocalhost') === 'true';
    const isStudyParticipant = searchParams.get('isStudyParticipant') === 'true';

    await connectToDatabase();
    
    // Get all active surveys
    const surveys = await SurveyTemplate.find({ isActive: true });

    // Filter surveys based on conditions
    const filteredSurveys = surveys.filter((template) => {
      // Check environment
      if (isStudyParticipant) {
        // Study participants can access all surveys (both localhost and production)
        // No environment filtering needed
      } else {
        // Non-study participants use original localhost logic
        if (isLocalhost && !template.isLocalhost) return false;
        if (!isLocalhost && template.isLocalhost) return false;
      }
      
      // Check study day (if specified)
      if (template.studyDays) {
        const surveyDays = template.studyDays.split(',')
          .map((day: string) => parseInt(day.trim()))
          .filter((day: number) => !isNaN(day));
        
        if (surveyDays.length > 0 && !surveyDays.includes(studyDay)) return false;
      }
      
      return true;
    });

    // Convert to the format expected by the frontend
    const formattedSurveys = filteredSurveys.map((template) => {
      // Parse items from string format
      const items = template.items.split('\n')
        .filter((line: string) => line.trim())
        .map((line: string, index: number) => {
          const parts = line.split('|').map((part: string) => part.trim());
          return {
            id: `item_${index + 1}`,
            text: parts[0],
            description: parts[1] || undefined
          };
        });

      return {
        id: template._id.toString(),
        type: 'sorting',
        config: {
          id: template.name,
          title: template.title,
          instructions: template.instructions,
          criteria: template.criteria,
          items: items
        }
      };
    });

    return NextResponse.json({ surveys: formattedSurveys });
  } catch (error) {
    console.error("Error fetching active surveys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}