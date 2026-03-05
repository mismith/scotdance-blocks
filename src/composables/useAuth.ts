import { initializeApp } from 'firebase/app'
import {
  type User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { computed, ref, shallowRef } from 'vue'

const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_SCOTDANCE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_SCOTDANCE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_SCOTDANCE_FIREBASE_PROJECT_ID,
})

const auth = getAuth(firebaseApp)

const user = shallowRef<User | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser
  isLoading.value = false
})

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value)

  async function signIn(email: string, password: string) {
    error.value = null
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e: unknown) {
      error.value = firebaseErrorMessage(e)
      throw e
    }
  }

  async function register(email: string, password: string) {
    error.value = null
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (e: unknown) {
      error.value = firebaseErrorMessage(e)
      throw e
    }
  }

  async function resetPassword(email: string) {
    error.value = null
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (e: unknown) {
      error.value = firebaseErrorMessage(e)
      throw e
    }
  }

  async function signOut() {
    error.value = null
    await firebaseSignOut(auth)
  }

  async function getIdToken(): Promise<string | null> {
    if (!user.value) return null
    return user.value.getIdToken()
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    register,
    resetPassword,
    signOut,
    getIdToken,
  }
}

function firebaseErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
