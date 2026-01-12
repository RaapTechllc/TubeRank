/**
 * Editorial Design System
 * "Financial Times meets Swiss Modernism"
 *
 * A sophisticated design system inspired by print journalism, financial publications,
 * and modernist information design. This system provides the visual foundation for
 * TubeRank's analytics interface.
 */

// ============================================================================
// Color Palette
// ============================================================================

export const editorialColors = {
  // Base Colors (Cream/Paper)
  background: '#faf8f5',      // Warm cream white
  foreground: '#1a1614',      // Deep charcoal ink
  card: '#ffffff',            // Pure white cards
  paperTexture: '#f5f1eb',    // Subtle aged paper

  // UI Elements
  border: '#e5dfd7',          // Soft rule lines
  muted: '#f0ebe3',           // Background variations
  mutedForeground: '#6b6661', // Muted text

  // Editorial Accents
  primary: '#c7352f',         // Editorial red (masthead)
  primaryForeground: '#ffffff',

  // Semantic Colors
  success: '#2d6b3c',         // Editorial green
  warning: '#c68135',         // Editorial amber
  error: '#c7352f',           // Alert red
  info: '#2e5090',            // Trust blue

  // Data Visualization Spectrum
  chart: {
    1: '#2e5090',             // Data blue
    2: '#2d6b3c',             // Success green
    3: '#c68135',             // Amber
    4: '#8b5a99',             // Analytical purple
    5: '#c7352f',             // Alert red
  },

  // Additional chart colors for complex visualizations
  chartExtended: {
    6: '#1e4d6b',             // Deep blue
    7: '#5a8f3a',             // Forest green
    8: '#d97f3c',             // Orange
    9: '#6b4b7a',             // Deep purple
    10: '#a32820',            // Dark red
  }
} as const

// ============================================================================
// Typography Scale
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    serif: "'Libre Baskerville', Georgia, serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
  },

  // Font Sizes (following 8px baseline grid)
  fontSize: {
    // Display (for large numbers, headlines)
    display: {
      xl: '4rem',       // 64px
      lg: '3rem',       // 48px
      md: '2.5rem',     // 40px
      sm: '2rem',       // 32px
    },

    // Headings
    heading: {
      h1: '1.875rem',   // 30px
      h2: '1.5rem',     // 24px
      h3: '1.25rem',    // 20px
      h4: '1.125rem',   // 18px
      h5: '1rem',       // 16px
      h6: '0.875rem',   // 14px
    },

    // Body Text
    body: {
      lg: '1.125rem',   // 18px
      md: '1rem',       // 16px
      sm: '0.875rem',   // 14px
      xs: '0.75rem',    // 12px
    },

    // Data/Labels
    data: {
      lg: '0.875rem',   // 14px
      md: '0.75rem',    // 12px
      sm: '0.6875rem',  // 11px
    },

    // Caption
    caption: '0.625rem',  // 10px
  },

  // Font Weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  }
} as const

// ============================================================================
// Spacing System (8px baseline grid)
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.5rem',    // 8px
  2: '1rem',      // 16px
  3: '1.5rem',    // 24px
  4: '2rem',      // 32px
  5: '2.5rem',    // 40px
  6: '3rem',      // 48px
  7: '3.5rem',    // 56px
  8: '4rem',      // 64px
  9: '4.5rem',    // 72px
  10: '5rem',     // 80px
  12: '6rem',     // 96px
  16: '8rem',     // 128px
  20: '10rem',    // 160px
  24: '12rem',    // 192px
} as const

// ============================================================================
// Animation Timings
// ============================================================================

export const animation = {
  // Duration
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Easing Functions (subtle, editorial feel)
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Custom editorial ease (subtle, professional)
    editorial: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },

  // Common Transitions
  transition: {
    default: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  }
} as const

// ============================================================================
// Shadow System (subtle, refined)
// ============================================================================

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const

// ============================================================================
// Border Radius (minimal, editorial)
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '6px',
  full: '9999px',
} as const

// ============================================================================
// Breakpoints (responsive design)
// ============================================================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================================================
// Chart Configuration
// ============================================================================

export const chartConfig = {
  // Default chart colors (ordered for visual distinction)
  colors: [
    editorialColors.chart[1],  // Blue
    editorialColors.chart[2],  // Green
    editorialColors.chart[3],  // Amber
    editorialColors.chart[4],  // Purple
    editorialColors.chart[5],  // Red
  ],

  // Extended palette for complex charts
  colorsExtended: [
    ...Object.values(editorialColors.chart),
    ...Object.values(editorialColors.chartExtended),
  ],

  // Axis styling
  axis: {
    stroke: editorialColors.border,
    strokeWidth: 1,
    fontSize: 11,
    fontFamily: typography.fontFamily.mono,
    color: editorialColors.mutedForeground,
  },

  // Grid styling
  grid: {
    stroke: editorialColors.border,
    strokeDasharray: '3 3',
    strokeWidth: 1,
  },

  // Tooltip styling
  tooltip: {
    backgroundColor: editorialColors.card,
    border: `1px solid ${editorialColors.border}`,
    borderRadius: borderRadius.md,
    boxShadow: shadows.md,
    fontSize: typography.fontSize.body.sm,
    fontFamily: typography.fontFamily.sans,
    padding: spacing[2],
  },

  // Legend styling
  legend: {
    fontSize: typography.fontSize.body.sm,
    fontFamily: typography.fontFamily.sans,
    color: editorialColors.foreground,
  },

  // Chart margins (breathing room)
  margin: {
    top: 20,
    right: 30,
    bottom: 20,
    left: 40,
  },

  // Animation config
  animation: {
    duration: 500,
    easing: 'ease-out',
  },
} as const

// ============================================================================
// Component-Specific Tokens
// ============================================================================

export const components = {
  // Stat Card
  statCard: {
    backgroundColor: editorialColors.card,
    borderColor: editorialColors.border,
    borderWidth: '1px',
    borderRadius: borderRadius.md,
    boxShadow: shadows.sm,
    padding: spacing[4],
    numberFontFamily: typography.fontFamily.serif,
    labelFontFamily: typography.fontFamily.sans,
  },

  // Section Divider (rule line)
  sectionDivider: {
    borderTopWidth: '1px',
    borderTopColor: editorialColors.border,
    marginTop: spacing[6],
    paddingTop: spacing[6],
  },

  // Data Table
  table: {
    headerBackground: editorialColors.muted,
    headerFontFamily: typography.fontFamily.sans,
    headerFontWeight: typography.fontWeight.semibold,
    headerColor: editorialColors.foreground,
    rowBorderColor: editorialColors.border,
    rowHoverBackground: editorialColors.muted,
    cellPadding: spacing[2],
    fontSize: typography.fontSize.body.sm,
  },

  // Filter Bar
  filterBar: {
    backgroundColor: editorialColors.card,
    borderColor: editorialColors.border,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    gap: spacing[2],
  },
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get CSS variable string for use in styled components
 */
export function cssVar(value: string): string {
  return `var(--editorial-${value})`
}

/**
 * Generate CSS variables object for injection into DOM
 */
export function generateCSSVariables() {
  return {
    // Colors
    '--editorial-background': editorialColors.background,
    '--editorial-foreground': editorialColors.foreground,
    '--editorial-card': editorialColors.card,
    '--editorial-border': editorialColors.border,
    '--editorial-muted': editorialColors.muted,
    '--editorial-muted-foreground': editorialColors.mutedForeground,
    '--editorial-primary': editorialColors.primary,
    '--editorial-primary-foreground': editorialColors.primaryForeground,

    // Chart colors
    '--editorial-chart-1': editorialColors.chart[1],
    '--editorial-chart-2': editorialColors.chart[2],
    '--editorial-chart-3': editorialColors.chart[3],
    '--editorial-chart-4': editorialColors.chart[4],
    '--editorial-chart-5': editorialColors.chart[5],

    // Typography
    '--editorial-font-serif': typography.fontFamily.serif,
    '--editorial-font-sans': typography.fontFamily.sans,
    '--editorial-font-mono': typography.fontFamily.mono,
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type EditorialColor = keyof typeof editorialColors
export type ChartColor = keyof typeof editorialColors.chart
export type Spacing = keyof typeof spacing
export type FontSize = keyof typeof typography.fontSize
export type Shadow = keyof typeof shadows
