import { Trip, User } from '../types';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  setDoc
} from 'firebase/firestore';

// Configuração do Firebase do Projeto "gerenciadorviagens-263ea"
const firebaseConfig = {
  apiKey: "AIzaSyDqeKKVcdx4pTBBvFjhE_XxXTwC7jXd9LY",
  authDomain: "gerenciadorviagens-263ea.firebaseapp.com",
  projectId: "gerenciadorviagens-263ea",
  storageBucket: "gerenciadorviagens-263ea.firebasestorage.app",
  messagingSenderId: "603668649376",
  appId: "1:603668649376:web:4f3eb73f16db0dbf0a80c5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- AUTHENTICATION SERVICES ---

export const mockLogin = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    return {
      uid: user.uid,
      displayName: user.displayName || 'Viajante',
      email: user.email || '',
      photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`
    };
  } catch (error) {
    console.error("Erro no login Google:", error);
    throw error;
  }
};

export const mockEmailLogin = async (email: string, password: string): Promise<User> => {
  try {
    // Tenta fazer login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    return {
      uid: user.uid,
      displayName: user.displayName || email.split('@')[0],
      email: user.email || '',
      photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=0D8ABC&color=fff`
    };
  } catch (error: any) {
    // Se o usuário não existir (código comum do firebase), cria a conta automaticamente
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = newUserCredential.user;
        
        // Define um nome padrão baseado no email
        const generatedName = email.split('@')[0];
        // Tenta atualizar o perfil, mas não falha se der erro
        try {
            await updateProfile(newUser, {
            displayName: generatedName.charAt(0).toUpperCase() + generatedName.slice(1)
            });
        } catch (e) { console.log("Info: Perfil não atualizado no cadastro inicial"); }

        return {
          uid: newUser.uid,
          displayName: newUser.displayName || generatedName,
          email: newUser.email || '',
          photoURL: `https://ui-avatars.com/api/?name=${generatedName}&background=0D8ABC&color=fff`
        };
      } catch (createError) {
        console.error("Erro ao criar conta:", createError);
        throw createError;
      }
    }
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// Observador de estado de autenticação (usado no App.tsx para persistência)
export const observeAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Viajante',
        email: user.email || '',
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`
      });
    } else {
      callback(null);
    }
  });
};

export const getUser = (): User | null => {
  const user = auth.currentUser;
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Viajante',
    email: user.email || '',
    photoURL: user.photoURL || undefined
  };
};

// --- DATABASE SERVICES ---

export const getTrips = async (): Promise<Trip[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(collection(db, "trips"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // O ID do documento Firestore é usado como ID da viagem para garantir consistência nas edições
      return { ...data, id: doc.id } as Trip;
    });
  } catch (error) {
    console.error("Erro ao buscar viagens:", error);
    return [];
  }
};

export const saveTrip = async (trip: Trip): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  try {
    // Adicionamos o campo userId para garantir que só o dono veja nas queries
    const tripData = { ...trip, userId: user.uid };
    
    // Remove o ID do corpo do objeto para não duplicar, pois o ID será a chave do documento
    const { id, ...dataToSave } = tripData;

    // Lógica de ID:
    // Se o ID for numérico (ex: criado por Date.now() no frontend), usamos ele como chave string para criar.
    // Se já for um ID de hash do Firestore, usamos ele para atualizar.
    const docId = trip.id ? trip.id.toString() : Date.now().toString();

    // Usamos setDoc com merge: true. 
    // Isso funciona tanto para criar (se não existir) quanto para atualizar (se existir).
    await setDoc(doc(db, "trips", docId), dataToSave, { merge: true });

  } catch (error) {
    console.error("Erro ao salvar viagem:", error);
    throw error;
  }
};

export const deleteTrip = async (tripId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "trips", tripId));
  } catch (error) {
    console.error("Erro ao deletar viagem:", error);
    throw error;
  }
};