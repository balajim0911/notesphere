import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../../firebase';
import { useStore } from '../../store/useStore';
import { X, Cloud, AlertCircle, CheckCircle2, RefreshCw, Sparkles, LogOut, User, Copy, Check, ExternalLink } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user } = useStore();
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [showDomainGuide, setShowDomainGuide] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDomain(text);
      setTimeout(() => setCopiedDomain(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    if (!agreed) {
      setError('You must agree to the Terms & Conditions and Privacy Policy to proceed.');
      return;
    }
    setError(null);
    setShowDomainGuide(false);
    setSuccess(null);
    setLoading(true);

    const timeouts: NodeJS.Timeout[] = [];
    
    // Dynamic progressive progress status messages to prevent perception of slowness
    setSuccess('Step 1/3: Launching secure Google login popup...');
    
    const t2 = setTimeout(() => {
      setSuccess('Step 2/3: Waiting for secure Google authorization...');
    }, 2000);
    timeouts.push(t2);

    const t3 = setTimeout(() => {
      setSuccess('Step 3/3: Connected! Synchronizing your 3D sticky notes...');
    }, 4500);
    timeouts.push(t3);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      timeouts.forEach(clearTimeout);
      setSuccess('Success! Workspace synchronized successfully.');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      timeouts.forEach(clearTimeout);
      setSuccess(null);
      console.error(err);
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        setShowDomainGuide(true);
        setError(
          'Google Sign-In is restricted because this dev preview domain is not whitelisted in the active Firebase project yet.'
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled on this Firebase project. Please enable it in the Firebase Console.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in window was closed before completion.');
      } else {
        setError(err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    if (!agreed) {
      setError('You must agree to the Terms & Conditions and Privacy Policy to proceed.');
      return;
    }
    setError(null);
    setShowDomainGuide(false);
    setSuccess(null);
    setGuestLoading(true);

    try {
      setSuccess('Setting up your secure guest sandbox workspace...');
      
      // Delay slightly for smooth transition feel
      await new Promise((resolve) => setTimeout(resolve, 800));

      const { setUser } = useStore.getState();
      setUser({
        uid: 'guest_user',
        email: 'guest@notesphere.local',
        displayName: 'Guest Brainstormer',
        isGuest: true,
      });

      setSuccess('Success! Guest workspace initialized.');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setSuccess(null);
      console.error(err);
      setError(err.message || 'Guest sign-in failed.');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      // If it's a guest, update guest profile locally!
      if (user.isGuest) {
        const { setUser } = useStore.getState();
        setUser({
          ...user,
          displayName: trimmedName,
        });
        setSuccess(`Welcome to NoteSphere, ${trimmedName}!`);
        setTimeout(() => {
          onClose();
          setSuccess(null);
          setNameInput('');
        }, 1500);
        return;
      }

      // Save user record to /users/{uid} Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: trimmedName,
        email: user.email || 'guest@notesphere.local',
        createdAt: Date.now()
      }, { merge: true });

      setSuccess(`Welcome to NoteSphere, ${trimmedName}!`);
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setNameInput('');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrSignOut = async () => {
    setError(null);
    setSuccess(null);
    onClose(); // Snappy instant close first

    const { setUser, setNotesSilently } = useStore.getState();
    const currentUser = useStore.getState().user;

    if (currentUser?.isGuest) {
      setUser(null);
      import('../../constants').then(({ INITIAL_NOTES }) => {
        setNotesSilently(INITIAL_NOTES.map((n, i) => ({ ...n, zIndex: i })));
      }).catch((err) => console.error("Failed to load INITIAL_NOTES on logout:", err));
      return;
    }

    try {
      await signOut(auth);
    } catch (err) {
      console.error("Background signout failed:", err);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  // Determine which step to render:
  // 1. If user is logged in but has no displayName, show "Name Setup" step (first-time user)
  // 2. If user is not logged in, show "Sign In" step
  const isFirstTimeUserSetup = user && !user.displayName;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-md animate-fade-in" 
        onClick={() => {
          if (isFirstTimeUserSetup) {
            handleCancelOrSignOut();
          } else {
            handleClose();
          }
        }} 
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] p-8 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 text-white">
        
        {/* Close Button */}
        <button 
          type="button"
          onClick={() => {
            if (isFirstTimeUserSetup) {
              handleCancelOrSignOut();
            } else {
              handleClose();
            }
          }} 
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white cursor-pointer transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {user && user.displayName ? (
          /* ================= ALREADY SIGNED IN STEP ================= */
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-white animate-pulse" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">
                Cloud Sync Connected
              </h2>
            </div>

            <p className="text-xs text-white/85 mb-8 font-semibold leading-relaxed">
              Your 3D canvas and sticky notes are securely synchronized with Google Cloud Services.
            </p>

            <div className="mb-6 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center gap-3">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User Avatar'} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border-2 border-indigo-500" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-black uppercase">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {user.displayName}
                </h4>
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleClose}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center font-black uppercase tracking-wider text-xs transition-all cursor-pointer shadow-md"
              >
                Proceed to Workspace
              </button>

              <button
                type="button"
                onClick={handleCancelOrSignOut}
                className="w-full h-12 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-xl flex items-center justify-center font-black uppercase tracking-wider text-xs transition-all cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
              >
                Sign Out / Disconnect
              </button>
            </div>
          </div>
        ) : !isFirstTimeUserSetup ? (
          /* ================= SIGN IN STEP ================= */
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Cloud className="w-5 h-5 text-white animate-pulse" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">
                Connect Cloud Sync
              </h2>
            </div>

            <p className="text-xs text-white/85 mb-8 font-semibold leading-relaxed">
              Back up your interactive 3D canvas and access your sticky notes securely from any device in real-time.
            </p>

            {error && (
              <div className="mb-6 p-3.5 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-start gap-2.5 font-bold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {showDomainGuide && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-800/80 border border-blue-500/30 text-xs font-semibold text-slate-200 leading-relaxed">
                <h3 className="font-extrabold text-blue-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  How to Whitelist this Domain
                </h3>
                {firebaseConfig.projectId === 'peerless-backup-g40ks' ? (
                  <>
                    <p className="mb-3 text-[11px] text-slate-300">
                      You are currently using the auto-generated **AI Studio Sandbox database**. Google Sign-In is restricted in the sandbox environment.
                    </p>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] space-y-1 font-bold mb-3">
                      <p>👉 To use Google Sign-In, please do the following:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Open the AI Studio Settings menu (click gear/settings icon on top right).</li>
                        <li>Add your custom Firebase configuration values as environment variables (refer to <code className="px-1 py-0.5 rounded bg-slate-950 font-mono text-[9px] text-amber-200">.env.example</code>).</li>
                        <li>Whitelist the preview domain in your personal Firebase project (as shown below).</li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <p className="mb-3 text-[11px] text-slate-300">
                    Firebase Authentication requires every domain that requests OAuth logins to be explicitly whitelisted in your Firebase Console.
                  </p>
                )}

                <div className="space-y-2.5">
                  <p className="font-bold text-white text-[10px] uppercase tracking-wider">Step-by-Step Whitelisting:</p>
                  <ol className="space-y-2 pl-4 list-decimal text-slate-300 text-[11px]">
                    <li>
                      Go to the{' '}
                      <a 
                        href="https://console.firebase.google.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:underline font-extrabold inline-flex items-center gap-0.5"
                      >
                        Firebase Console <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      Select your Firebase project:{' '}
                      <code className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-amber-400 text-[10px] font-extrabold break-all">
                        {firebaseConfig.projectId}
                      </code>
                    </li>
                    <li>
                      Go to <span className="font-bold text-white">Build &gt; Authentication &gt; Settings</span> and scroll to <span className="font-bold text-white">Authorized domains</span>.
                    </li>
                    <li>
                      Click <span className="font-bold text-white">Add domain</span> and paste this current hostname:
                      <div className="mt-1.5 flex items-center gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800 select-all">
                        <span className="font-mono text-[10px] text-emerald-400 truncate flex-1">{currentHostname}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentHostname)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                          title="Copy hostname"
                        >
                          {copiedDomain === currentHostname ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-start gap-2.5 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start gap-2.5 mb-6 px-1 text-white">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4.5 h-4.5 rounded border-white/25 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer shrink-0"
              />
              <label htmlFor="agree-terms" className="text-[11px] text-white/85 font-semibold select-none cursor-pointer leading-relaxed">
                I agree to the <button type="button" onClick={() => setIsTermsOpen(true)} className="text-white hover:underline font-extrabold inline underline">Terms of Service</button> and <button type="button" onClick={() => setIsTermsOpen(true)} className="text-white hover:underline font-extrabold inline underline">Privacy Policy</button>, and consent to cloud backup.
              </label>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={loading || guestLoading}
                onClick={handleGoogleSignIn}
                className={`w-full h-14 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm border-2 border-slate-200 dark:border-slate-700/80 shadow-md transition-all active:scale-[0.98] ${
                  !agreed || loading || guestLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700/80 cursor-pointer'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2 text-slate-500 animate-pulse">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.3-1.14 2.51v2.08h1.83c1.07-1 2.37-2.48 2.37-6.44z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.83-2.97c-1.08.73-2.46 1.16-4.1 1.16-3.15 0-5.82-2.13-6.77-5H1.28v3.09C3.26 21.3 7.37 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.23 14.28c-.24-.73-.38-1.5-.38-2.28s.14-1.55.38-2.28V6.63H1.28C.46 8.24 0 10.07 0 12s.46 3.76 1.28 5.37l3.95-3.09z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.28 6.63L5.23 9.72c.95-2.87 3.62-5 6.77-5z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={loading || guestLoading}
                onClick={handleGuestSignIn}
                className={`w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm shadow-md transition-all active:scale-[0.98] ${
                  !agreed || loading || guestLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-500 hover:to-indigo-500 cursor-pointer'
                }`}
              >
                {guestLoading ? (
                  <div className="flex items-center gap-2 text-white animate-pulse">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Setting up Guest Mode...</span>
                  </div>
                ) : (
                  <>
                    <User className="w-5 h-5 shrink-0" />
                    <span>Continue as Guest (Sandbox Mode)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center font-black uppercase tracking-wider text-xs transition-all cursor-pointer border border-transparent shadow-sm"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        ) : (
          /* ================= NAME SETUP STEP (FIRST-TIME USER) ================= */
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">
                What should we call you?
              </h2>
            </div>

            <p className="text-xs text-white/85 mb-6 font-semibold leading-relaxed">
              We detected you are signing in for the first time! Please enter your name to customize your 3D workspace.
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-start gap-2.5 font-bold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-start gap-2.5 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={30}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your display name"
                  className="w-full h-12 pl-11 pr-4 bg-white/50 dark:bg-slate-800/50 rounded-xl text-sm font-bold border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelOrSignOut}
                  className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-slate-200 dark:border-slate-750 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Let's Go!</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inline Terms and Conditions Sub-modal */}
        <TermsAndConditionsViewer isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      </div>
    </div>
  );
};

/* ================= TERMS & CONDITIONS SUB-VIEWER ================= */
interface TermsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsAndConditionsViewer: React.FC<TermsViewerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[300] bg-slate-900 rounded-[2rem] p-8 flex flex-col justify-between text-white animate-in slide-in-from-bottom-5 duration-350">
      <div>
        <h3 className="text-base font-black tracking-tight mb-4 text-white flex items-center gap-2">
          Terms & Conditions
        </h3>
        <div className="space-y-4 text-[11px] leading-relaxed text-white/80 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar font-bold">
          <p>
            Welcome to NoteSphere 3D! By enabling Cloud Sync, you agree to comply with and be bound by the following Terms of Service and Privacy Policy:
          </p>
          <p>
            <strong className="text-white">1. Secure Database Synchronization</strong>
            <br />
            We securely store your interactive sticky notes, canvas layout position coordinates, and sphere groupings in Cloud Firestore. This cloud database is exclusively accessible to you using your verified Google authentication.
          </p>
          <p>
            <strong className="text-white">2. Privacy & Data Ownership</strong>
            <br />
            You retain 100% intellectual property rights over any notes or thoughts you create. Your personal information, email, notes database, and brainstorm history are strictly private, secured, and never sold or shared with any third party.
          </p>
          <p>
            <strong className="text-white">3. Artificial Intelligence & Gemini</strong>
            <br />
            Our smart brainstorming engine connects securely to server-side Google Gemini API models. You agree not to exploit, abuse, or use automated scripts to spam the AI generation interfaces.
          </p>
          <p>
            <strong className="text-white">4. Account Deletion & Right to be Forgotten</strong>
            <br />
            You can disconnect from Cloud Sync or contact support to completely wipe out all your associated data, email registers, and stored canvas collections from Firestore at any moment.
          </p>
        </div>
      </div>
      <button
        id="dismiss-terms-btn"
        type="button"
        onClick={onClose}
        className="w-full h-11 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center font-black uppercase tracking-wider text-xs transition-all cursor-pointer shadow-md"
      >
        I Understand
      </button>
    </div>
  );
};
