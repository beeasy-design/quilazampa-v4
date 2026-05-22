import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ChevronLeft, PawPrint, Star, MessageCircle, Info, X, ChevronRight } from 'lucide-react'

function calcCompat(a, b) {
  if (!a || !b) return 50
  let s = 50
  if (a.size === b.size) s += 10
  const em = { Bassa: 1, Media: 2, Alta: 3 }
  const d = Math.abs((em[a.energy] || 2) - (em[b.energy] || 2))
  s += d === 0 ? 15 : d === 1 ? 7 : 0
  const common = (a.traits || []).filter(t => (b.traits || []).includes(t))
  s += Math.min(common.length * 5, 25)
  return Math.min(s, 99)
}

const EMOJIS = ['🐕', '🐶', '🦮', '🐕‍🦺', '🐩', '🦴']

function DogProfileModal({ dog, compat, onClose, onChat }) {
  const compatColor = compat >= 75 ? '#10B981' : compat >= 60 ? '#F97316' : '#EF4444'
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
      <div className="bg-white w-full max-w-sm rounded-t-3xl p-6" style={{ maxHeight:'80vh',overflowY:'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-xl text-gray-900">Profilo cane</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="text-center mb-4">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-4xl mx-auto mb-2">🐕</div>
          <h3 className="font-black text-xl text-gray-900">{dog.name}</h3>
          <p className="text-gray-600 text-sm">{dog.breed} {dog.age ? '• ' + dog.age + ' anni' : ''} • {dog.gender === 'M' ? '♂' : '♀'}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 text-center">
          <div className="text-3xl font-black mb-1" style={{ color: compatColor }}>{compat}%</div>
          <p className="text-sm text-gray-600">Compatibilità</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="h-2 rounded-full" style={{ width:`${compat}%`, background:compatColor }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(dog.traits||[]).map((t,i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">{t}</span>
          ))}
        </div>
        <button onClick={() => onChat(dog.owner_id)}
          className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
          style={{ background:'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
          <MessageCircle className="w-5 h-5" /> Scrivi al proprietario
        </button>
      </div>
    </div>
  )
}

function SelectDogModal({ dogs, onSelect, onClose }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
      <div className="bg-white w-full max-w-sm rounded-t-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-lg text-gray-900">Con quale cane sei qui?</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          {dogs.map((dog, i) => (
            <button key={dog.id} onClick={() => onSelect(dog)}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-orange-50 active:scale-95 text-left">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">{EMOJIS[i%EMOJIS.length]}</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{dog.name}</p>
                <p className="text-xs text-gray-500">{dog.breed}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AreaPage({ area, onBack, onChat }) {
  const { user, dogs } = useAuth()
  const [activeDog, setActiveDog] = useState(dogs[0] || null)
  const [present, setPresent] = useState([])
  const [checkins, setCheckins] = useState([]) // checkin attivi dei miei cani in quest'area
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedDog, setSelectedDog] = useState(null)
  const [showDogSelect, setShowDogSelect] = useState(false)

  useEffect(() => {
    fetchAll()
    const ch = supabase.channel(`area-${area.id}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'checkins', filter:`area_id=eq.${area.id}` }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [area.id])

  const fetchAll = async () => {
    // Carica TUTTI i cani presenti nell'area
    const { data } = await supabase
      .from('checkins')
      .select('id, dog_id, checked_in_at, dogs(id, name, breed, age, gender, size, energy, traits, owner_id)')
      .eq('area_id', area.id)
      .eq('active', true)
    setPresent(data || [])

    // Trova i miei check-in attivi in quest'area
    if (dogs.length > 0) {
      const myDogIds = dogs.map(d => d.id)
      const mine = (data || []).filter(c => myDogIds.includes(c.dog_id))
      setCheckins(mine)
    }
    setLoading(false)
  }

  const isMyDog = (dogId) => dogs.some(d => d.id === dogId)

  const handleCheckinPress = () => {
    if (dogs.length === 0) return
    if (dogs.length === 1) {
      handleCheckin(dogs[0])
    } else {
      setShowDogSelect(true)
    }
  }

  const handleCheckin = async (dog) => {
    if (!dog) return
    setBusy(true)
    setShowDogSelect(false)
    setActiveDog(dog)

    // Controlla se questo cane e' gia' in check-in in quest'area
    const existing = checkins.find(c => c.dog_id === dog.id)
    if (existing) {
      // Checkout
      await supabase.from('checkins')
        .update({ active: false, checked_out_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      // Check-in (NON fa checkout da altre aree - cosi' piu' cani possono essere in aree diverse)
      await supabase.from('checkins')
        .insert({ dog_id: dog.id, area_id: area.id, active: true })
    }
    await fetchAll()
    setBusy(false)
  }

  const elapsed = (ts) => {
    const m = Math.floor((Date.now() - new Date(ts)) / 60000)
    return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`
  }

  const myDogInArea = dogs.find(d => checkins.some(c => c.dog_id === d.id))

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={onBack}><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="text-center flex-1 mx-2">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="font-bold text-sm text-gray-900 truncate">{area.name}</h2>
            {area.fenced && <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">REC.</span>}
          </div>
          <p className="text-[10px] text-gray-500">{present.length} cani • {area.city}</p>
        </div>
        <Star className="w-6 h-6 text-gray-400" />
      </div>

      <div className="bg-white flex border-b border-gray-200">
        <button className="flex-1 py-3 text-sm font-bold border-b-2 border-orange-500 text-orange-600">
          CANI ({present.length})
        </button>
        <button className="flex-1 py-3 text-sm font-medium text-gray-500">ATTIVITÀ</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && <div className="text-center py-8 text-gray-500 text-sm">Caricamento...</div>}
        {!loading && present.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🐾</div>
            <p className="font-semibold text-gray-700">Nessun cane presente</p>
            <p className="text-xs text-gray-500 mt-1">Sii il primo a fare check-in!</p>
          </div>
        )}
        {present.map((c, i) => {
          const dog = c.dogs
          if (!dog) return null
          const isMe = isMyDog(c.dog_id)
          const compat = calcCompat(dogs[0], dog)
          const compatColor = compat >= 75 ? '#10B981' : compat >= 60 ? '#F97316' : '#EF4444'
          return (
            <div key={c.id} className={`bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm ${isMe ? 'border-2 border-orange-200' : ''}`}>
              <button onClick={() => !isMe && setSelectedDog({ dog, compat })} className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
                  {EMOJIS[i % EMOJIS.length]}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-gray-900">{dog.name}</h3>
                  <span className="text-xs">{dog.gender === 'M' ? '♂' : '♀'}</span>
                  {isMe && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded-full font-bold">TU</span>}
                </div>
                <p className="text-xs text-gray-600">{dog.breed}{dog.age ? ' • ' + dog.age + 'a' : ''}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {(dog.traits||[]).slice(0,2).map((t,j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{t}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Qui da {elapsed(c.checked_in_at)}</p>
              </div>
              {!isMe && (
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className="text-xl font-black" style={{ color: compatColor }}>{compat}%</div>
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedDog({ dog, compat })}
                      className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                      <Info className="w-4 h-4 text-orange-500" />
                    </button>
                    <button onClick={() => onChat && onChat(dog.owner_id)}
                      className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white px-4 py-3 border-t border-gray-100 flex-shrink-0">
        {dogs.length === 0 ? (
          <p className="text-center text-sm text-gray-600">⚠️ Aggiungi un cane dal profilo per fare check-in</p>
        ) : myDogInArea ? (
          <div className="space-y-2">
            <p className="text-xs text-center text-green-700 font-semibold">
              🐾 {myDogInArea.name} è qui da {elapsed(checkins.find(c=>c.dog_id===myDogInArea.id)?.checked_in_at)}
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleCheckin(myDogInArea)} disabled={busy}
                className="flex-1 text-white font-bold py-3 rounded-xl active:scale-95 disabled:opacity-60"
                style={{ background:'linear-gradient(135deg,#6B7280,#4B5563)' }}>
                {busy ? '...' : `Esci con ${myDogInArea.name}`}
              </button>
              {dogs.length > 1 && (
                <button onClick={() => setShowDogSelect(true)}
                  className="flex-1 text-white font-bold py-3 rounded-xl active:scale-95"
                  style={{ background:'linear-gradient(135deg,#84CC16,#65A30D)' }}>
                  + Altro cane
                </button>
              )}
            </div>
          </div>
        ) : (
          <button onClick={handleCheckinPress} disabled={busy}
            className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-60"
            style={{ background:'linear-gradient(135deg,#84CC16,#65A30D)' }}>
            <PawPrint className="w-5 h-5" fill="white" />
            {busy ? 'Attendere...' : dogs.length > 1 ? 'SONO QUI — scegli cane' : `SONO QUI con ${dogs[0]?.name}`}
          </button>
        )}
      </div>

      {selectedDog && (
        <DogProfileModal
          dog={selectedDog.dog}
          compat={selectedDog.compat}
          onClose={() => setSelectedDog(null)}
          onChat={(ownerId) => { setSelectedDog(null); onChat && onChat(ownerId) }}
        />
      )}

      {showDogSelect && (
        <SelectDogModal
          dogs={dogs}
          onSelect={handleCheckin}
          onClose={() => setShowDogSelect(false)}
        />
      )}
    </div>
  )
}
