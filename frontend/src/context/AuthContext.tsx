import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '../config/firebase';

export interface UserProfile {
  fullName: string;
  phone: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS = 'users';

async function writeUserProfile(
  uid: string,
  data: { fullName: string; phone: string; email: string }
) {
  if (!isFirebaseConfigured()) return;
  try {
    const db = getFirebaseDb();
    await setDoc(
      doc(db, USERS, uid),
      {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('[auth] Firestore (users) indisponível ou regras incorretas:', e);
  }
}

async function readUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, USERS, uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      fullName: typeof d.fullName === 'string' ? d.fullName : '',
      phone: typeof d.phone === 'string' ? d.phone : '',
      email: typeof d.email === 'string' ? d.email : '',
    };
  } catch (e) {
    console.warn('[auth] Leitura do perfil no Firestore falhou:', e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await readUserProfile(u.uid);
          if (p) {
            setProfile(p);
          } else {
            setProfile({
              fullName: u.displayName ?? '',
              phone: '',
              email: u.email ?? '',
            });
          }
        } catch {
          setProfile({
            fullName: u.displayName ?? '',
            phone: '',
            email: u.email ?? '',
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    const u = cred.user;
    await writeUserProfile(u.uid, {
      fullName: u.displayName ?? '',
      phone: '',
      email: u.email ?? '',
    });
  }, []);

  const signInWithFacebook = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new FacebookAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const u = cred.user;
    await writeUserProfile(u.uid, {
      fullName: u.displayName ?? '',
      phone: '',
      email: u.email ?? '',
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithEmail = useCallback(
    async (input: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
    }) => {
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
      await writeUserProfile(cred.user.uid, {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
      });
      await updateProfile(cred.user, { displayName: input.fullName.trim() });
      await sendEmailVerification(cred.user);
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!isFirebaseConfigured()) return;
    await firebaseSignOut(getFirebaseAuth());
    setProfile(null);
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      firebaseReady: isFirebaseConfigured(),
      signInWithGoogle,
      signInWithFacebook,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      sendVerificationEmail,
    }),
    [
      user,
      profile,
      loading,
      signInWithGoogle,
      signInWithFacebook,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      sendVerificationEmail,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
