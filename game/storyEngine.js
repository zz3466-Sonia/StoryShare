// Story generation engine using Dedalus AI API or fallback

const Dedalus = require('dedalus-labs').default;

// Configuration
const DEDALUS_API_KEY = process.env.DEDALUS_API_KEY;
const DEDALUS_MODEL = process.env.DEDALUS_MODEL || 'anthropic/claude-sonnet-4-20250514';
const STORY_WORD_LIMIT = Number.parseInt(process.env.STORY_WORD_LIMIT, 10) || 30;
const DEDALUS_MODEL_FALLBACKS = [
  DEDALUS_MODEL,
  'anthropic/claude-opus-4-6',
  'openai/gpt-4o',
  'google/gemini-1.5-pro',
  'xai/grok-2-latest'
].filter((value, index, self) => value && self.indexOf(value) === index);

// Fallback story rounds by theme
const STORY_ROUNDS = {
  scifi: [
    {
      story: 'The astronaut, the AI, and the alien meet in a silent space station. The AI warns of an unknown signal.',
      choices: ['A) Trust the AI', 'B) Question the AI', 'C) Contact the alien']
    },
    {
      story: 'The signal grows louder. The alien reveals a hidden hatch. The astronaut hesitates.',
      choices: ['A) Open the hatch', 'B) Ask for proof', 'C) Walk away']
    },
    {
      story: 'A strange light spills out. The AI begins to glitch. The alien offers a deal.',
      choices: ['A) Accept the deal', 'B) Refuse and run', 'C) Shut down the AI']
    }
  ],
  romance: [
    {
      story: 'Two Columbia undergrads lock eyes across the library table at Butler. An awkward moment stretches between them. Neither looks away.',
      choices: ['A) Smile and open up', 'B) Pretend to study', 'C) Friend texts—leave']
    },
    {
      story: 'Coffee after class. They talk about everything except what matters. The rain starts outside. They stay inside.',
      choices: ['A) Share headphones walking', 'B) Say goodbye quickly', 'C) Phone rings—family call']
    },
    {
      story: 'Late night on College Walk. The city glows around them. A moment of silence that says everything.',
      choices: ['A) Take their hand', 'B) Keep hands in pockets', 'C) Roommate catches up to them']
    }
  ],
  mystery: [
    {
      story: 'A detective arrives at a quiet coastal town. A mysterious package arrives at the harbor. No one claims it.',
      choices: ['A) Open the package', 'B) Question the dock workers', 'C) Wait for more clues']
    },
    {
      story: 'The suspect suddenly appears at the café. They seem nervous. The witness from earlier walks in.',
      choices: ['A) Confront them directly', 'B) Follow them discreetly', 'C) Interview the witness']
    },
    {
      story: 'A hidden letter is discovered in the old library. It changes everything. The plot thickens.',
      choices: ['A) Demand answers', 'B) Do more investigation', 'C) Contact the authorities']
    }
  ],
  adventure: [
    {
      story: 'The explorer discovers an ancient temple deep in the jungle. Strange markings glow on the walls. Your companions look nervous.',
      choices: ['A) Enter the temple', 'B) Set up camp outside', 'C) Search the perimeter first']
    },
    {
      story: 'A treasure chest appears before you. But the ground beneath is trembling. The guide hesitates.',
      choices: ['A) Grab the treasure', 'B) Run for higher ground', 'C) Help your companion']
    },
    {
      story: 'You stand at a crossroads. One path glows with ancient light. The other is shrouded in darkness.',
      choices: ['A) Choose the light', 'B) Choose the darkness', 'C) Ask for the guide\'s wisdom']
    }
  ]
};

class StoryEngine {
  constructor() {
    this.initializeClient();
  }

  initializeClient() {
    const apiKey = process.env.DEDALUS_API_KEY;
    if (apiKey) {
      this.hasApiKey = true;
      this.client = new Dedalus({ apiKey });
      console.log('🎨 Story engine: Dedalus AI API');
    } else {
      this.hasApiKey = false;
      this.client = null;
      console.log('⚠️  Story engine: Using fallback stories (no API key)');
    }
  }

  // Get fallback story round for specific theme
  getFallbackRound(roundIndex, theme = 'scifi') {
    const themeStories = STORY_ROUNDS[theme] || STORY_ROUNDS.scifi;
    const fallback = themeStories[Math.min(roundIndex, themeStories.length - 1)];
    return {
      story: fallback.story,
      choices: fallback.choices
    };
  }

  // Build prompt based on story theme
  buildPrompt(roundIndex, previousChoice, theme = 'scifi', previousStory = '') {
    const prompts = {
      scifi: this.buildSciFiPrompt(roundIndex, previousChoice, previousStory),
      romance: this.buildRomancePrompt(roundIndex, previousChoice, previousStory),
      mystery: this.buildMysteryPrompt(roundIndex, previousChoice, previousStory),
      adventure: this.buildAdventurePrompt(roundIndex, previousChoice, previousStory)
    };
    return prompts[theme] || prompts.scifi;
  }

  buildSciFiPrompt(roundIndex, previousChoice, previousStory) {
    const storyContext = previousStory
      ? `PREVIOUS STORY:\n${previousStory}\n\nPLAYERS CHOSE: ${previousChoice || 'No choice provided'}\n\n⚠️ IMPORTANT: Start with ONE short sentence that mentions the choice above, then continue the story.`
      : 'START: The signal appears on the silent space station. Introduce the three characters and the mysterious signal.';

    return [
      '=== INTERACTIVE SCI-FI STORY GENERATOR ===',
      'THREE CHARACTERS:',
      '- Astronaut (human explorer)',
      '- AI (advanced intelligence)',
      '- Alien (mysterious being)',
      '',
      `ROUND: ${roundIndex + 1}`,
      storyContext,
      '',
      'OUTPUT FORMAT (JSON):',
      '{',
      '  "story": "If continuing: Start with 1 SHORT sentence about what was chosen, then write 1-2 sentences (20-30 words total) continuing the story.",',
      '  "choices": [',
      '    "A) [Astronaut action]",',
      '    "B) [AI action]",',
      '    "C) [Alien action]"',
      '  ]',
      '}',
      '',
      'RULES:',
      '- English only',
      '- 2-3 sentences MAX (20-30 words TOTAL)',
      '- First sentence: briefly mention the choice',
      '- Then: continue the story',
      '- Choices <= 10 words',
      '- JSON only'
    ].join('\n');
  }

  buildRomancePrompt(roundIndex, previousChoice, previousStory) {
    const storyContext = previousStory
      ? `PREVIOUS STORY:\n${previousStory}\n\nPLAYERS CHOSE: ${previousChoice || 'No choice provided'}\n\n⚠️ IMPORTANT: Start with ONE short sentence that mentions the choice above, then continue the story.`
      : 'START: Two Columbia students meet in an ordinary campus moment. Make it feel real and slightly awkward.';

    return [
      '=== ROMANTIC CAMPUS STORY ===',
      'Columbia University setting. Two students (20-22). Real college life.',
      '',
      `ROUND: ${roundIndex + 1}`,
      storyContext,
      '',
      'OUTPUT FORMAT (JSON):',
      '{',
      '  "story": "If continuing: Start with 1 SHORT sentence about what was chosen, then write 1-2 sentences (20-30 words total) continuing the story.",',
      '  "choices": [',
      '    "A) [Stay/open up]",',
      '    "B) [Leave/distance]",',
      '    "C) [Interruption]"',
      '  ]',
      '}',
      '',
      'RULES:',
      '- English only',
      '- 2-3 sentences MAX (20-30 words TOTAL)',
      '- First sentence: briefly mention the choice',
      '- Then: continue the story',
      '- Choices <= 10 words',
      '- JSON only'
    ].join('\n');
  }

  buildMysteryPrompt(roundIndex, previousChoice, previousStory) {
    const storyContext = previousStory
      ? `PREVIOUS STORY:\n${previousStory}\n\nPLAYERS CHOSE: ${previousChoice || 'No choice provided'}\n\n⚠️ IMPORTANT: Start with ONE short sentence that mentions the choice above, then continue the story.`
      : 'START: A detective makes a curious discovery in a coastal town. Introduce the mystery.';

    return [
      '=== MYSTERY STORY ===',
      'Detective, suspect, witness in a coastal town.',
      '',
      `ROUND: ${roundIndex + 1}`,
      storyContext,
      '',
      'OUTPUT FORMAT (JSON):',
      '{',
      '  "story": "If continuing: Start with 1 SHORT sentence about what was chosen, then write 1-2 sentences (20-30 words total) continuing the story.",',
      '  "choices": [',
      '    "A) [Investigate deeper]",',
      '    "B) [Trust intuition]",',
      '    "C) [Uncover secret]"',
      '  ]',
      '}',
      '',
      'RULES:',
      '- English only',
      '- 2-3 sentences MAX (20-30 words TOTAL)',
      '- First sentence: briefly mention the choice',
      '- Then: continue the story',
      '- Choices <= 10 words',
      '- JSON only'
    ].join('\n');
  }

  buildAdventurePrompt(roundIndex, previousChoice, previousStory) {
    const storyContext = previousStory
      ? `PREVIOUS STORY:\n${previousStory}\n\nPLAYERS CHOSE: ${previousChoice || 'No choice provided'}\n\n⚠️ IMPORTANT: Start with ONE short sentence that mentions the choice above, then continue the story.`
      : 'START: An explorer, companion, and guide face danger in an exotic world. Begin the adventure.';

    return [
      '=== ADVENTURE STORY ===',
      'Explorer, companion, guide in a dangerous world.',
      '',
      `ROUND: ${roundIndex + 1}`,
      storyContext,
      '',
      'OUTPUT FORMAT (JSON):',
      '{',
      '  "story": "If continuing: Start with 1 SHORT sentence about what was chosen, then write 1-2 sentences (20-30 words total) continuing the story.",',
      '  "choices": [',
      '    "A) [Risky path]",',
      '    "B) [Safe route]",',
      '    "C) [Follow instinct]"',
      '  ]',
      '}',
      '',
      'RULES:',
      '- English only',
      '- 2-3 sentences MAX (20-30 words TOTAL)',
      '- First sentence: briefly mention the choice',
      '- Then: continue the story',
      '- Choices <= 10 words',
      '- JSON only'
    ].join('\n');
  }

  // Parse JSON from AI response (handles code blocks)
  safeParseJSON(text) {
    // Remove markdown code block markers if present
    let cleanText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    const match = cleanText.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  // Count words in text
  countWords(text) {
    return text.trim().split(/\s+/).length;
  }

  // Enforce word limit without awkward cut-offs
  enforceWordLimit(story, maxWords = STORY_WORD_LIMIT) {
    const words = story.trim().split(/\s+/);
    if (words.length <= maxWords) {
      return story;
    }

    const trimmed = words.slice(0, maxWords).join(' ');
    const lastStop = Math.max(
      trimmed.lastIndexOf('.'),
      trimmed.lastIndexOf('!'),
      trimmed.lastIndexOf('?')
    );

    if (lastStop > 20) {
      return trimmed.slice(0, lastStop + 1);
    }

    return trimmed.replace(/[.,!?]?$/, '.');
  }

  normalizeChoice(choice) {
    if (!choice) return '';
    const text = String(choice).trim();
    return text.replace(/^[A-C]\)\s*/i, '').trim();
  }

  ensureChoiceLeadIn(story, previousChoice) {
    if (!previousChoice) return story;
    const choiceText = this.normalizeChoice(previousChoice);
    if (!choiceText) return story;
    const firstSentence = story.split(/(?<=[.!?])\s+/)[0] || '';
    const lowerFirst = firstSentence.toLowerCase();
    const lowerChoice = choiceText.toLowerCase();
    if (lowerFirst.includes(lowerChoice)) {
      return story;
    }
    const lead = `They chose to ${choiceText.replace(/^[a-z]/, (c) => c.toLowerCase())}.`;
    return `${lead} ${story}`.trim();
  }

  // Generate story content (with API or fallback)
  async generateRound(roundIndex, previousChoice, theme = 'scifi', previousStory = '') {
    if (!this.hasApiKey || !this.client) {
      console.log(`⚠️  No API key, using fallback ${theme} story`);
      return this.getFallbackRound(roundIndex, theme);
    }

    try {
      const prompt = this.buildPrompt(roundIndex, previousChoice, theme, previousStory);

      let parsed = null;

      for (const model of DEDALUS_MODEL_FALLBACKS) {
        try {
          console.log(`🤖 Trying model: ${model}`);
          const completion = await this.client.chat.completions.create({
            model: model,
            messages: [
              { role: 'system', content: 'You are a creative storyteller. Always respond with valid JSON only.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 256
          });

          const text = completion.choices[0]?.message?.content;
          if (!text) continue;

          parsed = this.safeParseJSON(text);
          if (parsed && parsed.story && Array.isArray(parsed.choices)) {
            const wordCount = this.countWords(parsed.story);
            if (wordCount > STORY_WORD_LIMIT) {
              parsed.story = this.enforceWordLimit(parsed.story, STORY_WORD_LIMIT);
              console.log(`✅ Generated ${theme} story via ${model} (truncated to ${STORY_WORD_LIMIT} words)`);
            } else {
              console.log(`✅ Generated ${theme} story via ${model} (${wordCount} words)`);
            }
            break;
          }
        } catch (err) {
          console.log(`⚠️  Model ${model} failed: ${err.message}`);
          continue;
        }
      }

      if (!parsed || !parsed.story || !Array.isArray(parsed.choices)) {
        console.log(`⚠️  All models failed or returned invalid format for ${theme}, using fallback`);
        return this.getFallbackRound(roundIndex, theme);
      }

      const cleanedChoices = parsed.choices
        .filter(c => typeof c === 'string')
        .slice(0, 3);

      if (cleanedChoices.length !== 3) {
        console.log(`⚠️  Invalid choices count for ${theme}, using fallback`);
        return this.getFallbackRound(roundIndex, theme);
      }

      let finalStory = String(parsed.story);
      if (previousStory && previousChoice) {
        finalStory = this.ensureChoiceLeadIn(finalStory, previousChoice);
      }

      finalStory = this.enforceWordLimit(finalStory, STORY_WORD_LIMIT);

      return {
        story: finalStory,
        choices: cleanedChoices
      };
    } catch (err) {
      console.error(`❌ Dedalus API error for ${theme}:`, err.message || err);
      console.log(`↩️  Falling back to offline ${theme} story`);
      return this.getFallbackRound(roundIndex, theme);
    }
  }
}

module.exports = new StoryEngine();
