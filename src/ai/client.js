// Claude AI client wrapper

import Anthropic from '@anthropic-ai/sdk';
import env from '../config/env.js';
import aiConfig from '../config/ai.js';

class AIClient {
  constructor() {
    this.client = new Anthropic({
      apiKey: env.anthropicApiKey
    });
  }

  /**
   * Send a message to Claude and get a response
   * @param {Object} options
   * @param {string} options.system - System prompt
   * @param {string} options.prompt - User prompt
   * @param {number} options.temperature - Temperature (0-1)
   * @param {number} options.maxTokens - Max tokens in response
   * @returns {Promise<string>} Response text
   */
  async chat({ system, prompt, temperature = 0.3, maxTokens = aiConfig.maxTokens }) {
    const response = await this.client.messages.create({
      model: aiConfig.model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  }

  /**
   * Send a message and parse JSON response
   * @param {Object} options - Same as chat()
   * @returns {Promise<Object>} Parsed JSON response
   */
  async chatJSON(options) {
    const systemWithJSON = `${options.system}\n\nYou MUST respond with valid JSON only. No additional text or markdown formatting.`;

    const response = await this.chat({
      ...options,
      system: systemWithJSON
    });

    // Try to extract JSON from response
    try {
      // Handle case where response might be wrapped in markdown code blocks
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', response);
      throw new Error('AI returned invalid JSON');
    }
  }
}

// Export singleton instance
export const aiClient = new AIClient();
export default aiClient;
