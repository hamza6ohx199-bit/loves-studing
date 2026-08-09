/* StudyQuest RPG - Firebase Authentication & Firestore Integration */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSy_demo_key_placeholder",
  projectId: "1053979653443",
  authDomain: "project-1053979653443.firebaseapp.com",
  storageBucket: "project-1053979653443.appspot.com"
};

let app = null;
let auth = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase Init Notice (Supabase active as primary backend):", e.message);
}

class FirebaseService {
  constructor() {
    this.user = null;
    if (auth) this.initAuthListener();
  }

  initAuthListener() {
    onAuthStateChanged(auth, async (currentUser) => {
      this.user = currentUser;
      const authBtn = document.getElementById('firebase-auth-btn');
      const authModal = document.getElementById('firebase-auth-modal');

      if (currentUser) {
        if (authBtn) {
          authBtn.innerText = `👤 ${currentUser.displayName || currentUser.email.split('@')[0]}`;
          authBtn.style.borderColor = 'var(--accent-emerald)';
        }
        window.showToast(`👋 مرحباً بك ${currentUser.displayName || currentUser.email}!`);
        
        // Sync & Load data from Firestore
        await this.syncUserDataFromFirestore(currentUser.uid);
      } else {
        if (authBtn) {
          authBtn.innerText = '🔐 تسجيل الدخول (Firebase)';
          authBtn.style.borderColor = 'var(--primary-purple)';
        }
      }
    });
  }

  async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create initial Firestore user document
      const initialData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || email.split('@')[0],
        level: window.gamifyEngine?.level || 1,
        xp: window.gamifyEngine?.xp || 0,
        gold: window.gamifyEngine?.gold || 150,
        streak: window.gamifyEngine?.streak || 1,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", user.uid), initialData, { merge: true });
      window.showToast('🎉 تم إنشاء الحساب بنجاح على Firebase!');
      return true;
    } catch (error) {
      console.error('Firebase SignUp Error:', error);
      window.showToast(`❌ خطأ في التسجيل: ${error.message}`);
      return false;
    }
  }

  async signIn(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.showToast('✅ تم تسجيل الدخول بنجاح!');
      return true;
    } catch (error) {
      console.error('Firebase SignIn Error:', error);
      window.showToast(`❌ خطأ في تسجيل الدخول: ${error.message}`);
      return false;
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user doc exists in Firestore, if not create it
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        const initialData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || '',
          level: window.gamifyEngine?.level || 1,
          xp: window.gamifyEngine?.xp || 0,
          gold: window.gamifyEngine?.gold || 150,
          streak: window.gamifyEngine?.streak || 1,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, initialData, { merge: true });
      }

      window.showToast(`🎉 تم تسجيل الدخول بواسطة جوجل بنجاح! مرحباً ${user.displayName || ''}`);
      return true;
    } catch (error) {
      console.error('Firebase Google SignIn Error:', error);
      window.showToast(`❌ خطأ في تسجيل الدخول بجوجل: ${error.message}`);
      return false;
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      window.showToast('🔒 تم تسجيل الخروج');
    } catch (error) {
      console.error('Firebase SignOut Error:', error);
    }
  }

  async saveStateToFirestore() {
    if (!this.user) return;
    try {
      const userRef = doc(db, "users", this.user.uid);
      const dataToSave = {
        level: window.gamifyEngine?.level || 1,
        xp: window.gamifyEngine?.xp || 0,
        gold: window.gamifyEngine?.gold || 0,
        streak: window.gamifyEngine?.streak || 1,
        playerName: window.gamifyEngine?.playerName || 'بطل المعرفة',
        tasks: window.tasksEngine?.tasks || [],
        transactions: window.rewardsEngine?.transactions || [],
        lastUpdated: new Date().toISOString()
      };
      await setDoc(userRef, dataToSave, { merge: true });
    } catch (error) {
      console.error('Firestore Save Error:', error);
    }
  }

  async syncUserDataFromFirestore(uid) {
    try {
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.level && window.gamifyEngine) window.gamifyEngine.level = data.level;
        if (data.xp && window.gamifyEngine) window.gamifyEngine.xp = data.xp;
        if (data.gold !== undefined && window.gamifyEngine) window.gamifyEngine.gold = data.gold;
        if (data.streak && window.gamifyEngine) window.gamifyEngine.streak = data.streak;
        if (data.playerName && window.gamifyEngine) window.gamifyEngine.playerName = data.playerName;
        if (data.tasks && window.tasksEngine) {
          window.tasksEngine.tasks = data.tasks;
          window.tasksEngine.renderTaskList();
        }
        if (data.transactions && window.rewardsEngine) {
          window.rewardsEngine.transactions = data.transactions;
          window.rewardsEngine.renderVisaCard();
        }

        if (window.gamifyEngine) {
          window.gamifyEngine.renderHUD();
          window.gamifyEngine.saveState();
        }
      }
    } catch (error) {
      console.error('Firestore Sync Error:', error);
    }
  }
}

window.firebaseService = new FirebaseService();
