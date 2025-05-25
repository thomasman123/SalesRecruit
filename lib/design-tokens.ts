// Design System Tokens
export const designTokens = {
  colors: {
    // Core colors
    dark: {
      900: "#0A0A0A",
      800: "#121212",
      700: "#1A1A1A",
      600: "#1F1F1F",
      500: "#2A2A2A",
    },
    purple: {
      500: "#8B5CF6",
      400: "#A78BFA",
      600: "#7C3AED",
      300: "#C4B5FD",
    },
    // Status colors
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },

  animations: {
    // Duration
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
    slower: "1000ms",

    // Easing
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  shadows: {
    glow: {
      purple: "0 0 20px rgba(139, 92, 246, 0.3)",
      blue: "0 0 20px rgba(59, 130, 246, 0.3)",
      green: "0 0 20px rgba(34, 197, 94, 0.3)",
    },
    card: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },

  spacing: {
    section: "6rem", // py-24
    container: "2rem", // px-8
  },
} as const

// Animation presets
export const animationPresets = {
  fadeInUp: "animate-fade-in-up",
  bounce: "animate-bounce",
  pulse: "animate-pulse",
  scale: "hover:scale-105 transition-transform duration-300",
  glow: "hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300",
} as const

// Component variants
export const componentVariants = {
  card: {
    default: "border-dark-600 bg-dark-800/50 backdrop-blur-sm",
    interactive:
      "border-dark-600 bg-dark-800/50 backdrop-blur-sm hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-500 cursor-pointer",
    glow: "border-dark-600 bg-dark-800/50 backdrop-blur-sm shadow-2xl shadow-black/20 hover:shadow-purple-500/10 transition-all duration-500",
  },

  button: {
    primary:
      "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105",
    ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-dark-700 transition-all duration-300",
    outline:
      "border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white transition-all duration-300",
  },

  input: {
    default:
      "border-dark-600 bg-dark-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 hover:border-purple-500/50",
  },
} as const
