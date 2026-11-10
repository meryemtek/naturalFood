// Clean, understated, and organic-inspired enterprise design tokens
// Farm-to-table artisanal elegance for Natural Food operations

export const theme = {
  colors: {
    // Backgrounds: Clean warm white and soft ecru/linen tint
    bgCanvas: '#F7F6F2',        // Soft ecru / linen tint for page body
    bgSurface: '#FAF9F6',       // Warm white for sidebar, headers, and panels
    bgCard: '#FFFFFF',          // Clean pure white for elevated content cards & tables
    bgHover: '#EFECE6',         // Muted warm linen hover
    bgActiveSubmenu: '#EBF2EA', // Soft pale sage tint for active submenu & chip backgrounds

    // Primary Accent: Deep sage / forest green
    primary: '#2D5A27',         // Forest green (#2D5A27) for buttons, active states
    primaryHover: '#23471E',    // Darker forest green
    primarySubtle: '#EBF2EA',   // Soft sage tint for chips and badges

    // Secondary / Neutral Accent: Warm earthy taupe, muted cedar, warm espresso
    espresso: '#2D241E',        // Deep warm espresso for main titles & high-contrast text
    cedar: '#4A3B32',           // Muted cedar for text hierarchy & chip borders
    taupe: '#6B5E55',           // Warm earthy taupe for secondary text, category labels
    stoneMuted: '#8C827A',      // Soft stone for hints, timestamps

    // Borders & Dividers: Crisp, very faint stone/warm-gray 1px borders
    border: '#E7E5E0',          // Crisp, faint stone/warm-gray 1px border (#E7E5E0)
    borderSubtle: '#EFECE6',    // Soft divider line
    borderSelected: '#4A3B32',  // Selected chip border

    // Botanical / Organic Status Tones (No neon colors)
    statusSuccess: '#355E3B',   // Deep botanical sage
    statusSuccessBg: '#EDF5EE',
    statusWarning: '#B87333',   // Warm amber / terracotta copper
    statusWarningBg: '#FDF7F0',
    statusDanger: '#9B3828',    // Muted terracotta red
    statusDangerBg: '#FDF2F0',
    statusInfo: '#3B5A6F',      // Muted lake / slate blue
    statusInfoBg: '#F0F5F8',

    // Pure white for text on primary elements
    textInverse: '#FFFFFF',
  },
  radii: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '10px',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    subtle: '0 1px 2px rgba(45, 36, 30, 0.03)',
  },
};
