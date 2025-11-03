/**
 * AI Service Wrapper
 * Supports multiple AI providers: OpenAI (paid) and Ollama (free, self-hosted)
 * 
 * Usage:
 *   const aiService = require('./utils/aiService');
 *   const response = await aiService.generate('Your prompt here');
 */

require('dotenv').config();

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.monthlyUsage = 0;
    this.usageLimit = parseInt(process.env.AI_USAGE_LIMIT_MONTHLY || '100000', 10);
  }

  /**
   * Generate text response from AI
   * @param {string} prompt - The prompt to send to AI
   * @param {object} options - Additional options (model, temperature, etc.)
   * @returns {Promise<string>} AI generated text
   */
  async generate(prompt, options = {}) {
    // Check usage limit
    if (this.monthlyUsage > this.usageLimit) {
      throw new Error('Monthly AI usage limit reached. Please upgrade or wait for reset.');
    }

    try {
      if (this.provider === 'ollama') {
        return await this.ollamaGenerate(prompt, options);
      } else {
        return await this.openaiGenerate(prompt, options);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  /**
   * Generate JSON response from AI
   * @param {string} prompt - The prompt to send to AI
   * @param {object} options - Additional options
   * @returns {Promise<object>} Parsed JSON object
   */
  async generateJSON(prompt, options = {}) {
    let response;

    if (this.provider === 'ollama') {
      const text = await this.ollamaGenerate(
        prompt + '\n\nRespond in valid JSON format only. No markdown, no code blocks.',
        options
      );
      // Extract JSON from response (handle markdown code blocks if present)
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return {};
      } catch (e) {
        console.error('Failed to parse JSON from Ollama:', e);
        return {};
      }
    } else {
      // OpenAI with JSON mode
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      response = await openai.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: options.temperature || 0.7,
        ...options
      });

      this.monthlyUsage += response.usage?.total_tokens || 0;
      return JSON.parse(response.choices[0].message.content);
    }
  }

  /**
   * Generate response using Ollama (free, self-hosted)
   * @private
   */
  async ollamaGenerate(prompt, options = {}) {
    // Use node-fetch for older Node versions, or global fetch for Node 18+
    let fetch;
    try {
      // Try to use node-fetch first (for Node < 18)
      fetch = require('node-fetch');
    } catch (e) {
      // Fallback to global fetch (Node 18+)
      fetch = global.fetch;
      if (!fetch) {
        throw new Error('No fetch implementation available. Install node-fetch or use Node 18+');
      }
    }

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const model = options.model || 'llama3';

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Generate response using OpenAI
   * @private
   */
  async openaiGenerate(prompt, options = {}) {
    const OpenAI = require('openai');

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      ...options
    });

    // Track usage
    this.monthlyUsage += response.usage?.total_tokens || 0;

    return response.choices[0].message.content;
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    return {
      monthlyUsage: this.monthlyUsage,
      usageLimit: this.usageLimit,
      remaining: this.usageLimit - this.monthlyUsage,
      provider: this.provider
    };
  }

  /**
   * Reset monthly usage (call at start of each month)
   */
  resetUsage() {
    this.monthlyUsage = 0;
  }
}

// Export singleton instance
module.exports = new AIService();

