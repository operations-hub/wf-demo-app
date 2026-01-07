import "dotenv/config";

export default ({ config }: any) => ({
  ...config,
  name: "wf-picks",
  slug: "wf-picks",
  scheme: "wfpicks",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    package: "com.wf-picks.wfpicks",
  },

  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.wf-picks.wfpicks",
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  owner: "adiiiiii",

  runtimeVersion: { policy: "appVersion" },

  updates: {
    url: "https://u.expo.dev/4188cb01-cc90-4532-b488-2c7611f4ded0",
  },

  extra: {
    router: {},
    eas: { projectId: "4188cb01-cc90-4532-b488-2c7611f4ded0" },

    // ✅ these MUST exist
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
});
