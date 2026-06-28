import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini SDK safely
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment variables. Falling back to mock disease predictions.');
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

async function imageUrlToGenerativePart(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      }
    };
  } catch (error: any) {
    console.error('Error fetching image URL for Gemini:', error);
    // Return a dummy part or throw
    throw new Error(`Failed to download crop image for AI: ${error.message}`);
  }
}

export interface IGeminiDiseaseResult {
  disease: string;
  confidence: number;
  causes: string;
  symptomsDetail: string;
  prevention: string;
  fertilizers: string[];
  pesticides: string[];
  organicTreatment: string;
  dosage: string;
  applicationMethod: string;
  safetyPrecautions: string;
  recoveryTimeline: string;
  recommendedProducts: string[];
}

export const analyzeCropDisease = async (
  cropName: string,
  imageUrl: string,
  answers: Record<string, string>
): Promise<IGeminiDiseaseResult> => {
  const model = getGeminiModel();

  if (!model) {
    // Return simulated realistic data if Gemini is not configured
    return getMockPrediction(cropName, answers);
  }

  try {
    const imagePart = await imageUrlToGenerativePart(imageUrl);
    const prompt = `
You are an expert plant pathologist. Analyze this crop image and the metadata provided by the farmer.
Identify the crop disease, confidence score, possible causes, symptoms, and recommend structured treatments.

Farmer Inputs:
- Crop Name: ${cropName}
- Symptoms reported: ${answers['Symptoms'] || 'Not specified'}
- All Form Answers: ${JSON.stringify(answers)}

Return ONLY a raw JSON object matching the following structure. Do not wrap in markdown blocks like \`\`\`json.
{
  "disease": "Disease Name (e.g. Tomato Late Blight or Paddy Blast)",
  "confidence": 0.92, // Float between 0.0 and 1.0
  "causes": "Explanation of possible causes (fungal/bacterial/environmental/pest details)",
  "symptomsDetail": "Visual symptoms expected or seen on the leaves or fruit",
  "prevention": "Preventive measures (crop rotation, clean seeds, spacing)",
  "fertilizers": ["NPK 19:19:19", "Potash", "Zinc Soluble"], // List of recommended fertilizers
  "pesticides": ["Azoxystrobin", "Neem Oil", "Mancozeb"], // List of recommended pesticides/fungicides
  "organicTreatment": "Detailed organic/natural remedies (neem spray, buttermilk spray, ash application)",
  "dosage": "Clear dilution/application dosage (e.g. 2ml/L of water)",
  "applicationMethod": "Method of application (Foliar spray in early morning, Soil drenching, etc.)",
  "safetyPrecautions": "Protective gear, wind direction caution, pre-harvest interval",
  "recoveryTimeline": "Expected recovery timeline (e.g. 7-14 days)",
  "recommendedProducts": ["Neem Oil", "NPK", "Fungicide"] // Keywords to search in marketplace catalog
}
`;

    const result = await model.generateContent({
      contents: [{ text: prompt } as any, imagePart as any],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: IGeminiDiseaseResult = JSON.parse(cleanJson);
    return parsed;
  } catch (error: any) {
    console.error('Error with Gemini API generation:', error);
    // Fallback to mock on API error
    return getMockPrediction(cropName, answers);
  }
};

const getMockPrediction = (cropName: string, answers: Record<string, string>): IGeminiDiseaseResult => {
  const crop = cropName.toLowerCase();
  
  if (crop.includes('tomato')) {
    return {
      disease: 'Tomato Early Blight (Alternaria solani)',
      confidence: 0.88,
      causes: 'Fungal pathogen thriving in warm temperatures and high humidity/wetness.',
      symptomsDetail: 'Concentric rings (target spots) starting on older lower leaves, leaf yellowing, and defoliation.',
      prevention: 'Ensure proper plant spacing, water soil directly (avoid wetting leaves), and rotate crops annually.',
      fertilizers: ['Calcium Nitrate', 'NPK 19:19:19'],
      pesticides: ['Mancozeb', 'Copper Fungicide'],
      organicTreatment: 'Spray 5% neem seed kernel extract or diluted baking soda solution.',
      dosage: 'Mix 3g Fungicide or 5ml Neem Oil in 1 Liter of water.',
      applicationMethod: 'Foliar spray covering both upper and lower leaf surfaces during early morning.',
      safetyPrecautions: 'Wear gloves, spray in low wind, wash hands thoroughly after application.',
      recoveryTimeline: '7 to 10 days post-treatment',
      recommendedProducts: ['Organic Neem Oil', 'Kisan Fertilisers NPK']
    };
  } else if (crop.includes('rice') || crop.includes('paddy')) {
    return {
      disease: 'Rice Blast (Magnaporthe oryzae)',
      confidence: 0.91,
      causes: 'Fungal spores spread easily by wind, favored by warm, moist weather with high nitrogen usage.',
      symptomsDetail: 'Diamond-shaped spots with gray centers and reddish-brown borders on leaves and leaf sheath.',
      prevention: 'Avoid excessive nitrogen fertilization, use certified seeds, and plant resistant varieties.',
      fertilizers: ['Potash (MOP)', 'NPK 12:32:16'],
      pesticides: ['Tricyclazole', 'Azoxystrobin'],
      organicTreatment: 'Foliar spray of 10% cow urine or Pseudomonas fluorescens formulation.',
      dosage: '1 gram Tricyclazole per Liter of water.',
      applicationMethod: 'Uniform foliar spray on crop canopy at initial leaf spot sighting.',
      safetyPrecautions: 'Avoid inhalation, wear protective mask, wash clothes immediately.',
      recoveryTimeline: '10 to 14 days',
      recommendedProducts: ['Fungicide Plus', 'NPK Power']
    };
  } else {
    return {
      disease: `${cropName} Leaf Spot Disease`,
      confidence: 0.82,
      causes: 'Pathogen infestation exacerbated by dense planting and lack of soil nutrients.',
      symptomsDetail: 'Small brownish spots appearing along the leaf veins and spreading across leaf margins.',
      prevention: 'Prune infected lower foliage, weed regularly, and keep soil aerated.',
      fertilizers: ['Balanced NPK 19:19:19', 'Micronutrients Mix'],
      pesticides: ['Broad Spectrum Fungicide', 'Neem Oil'],
      organicTreatment: 'Apply compost tea or spray dilute copper hydroxide solution.',
      dosage: '2ml or 2g per Liter of water.',
      applicationMethod: 'Foliar application at 7-day intervals until symptoms disappear.',
      safetyPrecautions: 'Use protective goggles, do not spray near open water sources.',
      recoveryTimeline: '10 to 12 days',
      recommendedProducts: ['Organic Neem Oil', 'NPK Power']
    };
  }
};
