import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import SurveyResponse from '@/app/models/SurveyResponse';
import SurveyTemplate from '@/app/models/SurveyTemplate';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');
    const studyDay = searchParams.get('studyDay');
    
    // Build query based on filters
    const query: any = {};
    if (surveyId) {
      // surveyId in responses contains the survey name, not _id
      // So we need to find the survey name from the _id
      const survey = await SurveyTemplate.findById(surveyId, 'name').lean();
      if (survey && survey.name) {
        query.surveyId = survey.name;
      } else {
        // If survey not found, return empty results
        return NextResponse.json({
          responses: [],
          surveys: await SurveyTemplate.find({}, 'name title').lean(),
          studyDays: await SurveyResponse.distinct('studyDay')
        });
      }
    }
    if (studyDay) {
      query.studyDay = parseInt(studyDay);
    }
    
    // Fetch responses (no populate needed since surveyId is just a string)
    const responses = await SurveyResponse.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    // Add survey details manually
    const responsesWithSurveyInfo = await Promise.all(
      responses.map(async (response) => {
        const surveyTemplate = await SurveyTemplate.findOne({ name: response.surveyId }).lean();
        return {
          ...response,
          surveyInfo: surveyTemplate ? { name: surveyTemplate.name, title: surveyTemplate.title } : null
        };
      })
    );
    
    // Get all unique surveys and study days for dropdown options
    const allSurveys = await SurveyTemplate.find({}, 'name title').lean();
    const allStudyDays = await SurveyResponse.distinct('studyDay');
    
    console.log('API Debug - Query:', query);
    console.log('API Debug - Found surveys:', allSurveys.length);
    console.log('API Debug - Found study days:', allStudyDays);
    console.log('API Debug - Found responses:', responses.length);
    
    return NextResponse.json({
      responses: responsesWithSurveyInfo,
      surveys: allSurveys,
      studyDays: allStudyDays.sort((a, b) => a - b)
    });
    
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey responses' },
      { status: 500 }
    );
  }
}