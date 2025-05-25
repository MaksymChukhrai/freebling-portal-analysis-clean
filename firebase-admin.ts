import { credential } from "firebase-admin";
import { App, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Функция для создания безопасной конфигурации
function createFirebaseConfig() {
  // Для разработки используем mock данные
  if (process.env.NODE_ENV === 'development') {
    console.log('Using Firebase Admin mock configuration for development');
    return null;
  }

  // Для production проверяем наличие всех необходимых переменных
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID', 
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`Missing Firebase Admin environment variables: ${missingVars.join(', ')}`);
    return null;
  }

  // Используем упрощенный формат конфигурации
  return {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  };
}

// Firebase Admin инициализация
let firebaseAdminApp: App;
let firebaseAdminDb: any;

try {
  const config = createFirebaseConfig();
  
  if (config && getApps().length === 0) {
    firebaseAdminApp = initializeApp({ 
      credential: credential.cert(config) 
    });
    firebaseAdminDb = getFirestore(firebaseAdminApp);
    console.log('Firebase Admin initialized successfully');
  } else if (getApps().length > 0) {
    firebaseAdminApp = getApps()[0];
    firebaseAdminDb = getFirestore(firebaseAdminApp);
    console.log('Using existing Firebase Admin app');
  } else {
    // Mock для разработки
    console.log('Firebase Admin not initialized - using mock');
    firebaseAdminApp = {} as App;
    firebaseAdminDb = createMockFirestore();
  }
} catch (error) {
  console.warn('Firebase Admin initialization failed:', error);
  // Fallback к mock
  firebaseAdminApp = {} as App;
  firebaseAdminDb = createMockFirestore();
}

// Функция для создания mock Firestore
function createMockFirestore() {
  return {
    collection: (collectionName: string) => ({
      doc: (docId?: string) => ({
        get: () => Promise.resolve({ 
          exists: false, 
          data: () => ({}),
          id: docId || 'mock-id'
        }),
        set: (data: any) => {
          console.log(`Mock Firestore: Setting document in ${collectionName}:`, data);
          return Promise.resolve();
        },
        update: (data: any) => {
          console.log(`Mock Firestore: Updating document in ${collectionName}:`, data);
          return Promise.resolve();
        },
        delete: () => {
          console.log(`Mock Firestore: Deleting document from ${collectionName}`);
          return Promise.resolve();
        },
      }),
      add: (data: any) => {
        console.log(`Mock Firestore: Adding document to ${collectionName}:`, data);
        return Promise.resolve({ id: 'mock-generated-id' });
      },
      where: (field: string, operator: any, value: any) => ({
        get: () => {
          console.log(`Mock Firestore: Querying ${collectionName} where ${field} ${operator} ${value}`);
          return Promise.resolve({ 
            docs: [],
            empty: true,
            size: 0
          });
        }
      }),
      get: () => {
        console.log(`Mock Firestore: Getting all documents from ${collectionName}`);
        return Promise.resolve({ 
          docs: [],
          empty: true,
          size: 0
        });
      }
    })
  };
}

export { firebaseAdminApp, firebaseAdminDb };