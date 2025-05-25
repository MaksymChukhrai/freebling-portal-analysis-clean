const configuration = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app-id",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  },
  emulatorHost: process.env.NEXT_PUBLIC_EMULATOR_HOST || "localhost",
  emulator: process.env.NEXT_PUBLIC_EMULATOR === 'true' || false,
};

export default configuration;
