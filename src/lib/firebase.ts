import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  type Firestore,
  writeBatch
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = firebaseConfigData;

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with custom database ID if specified
export const db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Task Interface
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  category: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  tags: string[];
  subtasks: SubTask[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLoginAt: number;
  theme?: 'light' | 'dark';
}

// User Profile Preferences (Theme persistence in Firestore)
export async function getUserTheme(userId: string): Promise<'light' | 'dark' | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.theme === 'light' || data?.theme === 'dark') {
        return data.theme;
      }
    }
  } catch (err) {
    console.warn('Could not read user theme from Firestore:', err);
  }
  return null;
}

export async function saveUserTheme(userId: string, theme: 'light' | 'dark'): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { theme, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('Could not save user theme to Firestore:', err);
  }
}

// Auth helpers
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  // Store/update user profile document in /users/{uid}
  if (result.user) {
    const userRef = doc(db, 'users', result.user.uid);
    await setDoc(userRef, {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      lastLoginAt: Date.now()
    }, { merge: true });
  }
  return result.user;
}

export async function signInAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  if (result.user) {
    const userRef = doc(db, 'users', result.user.uid);
    await setDoc(userRef, {
      uid: result.user.uid,
      email: 'guest@tasks.local',
      displayName: 'Guest User',
      photoURL: null,
      lastLoginAt: Date.now(),
      isAnonymous: true
    }, { merge: true });
  }
  return result.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Firestore Isolated Task Operations for User
export function subscribeToUserTasks(
  userId: string, 
  callback: (tasks: TaskItem[]) => void,
  onError?: (err: Error) => void
) {
  // Query only the subcollection strictly isolated to the user: /users/{userId}/tasks
  const tasksRef = collection(db, 'users', userId, 'tasks');
  const q = query(tasksRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const items: TaskItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: docSnap.id,
        userId: data.userId || userId,
        userEmail: data.userEmail || '',
        userName: data.userName || '',
        title: data.title || '',
        description: data.description || '',
        completed: Boolean(data.completed),
        priority: data.priority || 'medium',
        category: data.category || 'General',
        dueDate: data.dueDate || '',
        dueTime: data.dueTime || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        completedAt: data.completedAt || null,
      });
    });
    callback(items);
  }, (error) => {
    console.error('Firestore task subscription error:', error);
    if (onError) onError(error);
  });
}

export async function addTaskForUser(
  userId: string,
  userEmail: string,
  userName: string,
  taskData: Omit<TaskItem, 'id' | 'userId' | 'userEmail' | 'userName' | 'createdAt' | 'updatedAt' | 'completedAt'>
): Promise<string> {
  const tasksRef = collection(db, 'users', userId, 'tasks');
  const newDocRef = doc(tasksRef);
  const now = Date.now();

  const docPayload = {
    userId,
    userEmail: userEmail || '',
    userName: userName || '',
    title: taskData.title.trim(),
    description: taskData.description?.trim() || '',
    completed: taskData.completed ?? false,
    priority: taskData.priority || 'medium',
    category: taskData.category || 'General',
    dueDate: taskData.dueDate || '',
    dueTime: taskData.dueTime || '',
    tags: taskData.tags || [],
    subtasks: taskData.subtasks || [],
    createdAt: now,
    updatedAt: now,
    completedAt: null
  };

  await setDoc(newDocRef, docPayload);
  return newDocRef.id;
}

export async function toggleTaskCompletion(
  userId: string,
  taskId: string,
  currentStatus: boolean
): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  const nextCompleted = !currentStatus;
  await updateDoc(taskRef, {
    completed: nextCompleted,
    completedAt: nextCompleted ? Date.now() : null,
    updatedAt: Date.now()
  });
}

export async function updateTask(
  userId: string,
  taskId: string,
  updates: Partial<Omit<TaskItem, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: Date.now()
  });
}

export async function deleteTask(
  userId: string,
  taskId: string
): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskRef);
}

export async function batchDeleteCompletedTasks(
  userId: string,
  taskIds: string[]
): Promise<void> {
  if (taskIds.length === 0) return;
  const batch = writeBatch(db);
  taskIds.forEach((id) => {
    const taskRef = doc(db, 'users', userId, 'tasks', id);
    batch.delete(taskRef);
  });
  await batch.commit();
}
