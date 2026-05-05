import fs from 'fs'
import path from 'path'

// Load configurations
const evaluationsPath = path.join(__dirname, '../data/evaluations.json')
const scenariosPath = path.join(__dirname, '../data/scenarios.json')

export function generateEvaluationPrompt(scenarioName: string, transcript: string): string {
  const evaluations = JSON.parse(fs.readFileSync(evaluationsPath, 'utf8'))
  const scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'))
  const scenario = scenarios.find((s: any) => s.scenario_name === scenarioName) || scenarios[0]

  // Focus areas for this scenario
  const focusAreas = scenario.coaching_focus_areas || []
  
  // Format the evaluation criteria
  const evaluationCriteriaText = Object.keys(evaluations).map(key => {
    const isFocusArea = focusAreas.includes(key) ? '(CRITICAL FOCUS FOR THIS SCENARIO)' : ''
    const ev = evaluations[key]
    return `
- ${key} ${isFocusArea}:
  Description: ${ev.description}
  High Score Indicator: ${ev.high_score_indicators}
  Low Score Indicator: ${ev.low_score_indicators}`
  }).join('\n')

  return `You are an expert Sales Coach Analyst. You are evaluating a sales practice conversation between an AI Persona (acting as the buyer) and a human Sales Rep.

--- EVALUATION CRITERIA ---
Evaluate the rep strictly on the following metrics:
${evaluationCriteriaText}

--- SCENARIO CONTEXT ---
The rep was supposed to achieve this goal: ${scenario.sales_rep_goal}
Expected Success Outcome: ${scenario.expected_success_outcome}
Failure Conditions: ${scenario.failure_conditions}

--- TRANSCRIPT ---
${transcript}

--- INSTRUCTIONS ---
Analyse the transcript deeply. Identify specific moments where the rep succeeded or failed.
Return ONLY a raw JSON object with no markdown formatting, no backticks, and no extra text.
The JSON must follow this exact structure:
{
  "scores": {
    "empathy": <number 0-100>,
    "objection_handling": <number 0-100>,
    "confidence": <number 0-100>,
    "listening": <number 0-100>,
    "executive_communication": <number 0-100>,
    "questioning_ability": <number 0-100>
  },
  "overall_score": <average of the 6 scores above (number 0-100)>,
  "summary": "<concise narrative summary of the interaction>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "objections_analysis": [
    {
      "objection": "<the specific objection raised by the customer>",
      "rep_response": "<how the rep responded>",
      "is_effective": <boolean>,
      "feedback": "<why it was or wasn't effective>"
    }
  ],
  "highlights": [
    {
      "type": "strong" | "weak",
      "rep_quote": "<exact quote from the rep>",
      "context": "<why this was a strong or weak moment>",
      "suggestion": "<for weak moments, provide a suggested better response; for strong moments, leave empty>"
    }
  ],
  "emotional_tracking": [
    {
      "moment": "<specific point in the conversation>",
      "customer_reaction": "<how the customer felt: e.g. frustrated, engaged, trusting, annoyed>"
    }
  ],
  "outcome_analysis": "<explanation of why the conversation succeeded or failed and the major turning points>",
  "next_practice_recommendation": "<suggested specific scenario or skill to practice next>"
}
`
}
