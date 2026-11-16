import { ThemeConfig, ThemeCornerRadius, ThemeBorderWidth, ThemeShadowIntensity } from '../types';

export interface ThemePreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  vibe: string;
  config: ThemeConfig;
  recommendedBrandColor?: string;
  previewTag: string;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  cornerRadius: 'rounded',
  borderWidth: 'thin',
  shadowIntensity: 'medium',
  presetId: 'coastal_organic',
  customRadiusPx: 16,
  customBorderPx: 1,
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'coastal_organic',
    name: 'Coastal Organic',
    subtitle: 'WaveHaven Standard',
    description: 'Welcoming rounded corners, clean 1px borders, and soft balanced ambient sunlight shadows.',
    vibe: 'Friendly, warm, and contemporary surf hospitality',
    recommendedBrandColor: '#0d9488',
    previewTag: 'Default',
    config: {
      cornerRadius: 'rounded',
      borderWidth: 'thin',
      shadowIntensity: 'medium',
      presetId: 'coastal_organic',
      customRadiusPx: 16,
      customBorderPx: 1,
    },
  },
  {
    id: 'modern_minimal',
    name: 'Architectural Minimal',
    subtitle: 'Scandinavian Surf House',
    description: 'Subtle 8px radii with razor-thin borders and airy, whisper-soft shadows.',
    vibe: 'Refined, precise, and understated designer lodge',
    recommendedBrandColor: '#0284c7',
    previewTag: 'Sleek',
    config: {
      cornerRadius: 'subtle',
      borderWidth: 'thin',
      shadowIntensity: 'subtle',
      presetId: 'modern_minimal',
      customRadiusPx: 8,
      customBorderPx: 1,
    },
  },
  {
    id: 'neo_brutalist',
    name: 'Neo-Brutalist Shaper',
    subtitle: 'Raw Surf Camp & Zine',
    description: 'Crisp zero-radius sharp angles, bold 3px structural borders, and punchy flat depth.',
    vibe: 'Bold retro boardshop, high-contrast, edgy board-shaping workshop',
    recommendedBrandColor: '#334155',
    previewTag: 'High Impact',
    config: {
      cornerRadius: 'sharp',
      borderWidth: 'bold',
      shadowIntensity: 'none',
      presetId: 'neo_brutalist',
      customRadiusPx: 0,
      customBorderPx: 3,
    },
  },
  {
    id: 'bohemian_beach',
    name: 'Bohemian Beach Club',
    subtitle: 'Tropical Ocean Lounge',
    description: 'Generous 24px flowing curves, medium 2px framing, and rich sun-drenched elevated shadows.',
    vibe: 'Relaxed, luxurious palm-shaded surf retreat',
    recommendedBrandColor: '#059669',
    previewTag: 'Organic',
    config: {
      cornerRadius: 'playful',
      borderWidth: 'medium',
      shadowIntensity: 'elevated',
      presetId: 'bohemian_beach',
      customRadiusPx: 24,
      customBorderPx: 2,
    },
  },
  {
    id: 'floating_pod',
    name: 'Floating Wave Pod',
    subtitle: 'Ultra-Soft Borderless',
    description: 'Maximum pill curves (32px), zero borders, with floating high-elevation cloud shadows.',
    vibe: 'Futuristic ocean pod, seamless modular card aesthetic',
    recommendedBrandColor: '#4f46e5',
    previewTag: 'Pill Soft',
    config: {
      cornerRadius: 'pill',
      borderWidth: 'none',
      shadowIntensity: 'elevated',
      presetId: 'floating_pod',
      customRadiusPx: 32,
      customBorderPx: 0,
    },
  },
];

/**
 * Calculates exact CSS variable values for corner radii based on setting or custom pixel value
 */
export function getRadiusValues(cornerRadius: ThemeCornerRadius, customPx?: number) {
  if (customPx !== undefined && customPx >= 0) {
    const base = customPx;
    return {
      radius3xl: `${Math.round(base * 1.5)}px`,
      radius2xl: `${Math.round(base)}px`,
      radiusXl: `${Math.max(0, Math.round(base * 0.75))}px`,
      radiusLg: `${Math.max(0, Math.round(base * 0.5))}px`,
      radiusMd: `${Math.max(0, Math.round(base * 0.38))}px`,
      radiusSm: `${Math.max(0, Math.round(base * 0.25))}px`,
    };
  }

  switch (cornerRadius) {
    case 'sharp':
      return {
        radius3xl: '0px',
        radius2xl: '0px',
        radiusXl: '0px',
        radiusLg: '0px',
        radiusMd: '0px',
        radiusSm: '0px',
      };
    case 'subtle':
      return {
        radius3xl: '12px',
        radius2xl: '10px',
        radiusXl: '8px',
        radiusLg: '6px',
        radiusMd: '4px',
        radiusSm: '3px',
      };
    case 'rounded':
    default:
      return {
        radius3xl: '24px',
        radius2xl: '16px',
        radiusXl: '12px',
        radiusLg: '8px',
        radiusMd: '6px',
        radiusSm: '4px',
      };
    case 'playful':
      return {
        radius3xl: '32px',
        radius2xl: '24px',
        radiusXl: '18px',
        radiusLg: '14px',
        radiusMd: '10px',
        radiusSm: '6px',
      };
    case 'pill':
      return {
        radius3xl: '44px',
        radius2xl: '32px',
        radiusXl: '24px',
        radiusLg: '18px',
        radiusMd: '14px',
        radiusSm: '8px',
      };
  }
}

/**
 * Calculates exact CSS border width values
 */
export function getBorderValues(borderWidth: ThemeBorderWidth, customPx?: number) {
  if (customPx !== undefined && customPx >= 0) {
    return {
      borderWidth: `${customPx}px`,
      borderWidth2: `${customPx * 2}px`,
    };
  }

  switch (borderWidth) {
    case 'none':
      return { borderWidth: '0px', borderWidth2: '0px' };
    case 'thin':
    default:
      return { borderWidth: '1px', borderWidth2: '2px' };
    case 'medium':
      return { borderWidth: '2px', borderWidth2: '4px' };
    case 'bold':
      return { borderWidth: '3px', borderWidth2: '6px' };
  }
}

/**
 * Calculates exact CSS shadow values
 */
export function getShadowValues(shadowIntensity: ThemeShadowIntensity) {
  switch (shadowIntensity) {
    case 'none':
      return {
        shadow2xs: 'none',
        shadowXs: 'none',
        shadowSm: 'none',
        shadowMd: 'none',
        shadowLg: 'none',
        shadowXl: 'none',
      };
    case 'subtle':
      return {
        shadow2xs: '0 1px 2px 0 rgb(15 23 42 / 0.03)',
        shadowXs: '0 1px 3px 0 rgb(15 23 42 / 0.04)',
        shadowSm: '0 2px 4px -1px rgb(15 23 42 / 0.05)',
        shadowMd: '0 4px 8px -2px rgb(15 23 42 / 0.06)',
        shadowLg: '0 8px 16px -4px rgb(15 23 42 / 0.07)',
        shadowXl: '0 16px 24px -6px rgb(15 23 42 / 0.08)',
      };
    case 'medium':
    default:
      return {
        shadow2xs: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        shadowXs: '0 1px 3px 0 rgb(15 23 42 / 0.07), 0 1px 2px -1px rgb(15 23 42 / 0.07)',
        shadowSm: '0 2px 5px -1px rgb(15 23 42 / 0.08), 0 1px 3px -1px rgb(15 23 42 / 0.08)',
        shadowMd: '0 6px 12px -2px rgb(15 23 42 / 0.1), 0 3px 6px -3px rgb(15 23 42 / 0.08)',
        shadowLg: '0 12px 20px -4px rgb(15 23 42 / 0.12), 0 4px 8px -4px rgb(15 23 42 / 0.08)',
        shadowXl: '0 24px 36px -8px rgb(15 23 42 / 0.14), 0 8px 16px -6px rgb(15 23 42 / 0.1)',
      };
    case 'elevated':
      return {
        shadow2xs: '0 1px 3px 0 rgb(15 23 42 / 0.08)',
        shadowXs: '0 2px 6px 0 rgb(15 23 42 / 0.1)',
        shadowSm: '0 4px 10px -1px rgb(15 23 42 / 0.12), 0 2px 4px -2px rgb(15 23 42 / 0.1)',
        shadowMd: '0 10px 18px -3px rgb(15 23 42 / 0.14), 0 4px 8px -4px rgb(15 23 42 / 0.1)',
        shadowLg: '0 18px 28px -5px rgb(15 23 42 / 0.16), 0 8px 12px -6px rgb(15 23 42 / 0.12)',
        shadowXl: '0 32px 48px -10px rgb(15 23 42 / 0.2), 0 12px 20px -8px rgb(15 23 42 / 0.15)',
      };
    case 'dramatic':
      return {
        shadow2xs: '0 2px 4px 0 rgb(0 0 0 / 0.15)',
        shadowXs: '0 3px 8px 0 rgb(0 0 0 / 0.18)',
        shadowSm: '0 6px 14px -2px rgb(0 0 0 / 0.22)',
        shadowMd: '0 14px 24px -4px rgb(0 0 0 / 0.25)',
        shadowLg: '0 24px 38px -6px rgb(0 0 0 / 0.28)',
        shadowXl: '0 40px 60px -12px rgb(0 0 0 / 0.35)',
      };
  }
}

/**
 * Injects and updates global CSS custom properties and data attributes on :root
 * This affects every single component, card, button, modal and input across the entire app.
 */
export function applyThemeStyles(themeConfig?: ThemeConfig, brandPrimary?: string) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const config = themeConfig || DEFAULT_THEME_CONFIG;

  // Primary brand color
  if (brandPrimary) {
    root.style.setProperty('--brand-primary', brandPrimary);
  }

  // Radii
  const radii = getRadiusValues(config.cornerRadius, config.customRadiusPx);
  root.style.setProperty('--theme-radius-3xl', radii.radius3xl);
  root.style.setProperty('--theme-radius-2xl', radii.radius2xl);
  root.style.setProperty('--theme-radius-xl', radii.radiusXl);
  root.style.setProperty('--theme-radius-lg', radii.radiusLg);
  root.style.setProperty('--theme-radius-md', radii.radiusMd);
  root.style.setProperty('--theme-radius-sm', radii.radiusSm);
  root.setAttribute('data-theme-radius', config.cornerRadius);

  // Border widths
  const borders = getBorderValues(config.borderWidth, config.customBorderPx);
  root.style.setProperty('--theme-border-width', borders.borderWidth);
  root.style.setProperty('--theme-border-width-2', borders.borderWidth2);
  root.setAttribute('data-theme-border', config.borderWidth);

  // Shadows
  const shadows = getShadowValues(config.shadowIntensity);
  root.style.setProperty('--theme-shadow-2xs', shadows.shadow2xs);
  root.style.setProperty('--theme-shadow-xs', shadows.shadowXs);
  root.style.setProperty('--theme-shadow-sm', shadows.shadowSm);
  root.style.setProperty('--theme-shadow-md', shadows.shadowMd);
  root.style.setProperty('--theme-shadow-lg', shadows.shadowLg);
  root.style.setProperty('--theme-shadow-xl', shadows.shadowXl);
  root.setAttribute('data-theme-shadow', config.shadowIntensity);
}
