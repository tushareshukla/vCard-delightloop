import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        screens: {
            "3xl": "1700px",
            "4xl": "1920px",
          },
      colors: {
        primary: {
          DEFAULT: '#6941C6',
          light: '#7F56D9',
          dark: '#5816F0',
          xlight: '#F4F3FF',
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blink: {
          '0%, 100%': { borderColor: 'currentColor' },
          '50%': { borderColor: 'transparent' }
        },
        glow: {
          '0%': {
            boxShadow: '0 0 5px #6941C6, 0 0 10px #6941C6',
            transform: 'scale(1)',
          },
          '25%': {
            boxShadow: '0 0 15px #6941C6, 0 0 25px #6941C6',
            transform: 'scale(1.02)',
          },
          '50%': {
            boxShadow: '0 0 25px #6941C6, 0 0 35px #6941C6',
            transform: 'scale(1)',
          },
          '75%': {
            boxShadow: '0 0 15px #6941C6, 0 0 25px #6941C6',
            transform: 'scale(1.02)',
          },
          '100%': {
            boxShadow: '0 0 5px #6941C6, 0 0 10px #6941C6',
            transform: 'scale(1)',
          }
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' }
        },
        spin3D: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' }
        },
        'network-pulse': {
            '0%, 100%': { transform: 'scale(1)', opacity: '1' },
            '50%': { transform: 'scale(1.1)', opacity: '0.5' },
          },
      },
      animation: {
        fadeIn: 'fadeIn 0.8s ease-out',
        slideUp: 'slideUp 0.8s ease-out',
        slideInLeft: 'slideInLeft 0.8s ease-out',
        slideInRight: 'slideInRight 0.8s ease-out',
        float: 'float 3s ease-in-out infinite',
        blink: 'blink 0.7s step-end infinite',
        glow: 'glow 2s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        spin3D: 'spin3D 2s ease-in-out infinite',
        'network-pulse-1': 'network-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'network-pulse-2': 'network-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) 0.2s infinite',
        'network-pulse-3': 'network-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) 0.4s infinite',
        'network-pulse-4': 'network-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) 0.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
