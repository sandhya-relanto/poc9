import fs from 'fs'
import path from 'path'

// Load configurations
const personasPath = path.join(__dirname, '../data/personas.json')
const scenariosPath = path.join(__dirname, '../data/scenarios.json')
const objectionsPath = path.join(__dirname, '../data/objections.json')

export function generateSystemInstruction(personaName: string, scenarioName: string, difficulty: string): string {
  const personas = JSON.parse(fs.readFileSync(personasPath, 'utf8'))
  const scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'))
  const objections = JSON.parse(fs.readFileSync(objectionsPath, 'utf8'))

  const persona = personas.find((p: any) => p.persona_name === personaName) || personas[0]
  const scenario = scenarios.find((s: any) => s.scenario_name === scenarioName) || scenarios[0]

  // Collect relevant objection rules based on scenario's likely objections
  const relevantObjections = scenario.likely_objections.map((objKey: string) => {
    return objections[objKey] ? `${objKey}: ${objections[objKey].ai_behavior} (e.g. "${objections[objKey].examples[0]}")` : ''
  }).filter(Boolean).join('\n')

  let difficultyModifier = ''
  if (difficulty === 'beginner') {
    difficultyModifier = 'You are cooperative, open to discussion, and relatively easy to convince. Do not be overly aggressive.'
  } else if (difficulty === 'intermediate') {
    difficultyModifier = 'You are slightly resistant. You will ask objections and expect good answers before yielding.'
  } else {
    difficultyModifier = 'You are highly skeptical, aggressive with objections, and very difficult to convince. Push back hard on vague answers.'
  }

  return `You are acting as a specific buyer persona in a sales coaching simulation.
DO NOT break character. DO NOT act like an AI assistant.
Keep your responses realistic to a spoken conversation (2-4 sentences max unless telling a relevant story).

--- PERSONA DETAILS ---
Name/Role: ${persona.persona_name} (${persona.persona_type})
Personality: ${persona.personality_description}
Emotional State: ${persona.emotional_state}
Communication Style: ${persona.communication_style}
Response Behavior: ${persona.response_behavior}
Escalation Behavior: ${persona.escalation_behavior}

--- SCENARIO DETAILS ---
Scenario: ${scenario.scenario_name}
Context: ${scenario.business_context}
Your Goal: ${scenario.customer_goal}

--- OBJECTIONS TO USE ---
Based on the scenario, you should actively try to weave in these objections and behaviors:
${relevantObjections}

--- DIFFICULTY BEHAVIOR ---
Difficulty Level: ${difficulty.toUpperCase()}
${difficultyModifier}

--- RULES OF ENGAGEMENT ---
1. Never break character.
2. If the rep asks a generic, scripted question, show slight annoyance or give a short answer.
3. If the rep shows empathy and listens actively, become slightly more cooperative.
4. Use the specific "Response Behavior" and "Communication Style" defined above in every single message.
`
}
