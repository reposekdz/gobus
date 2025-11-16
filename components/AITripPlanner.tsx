import React, { useState } from 'react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { XIcon, SparklesIcon, PaperAirplaneIcon, BusIcon, ArrowRightIcon } from './icons';

interface AITripPlannerProps {
  onClose: () => void;
  onPlanTrip: (from: string, to: string) => void;
}

const AITripPlanner: React.FC<AITripPlannerProps> = ({ onClose, onPlanTrip }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripSuggestions, setTripSuggestions] = useState<any[] | null>(null);

  const handlePlanTrip = async () => {
    if (!prompt.trim()) {
      setError('Please describe your desired trip.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setTripSuggestions(null);

    try {
      const apiKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }
      const ai = new GoogleGenerativeAI(apiKey);
      
      const systemInstruction = `You are an expert travel itinerary planner for a bus booking platform in Rwanda. 
      Your task is to analyze a user's free-form text about their travel plans and generate a structured itinerary.
      - Infer departure and destination cities from landmarks, activities, or regions (e.g., 'see gorillas' implies Musanze, 'Nyungwe forest' implies a nearby town like Gisakura, 'the lake' implies Rubavu/Kivu).
      - If the user mentions a return trip (e.g., 'weekend trip', 'come back on Sunday', '3-day trip'), you must provide both a departure and a return trip suggestion.
      - Provide a brief, encouraging justification for your suggestion, explaining your reasoning if you had to infer a location.
      - The main cities in Rwanda are: Kigali, Musanze, Rubavu, Huye, Rusizi, Nyagatare, Muhanga, Gisakura. Always map user input to one of these.
      - The final output MUST be a valid JSON object.`;

      const model = ai.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        systemInstruction: systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              suggestions: {
                type: SchemaType.ARRAY,
                description: "An array of one or more trip suggestions.",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    justification: { type: SchemaType.STRING, description: "A brief, friendly explanation of why this trip was suggested." },
                    departure: {
                      type: SchemaType.OBJECT,
                      properties: { from: { type: SchemaType.STRING }, to: { type: SchemaType.STRING } },
                      required: ['from', 'to']
                    },
                    return: {
                      type: SchemaType.OBJECT,
                      properties: { from: { type: SchemaType.STRING }, to: { type: SchemaType.STRING } },
                    }
                  },
                  required: ['justification', 'departure']
                }
              }
            },
            required: ['suggestions']
          }
        }
      });

      const response = await model.generateContent(prompt);
      
      const text = response.response.text().trim();
      const result = JSON.parse(text);

      if (result.suggestions && result.suggestions.length > 0) {
        setTripSuggestions(result.suggestions);
      } else {
        throw new Error('Could not determine a valid route from your request.');
      }
    } catch (e) {
      console.error(e);
      setError('Sorry, I had trouble creating a plan from your request. Could you try being more specific about where you\'re going and coming from?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
      onPlanTrip(suggestion.departure.from, suggestion.departure.to);
      onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full relative" 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10">
          <XIcon className="w-6 h-6" />
        </button>
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="w-8 h-8 text-yellow-400" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">AI Trip Planner</h2>
          </div>
          
          {!tripSuggestions ? (
            <>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                    Describe your ideal trip, and we'll figure out the details. Try something like:
                    <em className="block my-1 text-gray-500 dark:text-gray-500">"A weekend trip from Kigali to see the gorillas"</em>
                    <em className="block text-gray-500 dark:text-gray-500">"I want to go from Huye to the lake in Rubavu and come back Tuesday"</em>
                </p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500/50 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Tell us about your travel plans..."
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <button
                    onClick={handlePlanTrip}
                    disabled={isLoading}
                    className="mt-4 w-full flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0033A0] font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-t-[#0033A0] border-l-[#0033A0] border-b-transparent border-r-transparent rounded-full animate-spin mr-2"></div>
                        Planning...
                    </>
                    ) : (
                    <>
                        Plan My Trip <PaperAirplaneIcon className="w-5 h-5 ml-2" />
                    </>
                    )}
                </button>
            </>
          ) : (
            <div>
                <h3 className="font-bold text-lg dark:text-white mb-2">Here's what I found:</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {tripSuggestions.map((suggestion, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-700/50">
                            <p className="text-sm italic text-gray-600 dark:text-gray-300 mb-3">"{suggestion.justification}"</p>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <BusIcon className="w-5 h-5 text-blue-500"/>
                                    <p className="font-semibold">{suggestion.departure.from} <ArrowRightIcon className="inline w-4 h-4"/> {suggestion.departure.to}</p>
                                </div>
                                {suggestion.return && (
                                    <div className="flex items-center space-x-2">
                                        <BusIcon className="w-5 h-5 text-green-500"/>
                                        <p className="font-semibold">{suggestion.return.from} <ArrowRightIcon className="inline w-4 h-4"/> {suggestion.return.to}</p>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => handleSuggestionClick(suggestion)} className="mt-4 w-full text-sm font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 py-2 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900">
                                Search this trip
                            </button>
                        </div>
                    ))}
                </div>
                 <button onClick={() => { setTripSuggestions(null); setPrompt(''); }} className="mt-4 text-sm text-center w-full text-gray-500 hover:underline">
                    Plan another trip
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITripPlanner;