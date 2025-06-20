import { SurveyDefinition } from '../types/survey';

// Helper function to parse items from string format
function parseItems(itemsString: string) {
  return itemsString.split('\n')
    .filter(line => line.trim())
    .map((line, index) => {
      const parts = line.split('|').map(part => part.trim());
      return {
        id: `item_${index + 1}`,
        text: parts[0],
        description: parts[1] || undefined
      };
    });
}

// Helper function to parse study days from string
function parseStudyDays(studyDaysString: string): number[] {
  if (!studyDaysString.trim()) return [];
  return studyDaysString.split(',')
    .map(day => parseInt(day.trim()))
    .filter(day => !isNaN(day));
}

// Convert database survey template to SurveyDefinition
function convertTemplateToSurvey(template: any): SurveyDefinition {
  return {
    id: template._id || template.id,
    type: 'sorting',
    config: {
      id: template.name,
      title: template.title,
      instructions: template.instructions,
      criteria: template.criteria,
      items: parseItems(template.items)
    },
    conditions: {
      studyDays: parseStudyDays(template.studyDays),
      onlyOnce: true
    }
  };
}

// Fetch active surveys from database
export async function getSurveysForUser(username: string, studyDay: number, isLocalhost: boolean = false): Promise<SurveyDefinition[]> {
  try {
    const response = await fetch('/api/admin/surveys');
    const data = await response.json();
    
    if (!response.ok || !data.surveys) {
      return [];
    }

    // Filter surveys based on conditions
    const activeSurveys = data.surveys.filter((template: any) => {
      // Must be active
      if (!template.isActive) return false;
      
      // Check environment
      if (isLocalhost && !template.isLocalhost) return false;
      if (!isLocalhost && template.isLocalhost) return false;
      
      // Check study day (if specified)
      const surveyDays = parseStudyDays(template.studyDays);
      if (surveyDays.length > 0 && !surveyDays.includes(studyDay)) return false;
      
      return true;
    });

    // Convert to SurveyDefinition format
    return activeSurveys.map(convertTemplateToSurvey);
    
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return [];
  }
}

export async function shouldShowSurveys(studyDay: number, isLocalhost: boolean = false): Promise<boolean> {
  const surveys = await getSurveysForUser('', studyDay, isLocalhost);
  return surveys.length > 0;
}

// Legacy exports for backward compatibility (now using database)
export const cybersecurityPrioritiesSurvey: SurveyDefinition = {
  id: 'legacy-cybersecurity-priorities',
  type: 'sorting',
  config: {
    id: 'cybersecurity-priorities',
    title: 'Cybersecurity Priorities',
    instructions: 'Please rank these cybersecurity concepts by how important they are to you personally.',
    criteria: 'Most important to least important for your personal cybersecurity',
    items: [
      { id: 'strong-passwords', text: 'Strong Passwords', description: 'Using complex, unique passwords' },
      { id: 'software-updates', text: 'Software Updates', description: 'Keeping your OS and apps updated' }
    ]
  }
};