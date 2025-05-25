import configuration from '~/configuration'; 
import { getApps } from "firebase/app";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Проверяем, что у нас есть валидная конфигурация
const isValidConfig = configuration.firebase.apiKey && 
                     configuration.firebase.apiKey !== "demo-api-key" &&
                     configuration.firebase.projectId &&
                     configuration.firebase.projectId !== "demo-project";

let app: any;
let auth: any;
let db: any;
let storage: any;
let messaging: any;

if (isValidConfig) {
  try {
    app = !getApps().length ? initializeApp(configuration.firebase) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Messaging работает только в браузере
    if (typeof window !== 'undefined') {
      messaging = getMessaging(app);
    }
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    ({ auth, db, storage, messaging } = createMockServices());
  }
} else {
  console.log('Using Firebase mock for development');
  ({ auth, db, storage, messaging } = createMockServices());
}

function createMockServices() {
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      setTimeout(() => callback(null), 0);
      return () => {};
    },
    signInWithEmailAndPassword: (email: string, password: string) => 
      Promise.resolve({ 
        user: { 
          uid: 'mock-user', 
          email: email,
          displayName: 'Mock User'
        } 
      }),
    signOut: () => Promise.resolve(),
    createUserWithEmailAndPassword: (email: string, password: string) => 
      Promise.resolve({ 
        user: { 
          uid: 'mock-user-' + Date.now(), 
          email: email 
        } 
      }),
    updateProfile: () => Promise.resolve(),
    sendPasswordResetEmail: () => Promise.resolve(),
  };

  const mockDb = {
    collection: (name: string) => ({
      doc: (id?: string) => ({
        get: () => Promise.resolve({ 
          exists: Math.random() > 0.5,
          data: () => ({
            id: id || 'mock-id',
            createdAt: { toMillis: () => Date.now() },
            updatedAt: { toMillis: () => Date.now() },
            title: 'Mock Document',
            description: 'This is a mock document for development'
          }),
          id: id || 'mock-id'
        }),
        set: (data: any) => {
          console.log(`Mock: Setting document in ${name}:`, data);
          return Promise.resolve();
        },
        update: (data: any) => {
          console.log(`Mock: Updating document in ${name}:`, data);
          return Promise.resolve();
        },
        delete: () => {
          console.log(`Mock: Deleting document from ${name}`);
          return Promise.resolve();
        },
      }),
      add: (data: any) => {
        console.log(`Mock: Adding document to ${name}:`, data);
        return Promise.resolve({ id: 'mock-doc-' + Date.now() });
      },
      where: (field: string, operator: string, value: any) => ({
        get: () => Promise.resolve({ 
          docs: [
            {
              id: 'mock-1',
              data: () => ({
                id: 'mock-1',
                [field]: value,
                createdAt: { toMillis: () => Date.now() },
                updatedAt: { toMillis: () => Date.now() }
              })
            }
          ],
          empty: false,
          size: 1
        }),
        orderBy: () => ({
          get: () => Promise.resolve({ docs: [], empty: true, size: 0 })
        }),
        limit: () => ({
          get: () => Promise.resolve({ docs: [], empty: true, size: 0 })
        })
      }),
      orderBy: () => ({
        get: () => Promise.resolve({ docs: [], empty: true, size: 0 }),
        limit: () => ({
          get: () => Promise.resolve({ docs: [], empty: true, size: 0 })
        })
      }),
      get: () => Promise.resolve({ 
        docs: [],
        empty: true,
        size: 0
      })
    })
  };

  const mockStorage = {
    ref: (path?: string) => ({
      put: (file: any) => {
        console.log(`Mock: Uploading file to ${path}:`, file);
        return Promise.resolve({
          ref: {
            getDownloadURL: () => Promise.resolve(`https://mock-storage.com/${path || 'file'}`)
          }
        });
      },
      getDownloadURL: () => Promise.resolve(`https://mock-storage.com/${path || 'file'}`),
      delete: () => {
        console.log(`Mock: Deleting file from ${path}`);
        return Promise.resolve();
      }
    })
  };

  // ДОБАВЛЯЕМ mockMessaging
  const mockMessaging = {
    getToken: (options?: any) => {
      console.log('Mock: getToken called');
      return Promise.resolve('mock-fcm-token-' + Date.now());
    },
    onMessage: (callback: any) => {
      console.log('Mock: onMessage listener set up');
      // Имитируем получение сообщения через 5 секунд (для тестирования)
      setTimeout(() => {
        callback({
          notification: {
            title: 'Mock Notification',
            body: 'This is a mock push notification'
          },
          data: {
            mockData: 'true'
          }
        });
      }, 5000);
      return () => console.log('Mock: onMessage listener removed');
    },
    deleteToken: () => {
      console.log('Mock: deleteToken called');
      return Promise.resolve(true);
    },
  };

  // ВАЖНО: возвращаем все сервисы, включая messaging
  return { 
    auth: mockAuth, 
    db: mockDb, 
    storage: mockStorage, 
    messaging: mockMessaging 
  };
}

// Mock функции для прямого импорта из firebase/messaging
export function onMessage(messaging: any, callback: any) {
  if (messaging && messaging.onMessage) {
    return messaging.onMessage(callback);
  }
  console.log('Mock: onMessage called directly');
  return () => {};
}

export function getToken(messaging: any, options?: any) {
  if (messaging && messaging.getToken) {
    return messaging.getToken(options);
  }
  console.log('Mock: getToken called directly');
  return Promise.resolve('mock-direct-token');
}

// Сохраняем оригинальную функцию
export function postToJSON(doc: { data: () => any; }) {
  try {
    const data = doc.data();
    return {
      ...data,
      // Gotcha! firestore timestamp NOT serializable to JSON. Must convert to milliseconds
      createdAt: data?.createdAt?.toMillis ? data.createdAt.toMillis() : 0,
      updatedAt: data?.updatedAt?.toMillis ? data.updatedAt.toMillis() : 0,
    };
  } catch (error) {
    console.warn('Error in postToJSON:', error);
    return {
      createdAt: 0,
      updatedAt: 0,
    };
  }
}

// ИСПРАВЛЕНО: экспортируем все сервисы включая messaging
export { auth, db, storage, messaging };