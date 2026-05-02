import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const phoneOk = (s: string) => {
  const t = s.trim();
  if (t.length === 0) return true;
  return /^[\d\s+().-]{7,20}$/.test(t);
};

export default function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    firebaseReady,
    user,
    profile,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    sendVerificationEmail,
  } = useAuth();

  const modeParam = searchParams.get('mode');
  const promoParam = searchParams.get('promo');
  const hasFirstOrderPromo = promoParam === 'first-order-30';
  const targetPathAfterAuth = useMemo(
    () => (hasFirstOrderPromo ? '/menu?promo=first-order-30' : '/'),
    [hasFirstOrderPromo]
  );

  const [mode, setMode] = useState<'login' | 'register'>(
    modeParam === 'register' || modeParam === 'signup' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (modeParam === 'register' || modeParam === 'signup') {
      setMode('register');
    } else if (modeParam === 'login') {
      setMode('login');
    }
  }, [modeParam]);

  async function handleSocial(
    fn: () => Promise<void>,
    label: string
  ) {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await fn();
      navigate(targetPathAfterAuth);
    } catch (e: unknown) {
      const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      if (code === 'auth/popup-closed-by-user') {
        setError(null);
      } else if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        setInfo('Your browser blocked popup login. We are redirecting to continue secure sign-in...');
      } else if (code) {
        setError(mapAuthError(code));
      } else {
        setError(
          e instanceof Error ? e.message : `Could not connect with ${label}.`
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await signInWithEmail(email.trim(), password);
      navigate(targetPathAfterAuth);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'code' in e
          ? mapAuthError((e as { code: string }).code)
          : 'Invalid email or password.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    if (!phoneOk(phone)) {
      setError('Invalid phone number (use only numbers and common symbols).');
      return;
    }
    setBusy(true);
    try {
      await signUpWithEmail({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      setInfo(
        'Account created. We sent a verification email - please check your inbox (and spam). Your phone was saved in the profile; no SMS is sent.'
      );
      navigate(targetPathAfterAuth);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'code' in e
          ? mapAuthError((e as { code: string }).code)
          : 'Could not create account.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseReady) {
    return (
      <section className="max-w-lg mx-auto px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 text-sm space-y-2">
          <p className="font-semibold">Firebase not configured</p>
          <p>
            Add <code className="bg-amber-100/80 px-1 rounded">VITE_FIREBASE_*</code> variables to the frontend{' '}
            <code className="bg-amber-100/80 px-1 rounded">.env</code> file (see{' '}
            <code className="bg-amber-100/80 px-1 rounded">.env.example</code>). In Firebase Console:
            enable Authentication (Google and email/password) and create Firestore rules that
            allow each user to read/write only <code className="bg-amber-100/80 px-1 rounded">users/&#123;uid&#125;</code>.
          </p>
        </div>
      </section>
    );
  }

  if (user) {
    return (
      <section className="max-w-lg mx-auto px-4 py-12 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-4">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Active session</h1>
          <p className="text-slate-600 text-sm">
            <span className="font-medium text-slate-800">
              {profile?.fullName || user.displayName || 'User'}
            </span>
            {user.email && (
              <>
                <br />
                {user.email}
              </>
            )}
            {profile?.phone ? (
              <>
                <br />
                Phone: {profile.phone}
              </>
            ) : null}
          </p>
          {!user.emailVerified && user.email && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              Email not verified yet.{' '}
              <button
                type="button"
                className="font-semibold text-primary underline"
                onClick={() => {
                  void sendVerificationEmail().then(() =>
                    setInfo('Verification link sent again.')
                  );
                }}
              >
                Resend link
              </button>
            </p>
          )}
          {info && <p className="text-sm text-emerald-700">{info}</p>}
          {hasFirstOrderPromo && (
            <p className="text-sm rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-primaryDark">
              Great news: your first order is eligible for 30% off after sign in.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/menu"
              className="inline-flex rounded-full bg-primary text-white px-5 py-2 text-sm font-semibold hover:bg-primaryDark transition-colors"
            >
              View menu
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 shadow-lg shadow-primary/5 p-6 sm:p-8 space-y-6">
        {hasFirstOrderPromo && (
          <div className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primaryDark">
            Sign in or create your account to unlock <strong>30% off on your first order</strong>.
          </div>
        )}
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Sign in or create account</h1>
          <p className="text-sm text-slate-600">
            Continue with Google or email. Sign up with your name and an optional phone number. Verification is by email only.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-slate-600'
            }`}
          >
            Register
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSocial(signInWithGoogle, 'Google')}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            <span className="text-lg" aria-hidden>
              G
            </span>
            Continue with Google
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-white px-2 text-slate-500">or email</span>
          </div>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="si-email" className="block text-xs font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                id="si-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label htmlFor="si-pass" className="block text-xs font-medium text-slate-600 mb-1">
                Password
              </label>
              <input
                id="si-pass"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary text-white py-3 text-sm font-semibold hover:bg-primaryDark disabled:opacity-60"
            >
              {busy ? '…' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-slate-600 mb-1">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-medium text-slate-600 mb-1">
                Phone <span className="text-slate-400 font-normal">(optional, no SMS verification)</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label htmlFor="reg-pass" className="block text-xs font-medium text-slate-600 mb-1">
                Password (min. 6 characters)
              </label>
              <input
                id="reg-pass"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label htmlFor="reg-pass2" className="block text-xs font-medium text-slate-600 mb-1">
                Confirm password
              </label>
              <input
                id="reg-pass2"
                type="password"
                autoComplete="new-password"
                required
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary text-white py-3 text-sm font-semibold hover:bg-primaryDark disabled:opacity-60"
            >
              {busy ? '…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function mapAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already in use.',
    'auth/invalid-email': 'Invalid email.',
    'auth/weak-password': 'Password is too weak.',
    'auth/user-not-found': 'User not found.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/popup-blocked': 'Popup blocked. Please allow popups for this site.',
    'auth/operation-not-allowed':
      'This sign-in method is not enabled in Firebase Authentication yet.',
    'auth/unauthorized-domain':
      'This domain is not authorized in Firebase Authentication.',
    'auth/cancelled-popup-request':
      'Login popup was interrupted. Please try again.',
    'auth/operation-not-supported-in-this-environment':
      'This browser does not support popup login. We can continue with redirect.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using another sign-in method.',
  };
  return map[code] ?? 'Authentication error. Please try again.';
}
