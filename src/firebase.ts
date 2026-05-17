import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBqvzpY2VbEGvzuXA6IKcVdQ3SAXBGOi90',
  authDomain: 'sistema-rh-operacional.firebaseapp.com',
  projectId: 'sistema-rh-operacional',
  storageBucket: 'sistema-rh-operacional.firebasestorage.app',
  messagingSenderId: '704295792003',
  appId: '1:704295792003:web:f1b303da9dd59a11c4dab6',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)