import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '../lib/firebase';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Plus, Users, KeyRound, Ban, CheckCircle, Copy, Check } from 'lucide-react';

const ADMIN_EMAIL = 'bodybalanceapp@gmail.com';

interface InviteCode {
  code: string;
  label: string;
  createdAt: string;
  usedBy: string | null;
  usedAt: string | null;
  usedEmail?: string;
}

interface AppUser {
  userId: string;
  email: string;
  name: string;
  disabled: boolean;
  lastLogin?: string;
}

export function isAdmin(): boolean {
  return auth.currentUser?.email === ADMIN_EMAIL;
}

export function Admin() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadCodes(), loadUsers()]);
    setIsLoading(false);
  };

  const loadCodes = async () => {
    try {
      const snap = await getDocs(collection(firestore, 'inviteCodes'));
      const items: InviteCode[] = [];
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          code: d.id,
          label: data.label || '',
          createdAt: data.createdAt || '',
          usedBy: data.usedBy || null,
          usedAt: data.usedAt || null,
          usedEmail: data.usedEmail || '',
        });
      });
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setCodes(items);
    } catch (err) {
      console.warn('[Admin] Load codes failed:', err);
    }
  };

  const loadUsers = async () => {
    try {
      // Lees alle user profiles uit Firestore
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const items: AppUser[] = [];
      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        try {
          const profileSnap = await getDocs(collection(firestore, 'users', userId, 'profile'));
          for (const pDoc of profileSnap.docs) {
            const data = pDoc.data();
            items.push({
              userId,
              email: data.email || '',
              name: data.name || 'Onbekend',
              disabled: data.disabled === true,
              lastLogin: data.updatedAt || '',
            });
          }
        } catch {
          // Skip users without profile
        }
      }
      setUsers(items);
    } catch (err) {
      console.warn('[Admin] Load users failed:', err);
    }
  };

  const generateCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleCreateCode = async () => {
    const code = generateCode();
    try {
      await setDoc(doc(firestore, 'inviteCodes', code), {
        label: newLabel.trim() || '',
        createdAt: new Date().toISOString(),
        usedBy: null,
        usedAt: null,
        usedEmail: null,
      });
      setNewLabel('');
      await loadCodes();
    } catch (err) {
      console.warn('[Admin] Create code failed:', err);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleToggleUser = async (user: AppUser) => {
    try {
      const ref = doc(firestore, 'users', user.userId, 'profile', 'data');
      await updateDoc(ref, { disabled: !user.disabled });
      setUsers(users.map((u) =>
        u.userId === user.userId ? { ...u, disabled: !u.disabled } : u
      ));
    } catch (err) {
      console.warn('[Admin] Toggle user failed:', err);
    }
  };

  const unusedCodes = codes.filter((c) => !c.usedBy);
  const usedCodes = codes.filter((c) => c.usedBy);

  return (
    <PageLayout title="Admin">
      <div className="flex flex-col gap-4">
        {/* Terug knop */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-primary text-[15px] font-medium bg-transparent border-none cursor-pointer p-0"
        >
          <ArrowLeft size={18} />
          Terug naar profiel
        </button>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Invite codes aanmaken */}
            <Card>
              <div className="px-4 py-3 border-b border-ios-separator flex items-center gap-2">
                <KeyRound size={18} className="text-primary" />
                <span className="text-[15px] font-semibold">Invite Codes</span>
              </div>
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label (bijv. naam)"
                    className="flex-1 bg-ios-bg rounded-xl px-4 py-2.5 text-[15px] border border-ios-separator"
                  />
                  <Button onClick={handleCreateCode} className="flex items-center gap-1.5">
                    <Plus size={16} />
                    Maak code
                  </Button>
                </div>

                {/* Ongebruikte codes */}
                {unusedCodes.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide mb-2">
                      Beschikbaar ({unusedCodes.length})
                    </p>
                    {unusedCodes.map((c) => (
                      <div key={c.code} className="flex items-center justify-between py-2 border-b border-ios-separator last:border-b-0">
                        <div>
                          <span className="text-[17px] font-mono font-bold tracking-wider">{c.code}</span>
                          {c.label && <span className="text-[13px] text-ios-secondary ml-2">{c.label}</span>}
                        </div>
                        <button
                          onClick={() => handleCopyCode(c.code)}
                          className="flex items-center gap-1 text-primary text-[13px] font-medium bg-transparent border-none cursor-pointer p-1"
                        >
                          {copiedCode === c.code ? <Check size={14} /> : <Copy size={14} />}
                          {copiedCode === c.code ? 'Gekopieerd' : 'Kopieer'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gebruikte codes */}
                {usedCodes.length > 0 && (
                  <div>
                    <p className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide mb-2">
                      Gebruikt ({usedCodes.length})
                    </p>
                    {usedCodes.map((c) => (
                      <div key={c.code} className="flex items-center justify-between py-2 border-b border-ios-separator last:border-b-0 opacity-50">
                        <div>
                          <span className="text-[15px] font-mono line-through">{c.code}</span>
                          {c.usedEmail && <span className="text-[13px] text-ios-secondary ml-2">{c.usedEmail}</span>}
                          {!c.usedEmail && c.label && <span className="text-[13px] text-ios-secondary ml-2">{c.label}</span>}
                        </div>
                        <span className="text-[12px] text-ios-secondary">
                          {c.usedAt ? new Date(c.usedAt).toLocaleDateString('nl-NL') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {codes.length === 0 && (
                  <p className="text-[15px] text-ios-secondary text-center py-4">
                    Nog geen codes aangemaakt
                  </p>
                )}
              </div>
            </Card>

            {/* Gebruikers */}
            <Card>
              <div className="px-4 py-3 border-b border-ios-separator flex items-center gap-2">
                <Users size={18} className="text-primary" />
                <span className="text-[15px] font-semibold">Gebruikers ({users.length})</span>
              </div>
              {users.length > 0 ? (
                <div>
                  {users.map((user, i) => (
                    <div
                      key={user.userId}
                      className={`flex items-center justify-between px-4 py-3 ${
                        i < users.length - 1 ? 'border-b border-ios-separator' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-medium truncate">
                          {user.name}
                          {user.disabled && <span className="text-ios-destructive ml-1">(geblokkeerd)</span>}
                        </div>
                        <div className="text-[13px] text-ios-secondary truncate">{user.email}</div>
                      </div>
                      {user.email !== ADMIN_EMAIL && (
                        <button
                          onClick={() => handleToggleUser(user)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border-none cursor-pointer ${
                            user.disabled
                              ? 'bg-primary/10 text-primary'
                              : 'bg-ios-destructive/10 text-ios-destructive'
                          }`}
                        >
                          {user.disabled ? (
                            <><CheckCircle size={14} /> Activeer</>
                          ) : (
                            <><Ban size={14} /> Blokkeer</>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] text-ios-secondary text-center py-8">
                  Nog geen gebruikers
                </p>
              )}
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
}
