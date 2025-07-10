import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../lib/mongodb';
import SurveyResponse from '../../models/SurveyResponse';
import SurveyTemplate from '../../models/SurveyTemplate';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Get all survey templates to build the dropdown
    const surveys = await SurveyTemplate.find({ isActive: true }).select('name title');
    
    // Get all survey responses for this user on days 2 and 14
    const responses = await SurveyResponse.find({
      username: username,
      studyDay: { $in: [2, 14] },
      surveyType: 'sorting' // Filter for sorting/ranking surveys only
    }).sort({ studyDay: 1, completedAt: 1 });

    // Group responses by survey and day
    const surveyComparisons: Record<string, {
      surveyTitle: string;
      day2: any;
      day14: any;
    }> = {};

    // Initialize with available surveys
    surveys.forEach(survey => {
      surveyComparisons[survey.name] = {
        surveyTitle: survey.title,
        day2: null,
        day14: null
      };
    });

    // Populate with actual responses
    responses.forEach(response => {
      if (surveyComparisons[response.surveyId]) {
        const dayKey = response.studyDay === 2 ? 'day2' : 'day14';
        surveyComparisons[response.surveyId][dayKey] = {
          response: response.response,
          completedAt: response.completedAt,
          timeSpent: response.timeSpent
        };
      }
    });

    return NextResponse.json({
      surveys: Object.entries(surveyComparisons).map(([surveyId, data]) => ({
        surveyId,
        surveyTitle: data.surveyTitle,
        day2: data.day2,
        day14: data.day14
      }))
    });

  } catch (error) {
    console.error('Error fetching participant survey comparison:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}