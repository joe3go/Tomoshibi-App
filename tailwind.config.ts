import type { Config } from "tailwindcss";

// Theme constants
const themeVariables = {
  colors: {
    background: '35 25% 92%',        // Warm creamy background
    foreground: '25 15% 25%',        // Dark brown text
    card: '35 35% 96%',              // Slightly warmer cream for cards
    popover: '35 35% 96%',
    primary: '350 65% 45%',          // Deep red like in reference
    secondary: '15 25% 85%',         // Soft pink-beige
    muted: '25 15% 88%',
    accent: '15 25% 85%',
    destructive: '0 75% 55%',
    border: '25 15% 75%',
    input: '35 25% 90%',
    ring: '350 65% 45%',
    gold: '47 85% 60%',              // Warmer gold
    red: '350 65% 45%',
    pink: '345 45% 75%',             // Cherry blossom pink
    chart: {
      1: '350 65% 45%',
      2: '47 85% 60%',
      3: '15 45% 65%',
      4: '25 35% 55%',
      5: '345 45% 75%'
    },
    sidebar: {
      background: '25 20% 88%',
      foreground: '25 15% 25%',
      primary: '350 65% 45%',
      accent: '15 25% 82%',
      border: '25 15% 70%'
    }
  },
  radius: '0.5rem',
  images: {
    lantern: "url('../images/lantern.png')",
    sakura: "url('../images/sakura.png')",
    waves: "url('../images/japanese-waves.png')"
  }
} as const;

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
        full: '9999px'
      },
      colors: {
        // Main colors
        background: `hsl(${themeVariables.colors.background})`,
        foreground: `hsl(${themeVariables.colors.foreground})`,

        // Gold color definitions (FIXED)
        gold: `hsl(${themeVariables.colors.gold})`,
        accent: {
          DEFAULT: `hsl(${themeVariables.colors.accent})`,
          foreground: `hsl(${themeVariables.colors.foreground})`,
          gold: `hsl(${themeVariables.colors.gold})`,
          red: `hsl(${themeVariables.colors.red})`,
          pink: `hsl(${themeVariables.colors.pink})`,
        },

        // Other color groups
        card: {
          DEFAULT: `hsl(${themeVariables.colors.card})`,
          foreground: `hsl(${themeVariables.colors.foreground})`,
        },
        popover: {
          DEFAULT: `hsl(${themeVariables.colors.popover})`,
          foreground: `hsl(${themeVariables.colors.foreground})`,
        },
        primary: {
          DEFAULT: `hsl(${themeVariables.colors.primary})`,
          foreground: `hsl(${themeVariables.colors.foreground})`,
        },
        secondary: {
          DEFAULT: `hsl(${themeVariables.colors.secondary})`,
          foreground: `hsl(${themeVariables.colors.foreground})`,
        },
        muted: {
          DEFAULT: `hsl(${themeVariables.colors.muted})`,
          foreground: `hsl(${themeVariables.colors.muted})`,
        },
        destructive: {
          DEFAULT: `hsl(${themeVariables.colors.destructive})`,
          foreground: `hsl(${themeVariables.colors.foreground})`,
        },
        border: `hsl(${themeVariables.colors.border})`,
        input: `hsl(${themeVariables.colors.input})`,
        ring: `hsl(${themeVariables.colors.ring})`,
        chart: {
          1: `hsl(${themeVariables.colors.chart[1]})`,
          2: `hsl(${themeVariables.colors.chart[2]})`,
          3: `hsl(${themeVariables.colors.chart[3]})`,
          4: `hsl(${themeVariables.colors.chart[4]})`,
          5: `hsl(${themeVariables.colors.chart[5]})`,
        },
        sidebar: {
          DEFAULT: `hsl(${themeVariables.colors.sidebar.background})`,
          foreground: `hsl(${themeVariables.colors.sidebar.foreground})`,
          primary: `hsl(${themeVariables.colors.sidebar.primary})`,
          "primary-foreground": `hsl(${themeVariables.colors.sidebar.foreground})`,
          accent: `hsl(${themeVariables.colors.sidebar.accent})`,
          "accent-foreground": `hsl(${themeVariables.colors.sidebar.foreground})`,
          border: `hsl(${themeVariables.colors.sidebar.border})`,
          ring: `hsl(${themeVariables.colors.primary})`,
        },
      },
      boxShadow: {
        'gold-sm': '0 0 0 1px rgba(250, 204, 21, 0.1)',
        'gold-md': '0 0 0 2px rgba(250, 204, 21, 0.2)',
        'gold-lg': '0 0 0 3px rgba(250, 204, 21, 0.3)',
        'gold-xl': '0 0 10px 2px rgba(250, 204, 21, 0.25)',
        'inner-gold': 'inset 0 0 5px 1px rgba(250, 204, 21, 0.2)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'gold-pulse': {
          '0%, 100%': { 'box-shadow': '0 0 0 0 rgba(250, 204, 21, 0.4)' },
          '50%': { 'box-shadow': '0 0 0 4px rgba(250, 204, 21, 0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'lantern-glow': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'gold-pulse': 'gold-pulse 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'lantern-glow': 'lantern-glow 2s ease-in-out infinite',
      },
      fontFamily: {
        japanese: ['"Noto Sans JP"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        serif: ['"Noto Serif JP"', 'serif'],
      },
      screens: {
        'short': { 'raw': '(max-height: 600px)' },
        'tall': { 'raw': '(min-height: 800px)' },
        'xs': '480px',
      },
      maxHeight: {
        'dvh': '100dvh',
        'svh': '100svh',
        'lvh': '100lvh',
      },
      backgroundImage: {
        'lantern': themeVariables.images.lantern,
        'sakura': themeVariables.images.sakura,
        'waves': themeVariables.images.waves,
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    function({ addUtilities }) {
      addUtilities({
        '.text-shadow': {
          'text-shadow': '1px 1px 3px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-gold': {
          'text-shadow': '0 0 4px hsl(var(--accent-gold))',
        },
        '.writing-vertical': {
          'writing-mode': 'vertical-rl',
        },
        '.scrollbar-japanese': {
          'scrollbar-width': 'thin',
          'scrollbar-color': `hsl(${themeVariables.colors.gold}) transparent`,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: `hsl(${themeVariables.colors.gold})`,
            borderRadius: '4px',
          },
        },
      });
    },
    function ({ addComponents }) {
      addComponents({
        '.gold-frame': {
          '@apply border border-accent-gold rounded-[var(--radius)] p-4 relative': {},
          'box-shadow': '0 0 0 2px rgba(250, 204, 21, 0.1)',
          'background': `hsl(${themeVariables.colors.card})`,
        },
        '.gold-frame::before': {
          '@apply content-[""] absolute inset-0 pointer-events-none': {},
          'border': '2px solid rgba(250, 204, 21, 0.25)',
          'border-radius': 'var(--radius)',
        },
        '.lantern-decoration': {
          '@apply absolute top-0 left-0 bg-contain w-[100px] h-[200px] z-10': {},
          'background-image': themeVariables.images.lantern,
          'animation': 'lantern-glow 2s ease-in-out infinite',
        },
        '.sakura-decoration': {
          '@apply absolute w-[150px] h-[150px] bg-contain bg-no-repeat z-0 opacity-70': {},
          'background-image': themeVariables.images.sakura,
          'animation': 'float 6s ease-in-out infinite',
        },
        '.wave-pattern': {
          '@apply absolute inset-0 w-full h-full opacity-10': {},
          'background-image': themeVariables.images.waves,
          'background-size': '300px',
        },
        '.btn-japanese': {
          '@apply px-6 py-3 rounded-[var(--radius)] font-japanese font-medium transition-all': {},
          'background': `hsl(${themeVariables.colors.primary})`,
          'color': `hsl(${themeVariables.colors.foreground})`,
          'position': 'relative',
          'overflow': 'hidden',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
          },
          '&:active': {
            'transform': 'translateY(0)',
          },
          '&::after': {
            'content': '""',
            'position': 'absolute',
            'top': '0',
            'left': '-100%',
            'width': '100%',
            'height': '100%',
            'background': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            'transition': 'all 0.5s',
          },
          '&:hover::after': {
            'left': '100%',
          }
        },
      });
    },
  ],
} satisfies Config;