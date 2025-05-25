import { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';

// Функция для безопасной инициализации Firebase Admin
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  // Для разработки не инициализируем Firebase Admin
  if (process.env.NODE_ENV === 'development') {
    console.log('Skipping Firebase Admin initialization in development');
    return null;
  }

  // Проверяем наличие всех необходимых переменных
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

  // Создаем конфигурацию без строгой типизации
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  };

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    return null;
  }
}

// Инициализируем Firebase Admin при загрузке модуля
const firebaseApp = initializeFirebaseAdmin();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем инициализацию Firebase
  if (!firebaseApp) {
    return res.status(200).json({ 
      success: true,
      message: "Mock response - Firebase Admin not configured for development",
      winners: [
        { 
          id: 'mock-winner-1', 
          name: 'Mock Winner 1',
          userId: 'mock-user-1',
          giveawayTitle: 'Mock Giveaway'
        }
      ]
    });
  }

  // getGiveaways
  // handle errors
  try {
    const winners = await winnerSelection();
    res.status(200).json({ 
      message: "These users have been picked as a winner", 
      winners: winners 
    });
  } catch (error) {
    console.error(`Error occurred while picking winners: ${error}`);
    res.status(500).json({ message: 'Error occurred while picking winners.' });
  }
}

function pickWinner(participatedUsers: string | any[], total: any, noOfWinners: number) {
  // If no users participated, return null
  if (!participatedUsers || participatedUsers.length === 0) {
    return null;
  }

  const totalEntries = total;
  const weightedPool = [];

  // Build a weighted pool based on the number of entries
  for (const user of participatedUsers) {
    const userEntries = user.userEntries || 1;
    for (let i = 0; i < userEntries; i++) {
      weightedPool.push(user);
    }
  }

  const winners = [];

  // Randomly select winners from the weighted pool
  while (winners.length < noOfWinners && weightedPool.length > 0) {
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    const winner = weightedPool[randomIndex];
    winners.push(winner);
    if(weightedPool.length > noOfWinners)
      weightedPool.splice(randomIndex, 1); // Remove the winner from the pool
  }
  return winners.length > 0 ? winners : null;
}

const winnerSelection = async () => {
  // Проверяем, что Firebase Admin инициализирован
  if (!firebaseApp) {
    console.log('Firebase Admin not available - returning mock winners');
    return [
      { 
        id: 'mock-winner-1', 
        name: 'Mock Winner 1',
        userId: 'mock-user-1',
        giveawayTitle: 'Mock Giveaway'
      }
    ];
  }

  try {
    const giveawaysRef = admin.firestore().collection('giveaway');
    const usersRef = admin.firestore().collection('users');
    const winners: any[] = [];

    const batch = admin.firestore().batch();

    const giveawaysSnapshot = await giveawaysRef.get();
    const usersSnapshot = await usersRef.get();

    const today = admin.firestore.Timestamp.now();

    giveawaysSnapshot?.forEach((giveawayDoc) => {
      const giveaway = giveawayDoc.data();
      const endDate = new Date(giveaway.endDate);
      const ended = endDate.getTime() - today.toDate().getTime();
      const endingInDays = Math.floor(ended / (1000 * 60 * 60 * 24));
      const prizes = giveaway.prize;

      // calculate noOfWinners from no of prizes
      let noOfWinners = 0;
      if (prizes && prizes?.length > 0) {
        prizes?.forEach((prize: any) => {
          noOfWinners += prize.noOfWinners;
        });
      }

      if (giveaway?.status === 'closed') {
        return;
      }

      if (endingInDays < 0) {
        if (giveaway.participatedUsers?.length > 0 || giveaway?.totalEntries > 0) {
          const giveawayWinners: any[] = [];

          for (const prize of prizes) {
            const prizeWinners = pickWinner(giveaway?.participatedUsers, giveaway.totalEntries, prize.noOfWinners);
            if(prizeWinners && prizeWinners?.length > 0) {
              prizeWinners?.forEach((winner) => {
                const user = usersSnapshot.docs.find((doc) => {
                  return doc.data().uid === winner.userId;
                });
                if (winner && user) {
                  const userRef = usersRef.doc(user?.ref.id);
                  batch.update(userRef, {
                    giveawaysWon: admin.firestore.FieldValue.arrayUnion(giveaway.uid)
                  });
                  giveawayWinners.push(winner);
                }
              });
            }
          }

          if (giveawayWinners.length > 0) {
            batch.update(giveawayDoc.ref, {
              winners: giveawayWinners,
              status: 'closed',
              closedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log("New winners", giveawayWinners);
            winners.push(...giveawayWinners);
          }
        }
      }
    });
    
    await batch.commit();
    return winners;
  } catch (error) {
    console.error(`Error occurred while processing giveaways: ${error}`);
    throw new Error('Unable to process giveaways.');
  }
};