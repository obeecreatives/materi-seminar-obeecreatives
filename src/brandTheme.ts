import { useEffect } from 'react';
import { BrandThemeConfig } from './types';

export const DEFAULT_BRAND_THEME: BrandThemeConfig = {
  presetId: 'partnerup_default',
  name: 'PartnerUp | Obeecreatives (Default)',
  primaryColor: '#1F3A5F',
  accentColor: '#F28C28',
  secondaryColor: '#2A9D8F',
  bgColor: '#FFF7EC',
};

export interface BrandThemePreset extends BrandThemeConfig {
  description: string;
  organizationType: string;
}

export const BRAND_THEME_PRESETS: BrandThemePreset[] = [
  {
    presetId: 'partnerup_default',
    name: 'PartnerUp | Obeecreatives (Default)',
    organizationType: 'Standar Resmi PartnerUp',
    description: 'Kombinasi Navy Klasik, Oranye Hangat, Teal Segar, dan Latar Krem ramah mata.',
    primaryColor: '#1F3A5F',
    accentColor: '#F28C28',
    secondaryColor: '#2A9D8F',
    bgColor: '#FFF7EC',
  },
  {
    presetId: 'bumn_corporate',
    name: 'Korporasi, BUMN & Perbankan',
    organizationType: 'BUMN / Bank / CSR Korporat',
    description: 'Biru Royal profesional dipadukan dengan aksen Emas Amber dan latar bersih.',
    primaryColor: '#0F2C59',
    accentColor: '#D97706',
    secondaryColor: '#0284C7',
    bgColor: '#F8FAFC',
  },
  {
    presetId: 'koperasi_syariah',
    name: 'Koperasi, Syariah & UMKM Hijau',
    organizationType: 'Dinas Koperasi / Komunitas Syariah',
    description: 'Hijau Zamrud teduh dengan sorotan Emas Madu dan latar Mint yang menenangkan.',
    primaryColor: '#14532D',
    accentColor: '#D97706',
    secondaryColor: '#0D9488',
    bgColor: '#F4FBF7',
  },
  {
    presetId: 'pemda_kampus',
    name: 'Instansi Pemerintah & Kampus',
    organizationType: 'Pemda / Kementerian / Universitas',
    description: 'Indigo formal berwibawa dengan aksen Merah Marun tegas dan Biru Akademik.',
    primaryColor: '#312E81',
    accentColor: '#E11D48',
    secondaryColor: '#2563EB',
    bgColor: '#F8FAFC',
  },
  {
    presetId: 'kuliner_nusantara',
    name: 'Komunitas Kuliner & Kriya Nusantara',
    organizationType: 'Asosiasi F&B / Kerajinan Daerah',
    description: 'Cokelat Kopi Nusantara dengan aksen Oranye Terakota dan Hijau Daun.',
    primaryColor: '#431407',
    accentColor: '#EA580C',
    secondaryColor: '#15803D',
    bgColor: '#FFFBEB',
  },
  {
    presetId: 'women_preneur',
    name: 'Komunitas Perempuan, Fashion & Beauty',
    organizationType: 'IWAPI / Komunitas Pengusaha Perempuan',
    description: 'Ungu Plum elegan dengan aksen Pink Magenta modern dan latar Blush lembut.',
    primaryColor: '#4A1D4A',
    accentColor: '#DB2777',
    secondaryColor: '#0D9488',
    bgColor: '#FDF2F8',
  },
];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function normalizeHexColor(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  const trimmed = input.trim();
  if (HEX_REGEX.test(trimmed)) return trimmed.toUpperCase();
  return fallback;
}

export function darkenHex(hex: string, factor = 0.16): string {
  const clean = normalizeHexColor(hex, '#1F3A5F').slice(1);
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const nr = Math.max(0, Math.round(r * (1 - factor)));
  const ng = Math.max(0, Math.round(g * (1 - factor)));
  const nb = Math.max(0, Math.round(b * (1 - factor)));

  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb
    .toString(16)
    .padStart(2, '0')}`.toUpperCase();
}

export function sanitizeBrandTheme(theme?: Partial<BrandThemeConfig> | null): BrandThemeConfig {
  if (!theme) return DEFAULT_BRAND_THEME;
  return {
    presetId: theme.presetId || 'custom',
    name: theme.name || 'Tema Kustom Organisasi',
    primaryColor: normalizeHexColor(theme.primaryColor, DEFAULT_BRAND_THEME.primaryColor),
    accentColor: normalizeHexColor(theme.accentColor, DEFAULT_BRAND_THEME.accentColor),
    secondaryColor: normalizeHexColor(theme.secondaryColor, DEFAULT_BRAND_THEME.secondaryColor),
    bgColor: normalizeHexColor(theme.bgColor, DEFAULT_BRAND_THEME.bgColor),
  };
}

const OPACITY_STEPS = [
  5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
];

function buildRulesForHex(sourceHex: string, cssVarName: string): string {
  // Handle both uppercase and original case hex selectors in Tailwind v4
  const variants = Array.from(new Set([sourceHex, sourceHex.toUpperCase(), sourceHex.toLowerCase()]));
  const lines: string[] = [];

  for (const hex of variants) {
    const escapedHex = `\\${hex}`; // e.g. \#1F3A5F
    const val = `var(${cssVarName})`;

    lines.push(`.bg-\\[${escapedHex}\\] { background-color: ${val} !important; }`);
    lines.push(`.text-\\[${escapedHex}\\] { color: ${val} !important; }`);
    lines.push(`.border-\\[${escapedHex}\\] { border-color: ${val} !important; }`);
    lines.push(`.ring-\\[${escapedHex}\\] { --tw-ring-color: ${val} !important; }`);
    lines.push(`.from-\\[${escapedHex}\\] { --tw-gradient-from: ${val} !important; }`);
    lines.push(`.via-\\[${escapedHex}\\] { --tw-gradient-via: ${val} !important; }`);
    lines.push(`.to-\\[${escapedHex}\\] { --tw-gradient-to: ${val} !important; }`);

    lines.push(`.hover\\:bg-\\[${escapedHex}\\]:hover { background-color: ${val} !important; }`);
    lines.push(`.hover\\:text-\\[${escapedHex}\\]:hover { color: ${val} !important; }`);
    lines.push(`.hover\\:border-\\[${escapedHex}\\]:hover { border-color: ${val} !important; }`);
    lines.push(`.focus\\:border-\\[${escapedHex}\\]:focus { border-color: ${val} !important; }`);
    lines.push(`.focus\\:ring-\\[${escapedHex}\\]:focus { --tw-ring-color: ${val} !important; }`);

    for (const op of OPACITY_STEPS) {
      const mix = `color-mix(in srgb, ${val} ${op}%, transparent)`;
      lines.push(`.bg-\\[${escapedHex}\\]\\/${op} { background-color: ${mix} !important; }`);
      lines.push(`.text-\\[${escapedHex}\\]\\/${op} { color: ${mix} !important; }`);
      lines.push(`.border-\\[${escapedHex}\\]\\/${op} { border-color: ${mix} !important; }`);
      lines.push(`.ring-\\[${escapedHex}\\]\\/${op} { --tw-ring-color: ${mix} !important; }`);
      lines.push(`.shadow-\\[${escapedHex}\\]\\/${op} { --tw-shadow-color: ${mix} !important; }`);
      lines.push(`.from-\\[${escapedHex}\\]\\/${op} { --tw-gradient-from: ${mix} !important; }`);
      lines.push(`.via-\\[${escapedHex}\\]\\/${op} { --tw-gradient-via: ${mix} !important; }`);
      lines.push(`.to-\\[${escapedHex}\\]\\/${op} { --tw-gradient-to: ${mix} !important; }`);
      lines.push(
        `.hover\\:bg-\\[${escapedHex}\\]\\/${op}:hover { background-color: ${mix} !important; }`
      );
      lines.push(
        `.hover\\:text-\\[${escapedHex}\\]\\/${op}:hover { color: ${mix} !important; }`
      );
      lines.push(
        `.hover\\:border-\\[${escapedHex}\\]\\/${op}:hover { border-color: ${mix} !important; }`
      );
      lines.push(
        `.focus\\:ring-\\[${escapedHex}\\]\\/${op}:focus { --tw-ring-color: ${mix} !important; }`
      );
    }
  }

  return lines.join('\n');
}

export function generateBrandThemeStylesheet(rawTheme?: Partial<BrandThemeConfig> | null): string {
  const theme = sanitizeBrandTheme(rawTheme);
  const primaryDark = darkenHex(theme.primaryColor, 0.18);
  const primaryDarker = darkenHex(theme.primaryColor, 0.35);
  const accentDark = darkenHex(theme.accentColor, 0.14);
  const secondaryDark = darkenHex(theme.secondaryColor, 0.15);

  return `
:root {
  --brand-primary: ${theme.primaryColor};
  --brand-primary-dark: ${primaryDark};
  --brand-primary-darker: ${primaryDarker};
  --brand-accent: ${theme.accentColor};
  --brand-accent-dark: ${accentDark};
  --brand-secondary: ${theme.secondaryColor};
  --brand-secondary-dark: ${secondaryDark};
  --brand-bg: ${theme.bgColor};
}

html, body {
  background-color: var(--brand-bg) !important;
  color: var(--brand-primary) !important;
}

${buildRulesForHex('#1F3A5F', '--brand-primary')}
${buildRulesForHex('#162B47', '--brand-primary-dark')}
${buildRulesForHex('#162a45', '--brand-primary-dark')}
${buildRulesForHex('#172c49', '--brand-primary-dark')}
${buildRulesForHex('#0f1d30', '--brand-primary-darker')}
${buildRulesForHex('#0F1E33', '--brand-primary-darker')}
${buildRulesForHex('#F28C28', '--brand-accent')}
${buildRulesForHex('#d97719', '--brand-accent-dark')}
${buildRulesForHex('#2A9D8F', '--brand-secondary')}
${buildRulesForHex('#218276', '--brand-secondary-dark')}
${buildRulesForHex('#FFF7EC', '--brand-bg')}
`;
}

export function useApplyBrandTheme(theme?: Partial<BrandThemeConfig> | null) {
  useEffect(() => {
    const styleId = 'partnerup-dynamic-brand-theme';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = generateBrandThemeStylesheet(theme);
  }, [
    theme?.presetId,
    theme?.name,
    theme?.primaryColor,
    theme?.accentColor,
    theme?.secondaryColor,
    theme?.bgColor,
  ]);
}
