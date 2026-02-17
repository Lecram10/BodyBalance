import { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuthStore } from '../store/auth-store';
import { Button } from '../components/ui/Button';
import { Scale, Mail, Lock, Eye, EyeOff, Ticket } from 'lucide-react';

type Mode = 'login' | 'register';

export function Login() {
  const { login, register, error, clearError, isAuthLoading } = useAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    clearError();
    setLocalError('');
    setPassword('');
    setConfirmPassword('');
    setInviteCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password) {
      setLocalError('Vul je e-mailadres en wachtwoord in');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setLocalError('Wachtwoord moet minimaal 6 tekens zijn');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Wachtwoorden komen niet overeen');
        return;
      }
      if (!inviteCode.trim()) {
        setLocalError('Vul een invite code in');
        return;
      }
    }

    setIsSubmitting(true);
    if (mode === 'login') {
      await login(email.trim(), password);
    } else {
      // Valideer invite code
      try {
        const codeRef = doc(firestore, 'inviteCodes', inviteCode.trim().toUpperCase());
        const codeSnap = await getDoc(codeRef);
        if (!codeSnap.exists()) {
          setLocalError('Ongeldige invite code');
          setIsSubmitting(false);
          return;
        }
        if (codeSnap.data().usedBy) {
          setLocalError('Deze invite code is al gebruikt');
          setIsSubmitting(false);
          return;
        }

        // Code is geldig → registreer
        await register(email.trim(), password);

        // Markeer code als gebruikt (fire-and-forget)
        const { currentUser } = await import('../lib/firebase').then((m) => m.auth);
        if (currentUser) {
          updateDoc(codeRef, {
            usedBy: currentUser.uid,
            usedEmail: email.trim(),
            usedAt: new Date().toISOString(),
          }).catch(() => {});
        }
      } catch {
        setLocalError('Kon invite code niet controleren. Probeer opnieuw.');
        setIsSubmitting(false);
        return;
      }
    }
    setIsSubmitting(false);
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col h-full bg-ios-bg" style={{ paddingTop: 'var(--safe-area-top)' }}>
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-8">
        <div className="w-20 h-20 rounded-[28px] bg-primary flex items-center justify-center mb-6 shadow-lg">
          <Scale size={40} color="white" />
        </div>
        <h1 className="text-[34px] font-bold text-ios-text mb-1">BodyBalance</h1>
        <p className="text-[15px] text-ios-secondary text-center">
          {mode === 'login' ? 'Log in om verder te gaan' : 'Maak een account aan'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-6 flex flex-col gap-4">
        {/* Email */}
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-secondary" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mailadres"
            autoComplete="email"
            className="w-full bg-white rounded-xl py-3.5 pl-12 pr-4 text-[17px] text-ios-text border border-ios-separator placeholder:text-ios-secondary/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-secondary" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wachtwoord"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full bg-white rounded-xl py-3.5 pl-12 pr-12 text-[17px] text-ios-text border border-ios-separator placeholder:text-ios-secondary/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0"
          >
            {showPassword
              ? <EyeOff size={18} className="text-ios-secondary" />
              : <Eye size={18} className="text-ios-secondary" />}
          </button>
        </div>

        {/* Confirm password + invite code (register only) */}
        {mode === 'register' && (
          <>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Wachtwoord bevestigen"
                autoComplete="new-password"
                className="w-full bg-white rounded-xl py-3.5 pl-12 pr-4 text-[17px] text-ios-text border border-ios-separator placeholder:text-ios-secondary/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>
            <div className="relative">
              <Ticket size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-secondary" />
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Invite code"
                autoComplete="off"
                className="w-full bg-white rounded-xl py-3.5 pl-12 pr-4 text-[17px] text-ios-text border border-ios-separator placeholder:text-ios-secondary/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors font-mono tracking-wider"
              />
            </div>
          </>
        )}

        {/* Error */}
        {displayError && (
          <div className="bg-ios-destructive/10 text-ios-destructive text-[14px] rounded-xl px-4 py-3 text-center font-medium">
            {displayError}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={isSubmitting || isAuthLoading}
        >
          {isSubmitting
            ? (mode === 'login' ? 'Inloggen...' : 'Account aanmaken...')
            : (mode === 'login' ? 'Inloggen' : 'Account aanmaken')}
        </Button>

        {/* Switch mode */}
        <div className="text-center pt-2">
          {mode === 'login' ? (
            <p className="text-[15px] text-ios-secondary">
              Nog geen account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-primary font-semibold bg-transparent border-none cursor-pointer p-0"
              >
                Registreren
              </button>
            </p>
          ) : (
            <p className="text-[15px] text-ios-secondary">
              Al een account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-primary font-semibold bg-transparent border-none cursor-pointer p-0"
              >
                Inloggen
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
