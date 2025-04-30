/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        interThin: ['Inter_100Thin'],
        interExtraLight: ['Inter_200ExtraLight'],
        interLight: ['Inter_300Light'],
        inter: ['Inter_400Regular'],
        interMedium: ['Inter_500Medium'],
        interSemiBold: ['Inter_600SemiBold'],
        interBold: ['Inter_700Bold'],
        interExtraBold: ['Inter_800ExtraBold'],
        interBlack: ['Inter_900Black']
      }
    },
  },
  plugins: [],
}
