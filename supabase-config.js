/* StudyQuest RPG - Supabase Authentication & Database Integration */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://cwqesayinqhtjkzzhxvp.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cWVzYXlpbnFodGprenpoeHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MDI2MjksImV4cCI6MjEwMTM3ODYyOX0.34AA3b0rxqtnpdxhjzkUZML7_EoHpUPHEIidIHlV8HM";

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;

class SupabaseService {
  constructor() {
    this.user = null;
    this.initAuthListener();
  }

  async initAuthListener() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        this.handleUserSession(session.user);
      }
    } catch (err) {
      console.log("Supabase getSession init:", err);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        this.handleUserSession(session.user);
      } else {
        this.user = null;
        this.updateAuthUI(null);
      }
    });
  }

  async handleUserSession(user) {
    this.user = user;
    this.updateAuthUI(user);
    window.showToast(`⚡ مرحباً بك ${user.user_metadata?.full_name || user.email}!`);
    await this.syncUserData(user.id);
  }

  updateAuthUI(user) {
    const authBtn = document.getElementById('firebase-auth-btn');
    if (authBtn) {
      if (user) {
        const name = user.user_metadata?.full_name || user.email.split('@')[0];
        authBtn.innerText = `⚡ 👤 ${name}`;
        authBtn.style.borderColor = 'var(--accent-emerald)';
      } else {
        authBtn.innerText = '⚡ دخول (Supabase)';
        authBtn.style.borderColor = 'var(--primary-purple)';
      }
    }
  }

  async signUp(email, password, displayName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName || email.split('@')[0] }
        }
      });
      if (error) throw error;

      if (data.user) {
        window.showToast('🎉 تم إنشاء الحساب بنجاح على Supabase!');
        await this.saveInitialUserData(data.user);
        return true;
      }
    } catch (error) {
      console.error('Supabase SignUp Error:', error);
      window.showToast(`❌ خطأ في التسجيل: ${error.message}`);
      return false;
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      window.showToast('✅ تم تسجيل الدخول بنجاح عبر Supabase!');
      return true;
    } catch (error) {
      console.error('Supabase SignIn Error:', error);
      window.showToast(`❌ خطأ في تسجيل الدخول: ${error.message}`);
      return false;
    }
  }

  async signInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Supabase Google OAuth Error:', error);
      window.showToast(`❌ خطأ في تسجيل الدخول بجوجل: ${error.message}`);
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.user = null;
      this.updateAuthUI(null);
      window.showToast('🔒 تم تسجيل الخروج');
    } catch (error) {
      console.error('Supabase SignOut Error:', error);
    }
  }

  async saveInitialUserData(user) {
    try {
      const initialData = {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.email.split('@')[0],
        level: window.gamifyEngine?.level || 1,
        xp: window.gamifyEngine?.xp || 0,
        gold: window.gamifyEngine?.gold || 150,
        streak: window.gamifyEngine?.streak || 1,
        updated_at: new Date().toISOString()
      };
      await supabase.from('profiles').upsert(initialData);
    } catch (err) {
      console.warn("Could not save initial profile to profiles table:", err);
    }
  }

  async saveStateToSupabase() {
    if (!this.user) return;
    try {
      const dataToSave = {
        id: this.user.id,
        email: this.user.email,
        display_name: window.gamifyEngine?.playerName || 'بطل المعرفة',
        level: window.gamifyEngine?.level || 1,
        xp: window.gamifyEngine?.xp || 0,
        gold: window.gamifyEngine?.gold || 0,
        streak: window.gamifyEngine?.streak || 1,
        game_data: {
          tasks: window.tasksEngine?.tasks || [],
          transactions: window.rewardsEngine?.transactions || []
        },
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('profiles').upsert(dataToSave);
      if (error) {
        console.warn('Supabase DB Sync Notice:', error.message);
      }
    } catch (error) {
      console.error('Supabase Save Error:', error);
    }
  }

  async syncUserData(uid) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (error) {
        console.warn("Profiles table check:", error.message);
        return;
      }
      if (data) {
        if (data.level && window.gamifyEngine) window.gamifyEngine.level = data.level;
        if (data.xp !== undefined && window.gamifyEngine) window.gamifyEngine.xp = data.xp;
        if (data.gold !== undefined && window.gamifyEngine) window.gamifyEngine.gold = data.gold;
        if (data.streak !== undefined && window.gamifyEngine) window.gamifyEngine.streak = data.streak;
        if (data.display_name && window.gamifyEngine) window.gamifyEngine.playerName = data.display_name;
        if (data.game_data?.tasks && window.tasksEngine) {
          window.tasksEngine.tasks = data.game_data.tasks;
          window.tasksEngine.renderTaskList();
        }
        if (data.game_data?.transactions && window.rewardsEngine) {
          window.rewardsEngine.transactions = data.game_data.transactions;
          window.rewardsEngine.renderVisaCard();
        }
        if (window.gamifyEngine) {
          window.gamifyEngine.renderHUD();
          window.gamifyEngine.saveState();
        }
      }
    } catch (error) {
      console.error('Supabase Sync Error:', error);
    }
  }
}

window.supabaseService = new SupabaseService();
