import { BookingFormConfig } from '../types';
import { generateSmartTemplateFromPrompt } from '../data/defaultBookingFormConfig';

export interface GenerateFormResult {
  success: boolean;
  config: BookingFormConfig;
  source: 'gemini' | 'smart_engine' | 'offline_fallback';
  message: string;
}

export async function requestAIBookingForm(prompt: string): Promise<GenerateFormResult> {
  if (!prompt || !prompt.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  try {
    const res = await fetch('/api/ai/generate-booking-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.config) {
      return {
        success: true,
        config: data.config,
        source: data.source?.includes('gemini') ? 'gemini' : 'smart_engine',
        message: data.message || 'Form configuration successfully generated with AI',
      };
    }
  } catch (err: any) {
    console.warn('Backend AI route failed or offline, falling back to client-side smart generator:', err?.message);
  }

  // Graceful client-side fallback
  const smartConfig = generateSmartTemplateFromPrompt(prompt);
  return {
    success: true,
    config: smartConfig,
    source: 'offline_fallback',
    message: 'Generated custom multi-step form tailored to your prompt.',
  };
}
