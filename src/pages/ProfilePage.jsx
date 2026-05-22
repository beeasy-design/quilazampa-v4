import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { PawPrint, Shield, ChevronRight, Bell, Settings, Edit3, Plus, LogOut, Crown, X, Check, Heart, MessageCircle } from 'lucide-react'

const TRAITS = ['Socievole', 'Energico', 'Tranquillo', 'Giocoso', 'Timido', 'Protettivo', 'Curioso', 'Indipendente']

function NotificationsSettings({ onClose }) {
  const [settings, setSettings] = useState({
    newDogInArea: true, eventNearby: true, friendRequest: true, checkinAlert: false
  })
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onClose}><X className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900">Notifiche</h2>
      </div>
      <div className="p-4 space-y-2">
        {[
          { key: 'newDogInArea', label: 'Nuovo cane in area preferita', sub: 'Avvisami quando un cane arriva' },
          { key: 'eventNearby', label: 'Evento vicino a te', sub: 'Raduni e passeggiate nella zona' },
          { key: 'friendRequest', label: 'Richiesta di amicizia', sub: 'Quando un cane ti invia richiesta' },
          { key: 'checkinAlert', label: 'Check-in automatico', sub: 'Suggerisci check-in quando sei in area' },
        ].map(item => (
          <div key={item.key} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-semibold text-sm text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
            <button onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key] }))}
              className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${settings[item.key] ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${settings[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PrivacySettings({ onClose }) {
  const [settings, setSettings] = useState({ invisibleMode: false, showLocation: true, publicProfile: true })
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onClose}><X className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900">Privacy</h2>
      </div>
      <div className="p-4 space-y-2">
        {[
          { key: 'invisibleMode', label: 'Modalità invisibile globale', sub: 'Non apparire nelle aree cani' },
          { key: 'showLocation', label: 'Mostra posizione', sub: 'Condividi posizione durante check-in' },
          { key: 'publicProfile', label: 'Profilo pubblico', sub: 'Gli altri possono vedere il tuo cane' },
        ].map(item => (
          <div key={item.key} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-semibold text-sm text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
            <button onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key] }))}
              className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${settings[item.key] ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${settings[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AccountSettings({ onClose, profile, user }) {
  const [username, setUsername] = useState(profile?.username || '')
  const [city, setCity] = useState(profile?.city || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ username, city }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onClose}><X className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900">Impostazioni account</h2>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Città</label>
            <input value={city} onChange={e => setCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Email</label>
            <input value={user?.email || ''} disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-500" />
          </div>
          <button onClick={save} disabled={saving}
            className="w-full text-white font-bold py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: saved ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#F97316,#EA580C)' }}>
            {saved ? <><Check className="w-4 h-4" /> Salvato!</> : saving ? '...' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FriendsPage({ dogs, onClose, onChat }) {
  const { user } = useAuth()
  const [friendships, setFriendships] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchFriendships() }, [])

  const fetchFriendships = async () => {
    if (!dogs.length) { setLoading(false); return }
    const dogIds = dogs.map(d => d.id)
    const { data } = await supabase.from('dog_friendships')
      .select(`
        id, status, created_by,
        dog1:dog_id_1(id, name, breed, age, owner_id, profiles(username)),
        dog2:dog_id_2(id, name, breed, age, owner_id, profiles(username))
      `)
      .or(`dog_id_1.in.(${dogIds.join(',')}),dog_id_2.in.(${dogIds.join(',')})`)

    const accepted = (data || []).filter(f => f.status === 'accepted')
    const pend = (data || []).filter(f => f.status === 'pending')
    setFriendships(accepted)
    setPending(pend)
    setLoading(false)
  }

  const acceptFriend = async (id) => {
    await supabase.from('dog_friendships').update({ status: 'accepted' }).eq('id', id)
    fetchFriendships()
  }

  const rejectFriend = async (id) => {
    await supabase.from('dog_friendships').delete().eq('id', id)
    fetchFriendships()
  }

  const getFriendDog = (friendship) => {
    const myDogIds = dogs.map(d => d.id)
    if (myDogIds.includes(friendship.dog1?.id)) return friendship.dog2
    return friendship.dog1
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onClose}><X className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900">Amici cani</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Richieste in sospeso */}
        {pending.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-2">Richieste ricevute ({pending.length})</h3>
            {pending.filter(f => f.created_by !== user?.id).map(f => {
              const friendDog = getFriendDog(f)
              return (
                <div key={f.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm mb-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">🐕</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">{friendDog?.name}</p>
                    <p className="text-xs text-gray-500">{friendDog?.profiles?.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptFriend(f.id)}
                      className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button onClick={() => rejectFriend(f.id)}
                      className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Amici */}
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-2">I tuoi amici cani ({friendships.length})</h3>
          {loading && <p className="text-sm text-gray-500 text-center py-4">Caricamento...</p>}
          {!loading && friendships.length === 0 && (
            <div className="text-center py-8 bg-white rounded-2xl">
              <div className="text-4xl mb-2">🐾</div>
              <p className="text-sm text-gray-600">Nessun amico ancora</p>
              <p className="text-xs text-gray-400 mt-1">Vai in un parco e aggiungi i cani che incontri!</p>
            </div>
          )}
          {friendships.map(f => {
            const friendDog = getFriendDog(f)
            return (
              <div key={f.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm mb-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">🐕</div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{friendDog?.name}</p>
                  <p className="text-xs text-gray-500">{friendDog?.breed} • {friendDog?.profiles?.username}</p>
                </div>
                <button onClick={() => onChat(friendDog?.owner_id)}
                  className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage({ onAddDog, onAdminPanel, onChat }) {
  const { user, profile, dogs, isAdmin, signOut, refreshDogs } = useAuth()
  const [editingDog, setEditingDog] = useState(null)
  const [saving, setSaving] = useState(false)
  const [subPage, setSubPage] = useState(null) // null | 'notifications' | 'privacy' | 'settings' | 'friends'

  const updateDog = async (id, updates) => {
    setSaving(true)
    await supabase.from('dogs').update(updates).eq('id', id)
    refreshDogs()
    setEditingDog(null)
    setSaving(false)
  }

  const deleteDog = async (id) => {
    if (!confirm('Rimuovere questo cane?')) return
    await supabase.from('dogs').delete().eq('id', id)
    refreshDogs()
  }

  if (subPage === 'notifications') return <NotificationsSettings onClose={() => setSubPage(null)} />
  if (subPage === 'privacy') return <PrivacySettings onClose={() => setSubPage(null)} />
  if (subPage === 'settings') return <AccountSettings onClose={() => setSubPage(null)} profile={profile} user={user} />
  if (subPage === 'friends') return <FriendsPage dogs={dogs} onClose={() => setSubPage(null)} onChat={(id) => { setSubPage(null); onChat && onChat(id) }} />

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 text-base text-center">Profilo</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-4 pt-5 pb-4 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
          <div className="absolute -right-6 -top-6 text-9xl opacity-10">🐾</div>
          <div className="flex items-center gap-3 relative">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl border-2 border-white/40">
              {isAdmin ? '👑' : '👤'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">{profile?.username || user?.email?.split('@')[0]}</h2>
                {isAdmin && <Crown className="w-4 h-4 text-yellow-300" fill="#fde68a" />}
              </div>
              <p className="text-xs text-blue-100">{profile?.city || 'Città non impostata'}</p>
              <p className="text-xs text-blue-200">{user?.email}</p>
            </div>
            <button onClick={() => setSubPage('settings')}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin panel */}
        {isAdmin && (
          <div className="px-4 mt-3">
            <button onClick={onAdminPanel}
              className="w-full text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
              <Crown className="w-5 h-5" /> Pannello Admin
            </button>
          </div>
        )}

        {/* Cani */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-sm">I miei cani</h3>
            <button onClick={onAddDog} className="flex items-center gap-1 text-xs text-orange-600 font-bold">
              <Plus className="w-4 h-4" /> Aggiungi
            </button>
          </div>
          {dogs.length === 0 ? (
            <button onClick={onAddDog} className="w-full bg-white border-2 border-dashed border-orange-300 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-orange-50">
              <div className="text-4xl">🐕</div>
              <p className="font-semibold text-gray-700 text-sm">Aggiungi il tuo primo cane</p>
            </button>
          ) : (
            <div className="space-y-3">
              {dogs.map(dog => (
                <div key={dog.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {editingDog === dog.id ? (
                    <DogEditForm dog={dog} onSave={u => updateDog(dog.id, u)} onCancel={() => setEditingDog(null)} saving={saving} />
                  ) : (
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #FED7AA, #FB923C)' }}>🐕</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg text-gray-900">{dog.name}</h3>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingDog(dog.id)} className="text-orange-500 text-xs font-bold">MODIFICA</button>
                            <button onClick={() => deleteDog(dog.id)} className="text-red-400 text-xs font-bold">RIMUOVI</button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{dog.breed || 'Razza sconosciuta'} • {dog.age ? dog.age + ' anni' : ''} • {dog.gender === 'M' ? '♂' : '♀'}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {dog.size && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Taglia {dog.size}</span>}
                          {dog.energy && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Energia {dog.energy}</span>}
                          {(dog.traits || []).slice(0, 2).map((t, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu impostazioni */}
        <div className="px-4 mt-4 mb-4">
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            {[
              { icon: Heart, label: 'Amici cani', sub: `${dogs.length > 0 ? 'Gestisci amicizie' : 'Aggiungi un cane prima'}`, action: 'friends', color: '#EF4444' },
              { icon: Bell, label: 'Notifiche', sub: 'Personalizza avvisi', action: 'notifications', color: '#F97316' },
              { icon: Shield, label: 'Privacy', sub: 'Modalità invisibile, dati', action: 'privacy', color: '#3B82F6' },
              { icon: Settings, label: 'Impostazioni', sub: 'Account, username, città', action: 'settings', color: '#8B5CF6' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <button key={i} onClick={() => setSubPage(item.action)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 active:bg-gray-100">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: item.color + '15' }}>
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-[10px] text-gray-500">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              )
            })}
            <button onClick={signOut} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-sm font-semibold text-red-600">Esci dall'account</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DogEditForm({ dog, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ name: dog.name || '', breed: dog.breed || '', age: dog.age || '', gender: dog.gender || 'M', size: dog.size || 'Media', energy: dog.energy || 'Media', traits: dog.traits || [] })
  const toggle = (t) => setForm(f => ({ ...f, traits: f.traits.includes(t) ? f.traits.filter(x => x !== t) : [...f.traits, t] }))
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1">Nome</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1">Razza</label>
          <input value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-600 block mb-1">Carattere</label>
        <div className="flex flex-wrap gap-1">
          {TRAITS.map(t => (
            <button key={t} type="button" onClick={() => toggle(t)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold ${form.traits.includes(t) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} disabled={saving}
          className="flex-1 py-2 rounded-xl text-white text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #84CC16, #65A30D)' }}>
          {saving ? '...' : 'Salva'}
        </button>
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Annulla</button>
      </div>
    </div>
  )
}
