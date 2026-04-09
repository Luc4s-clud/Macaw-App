import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const phoneOk = (s: string) => {
  const t = s.trim();
  if (t.length === 0) return true;
  return /^[\d\s+().-]{7,20}$/.test(t);
};

export default function SignInPage() {
  const navigate = useNavigate();
  const {
    firebaseReady,
    user,
    profile,
    signInWithGoogle,
    signInWithFacebook,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    sendVerificationEmail,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSocial(
    fn: () => Promise<void>,
    label: string
  ) {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await fn();
      navigate('/');
    } catch (e: unknown) {
      const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      if (code === 'auth/popup-closed-by-user') {
        setError(null);
      } else {
        setError(
          e instanceof Error ? e.message : `Não foi possível conectar com ${label}.`
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
      navigate('/');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'code' in e
          ? mapAuthError((e as { code: string }).code)
          : 'E-mail ou senha inválidos.';
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
      setError('Informe o nome completo.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== password2) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!phoneOk(phone)) {
      setError('Telefone inválido (use apenas números e símbolos comuns).');
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
        'Conta criada. Enviamos um e-mail de verificação — confira a caixa de entrada (e o spam). O telefone foi salvo no perfil; não enviamos SMS.'
      );
      navigate('/');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'code' in e
          ? mapAuthError((e as { code: string }).code)
          : 'Não foi possível criar a conta.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseReady) {
    return (
      <section className="max-w-lg mx-auto px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 text-sm space-y-2">
          <p className="font-semibold">Firebase não configurado</p>
          <p>
            Adicione as variáveis <code className="bg-amber-100/80 px-1 rounded">VITE_FIREBASE_*</code> no{' '}
            <code className="bg-amber-100/80 px-1 rounded">.env</code> do frontend (veja{' '}
            <code className="bg-amber-100/80 px-1 rounded">.env.example</code>). No Console do Firebase:
            ative Authentication (Google, Facebook, E-mail/senha) e crie o Firestore com regras que
            permitam cada usuário ler/escrever apenas <code className="bg-amber-100/80 px-1 rounded">users/&#123;uid&#125;</code>.
          </p>
        </div>
      </section>
    );
  }

  if (user) {
    return (
      <section className="max-w-lg mx-auto px-4 py-12 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-4">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Sessão ativa</h1>
          <p className="text-slate-600 text-sm">
            <span className="font-medium text-slate-800">
              {profile?.fullName || user.displayName || 'Usuário'}
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
                Tel.: {profile.phone}
              </>
            ) : null}
          </p>
          {!user.emailVerified && user.email && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              E-mail ainda não verificado.{' '}
              <button
                type="button"
                className="font-semibold text-primary underline"
                onClick={() => {
                  void sendVerificationEmail().then(() =>
                    setInfo('Link de verificação enviado novamente.')
                  );
                }}
              >
                Reenviar link
              </button>
            </p>
          )}
          {info && <p className="text-sm text-emerald-700">{info}</p>}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/menu"
              className="inline-flex rounded-full bg-primary text-white px-5 py-2 text-sm font-semibold hover:bg-primaryDark transition-colors"
            >
              Ver cardápio
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 shadow-lg shadow-primary/5 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Entrar ou criar conta</h1>
          <p className="text-sm text-slate-600">
            Google, Facebook ou e-mail. Cadastro com nome e telefone opcional —{' '}
            <strong className="text-slate-800">sem SMS</strong>; verificação só por e-mail.
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
            Entrar
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
            Cadastrar
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
            Continuar com Google
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSocial(signInWithFacebook, 'Facebook')}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-[#1877F2] py-3 text-sm font-semibold text-white hover:bg-[#166FE5] disabled:opacity-60"
          >
            Continuar com Facebook
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-white px-2 text-slate-500">ou e-mail</span>
          </div>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="si-email" className="block text-xs font-medium text-slate-600 mb-1">
                E-mail
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
                Senha
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
              {busy ? '…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-slate-600 mb-1">
                Nome completo
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
                E-mail
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
                Telefone <span className="text-slate-400 font-normal">(opcional, sem verificação SMS)</span>
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
                Senha (mín. 6 caracteres)
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
                Confirmar senha
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
              {busy ? '…' : 'Criar conta'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function mapAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Este e-mail já está em uso.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/weak-password': 'Senha muito fraca.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/popup-blocked': 'Pop-up bloqueado. Permita pop-ups para este site.',
    'auth/account-exists-with-different-credential':
      'Já existe uma conta com este e-mail usando outro método de login.',
  };
  return map[code] ?? 'Erro de autenticação. Tente novamente.';
}
