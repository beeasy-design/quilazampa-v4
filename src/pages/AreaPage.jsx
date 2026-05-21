import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ChevronLeft, PawPrint, MapPin, Star, Eye, EyeOff, ChevronRight, MessageCircle, Info, X } from 'lucide-react'

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="bg-white w-full max-w-sm rounded-t-3xl p-6" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-xl text-gray-900">Profilo cane</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="text-center mb-4">
          <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center text-5xl mx-auto mb-3">🐕</div>
          <h3 className="font-black text-2xl text-gray-900">{dog.name}</h3>
          <p className="text-gray-600">{dog.breed} • {dog.age ? dog.age + ' anni' : ''} • {dog.gender === 'M' ? '♂' : '♀'}</p>
        </div>
        {/* Compatibilità */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 text-center">
          <div className="text-4xl font-black mb-1" style={{ color: compatColor }}>{compat}%</div>
          <p className="text-sm text-gray-600 font-medium">Compatibilità con il tuo cane</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="h-2 rounded-full" style={{ width: `${compat}%`, background: compatColor }} />
          </div>
        </div>
        {/* Caratteristiche */}
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Taglia', value: dog.size || 'N/D' },
              { label: 'Energia', value: dog.energy || 'N/D' },
              { label: 'Sesso', value: dog.gender === 'M' ? '♂ Maschio' : '♀ Femmina' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-2 text-center">
                <div className="text-[10px] text-gray-500 mb-0.5">{item.label}</div>
                <div className="text-xs font-bold text-gray-900">{item.value}</div>
              </div>
            ))}
          </div>
          {(dog.traits || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dog.traits.map((t, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">{t}</span>
              ))}
            </div>
          )}
        </div>
        {/* Pulsante chat */}
        <button onClick={() => onChat(dog.owner_id)}
          className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
          <MessageCircle className="w-5 h-5" /> Scrivi al proprietario
        </button>
      </div>
    </div>
  )
}

export default function AreaPage({ area, onBack, onChat }) {
  const { user, dogs } = useAuth()
  const myDog = dogs[0] || null
  const [present, setPresent] = useState([])
  const [checkinId, setCheckinId] = useState(null)
  const [invisible, setInvisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedDog, setSelectedDog] = useState(null)
  const [geoPrompt, setGeoPrompt] = useState(null) // area suggerita per check-in automatico
  const watchIdRef = useRef(null)

  useEffect(() => {
    fetchPresent()
    checkMyCheckin()
    startGeoWatch()
    const ch = supabase.channel(`area-${area.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `area_id=eq.${area.id}` }, fetchPresent)
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
      if (watchIdRef.current) navigator.geolocation?.clearWatch(watchIdRef.current)
    }
  }, [area.id])

  const startGeoWatch = () => {
    if (!navigator.geolocation) return
    watchIdRef.current = navigator.geolocation.watchPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      // Calcola distanza dall'area (formula Haversine semplificata)
      if (area.lat && area.lng) {
        const dist = Math.sqrt(Math.pow((lat - area.lat) * 111000, 2) + Math.pow((lng - area.lng) * 111000 * Math.cos(area.lat * Math.PI / 180), 2))
        // Se entro 200m e non ancora in check-in, suggerisci
        if (dist < 200 && !checkinId) {
          setGeoPrompt('Sei vicino a ' + area.name + '! Vuoi fare check-in?')
        }
        // Se oltre 500m e in check-in, avvisa
        if (dist > 500 && checkinId) {
          setGeoPrompt('Sei lontano da ' + area.name + '. Vuoi fare check-out?')
        }
      }
    }, null, { enableHighAccuracy: true, maximumAge: 30000 })
  }

  const fetchPresent = async () => {
    const { data } = await supabase.from('checkins')
      .select('id, dog_id, checked_in_at, dogs(id,name,breed,age,gender,size,energy,traits,owner_id)')
      .eq('area_id', area.id).eq('active', true)
    setPresent(data || [])
    setLoading(false)
  }

  const checkMyCheckin = async () => {
    if (!myDog) return
    const { data } = await supabase.from('checkins').select('id')
      .eq('dog_id', myDog.id).eq('area_id', area.id).eq('active', true).single()
    if (data) setCheckinId(data.id)
  }

  const handleCheckin = async () => {
    if (!myDog) return
    setBusy(true)
    setGeoPrompt(null)
    if (checkinId) {
      await supabase.from('checkins').update({ active: false, checked_out_at: new Date().toISOString() }).eq('id', checkinId)
      setCheckinId(null)
    } else {
      // Checkout da tutte le altre aree prima
      await supabase.from('checkins').update({ active: false, checked_out_at: new Date().toISOString() })
        .eq('dog_id', myDog.id).eq('active', true)
      const { data } = await supabase.from('checkins').insert({ dog_id: myDog.id, area_id: area.id, active: true }).select().single()
      if (data) setCheckinId(data.id)
    }
    await fetchPresent()
    setBusy(false)
  }

  const elapsed = (ts) => {
    const m = Math.floor((Date.now() - new Date(ts)) / 60000)
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
  }

  const visible = invisible ? present.filter(c => c.dogs?.owner_id !== user?.id) : present

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Popup geo */}
      {geoPrompt && (
        <div className="bg-blue-500 text-white px-4 py-3 flex items-center gap-3">
          <MapPin className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium flex-1">{geoPrompt}</p>
          <button onClick={handleCheckin} className="bg-white text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full">
            {checkinId ? 'Check-out' : 'Check-in'}
          </button>
          <button onClick={() => setGeoPrompt(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

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

      <div className="bg-amber-50 px-4 py-2 flex items-center justify-between border-b border-amber-100">
        <div className="flex items-center gap-2 text-xs text-amber-900">
          {invisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>Modalità invisibile</span>
        </div>
        <button onClick={() => setInvisible(!invisible)}
          className={`w-10 h-5 rounded-full relative transition-colors ${invisible ? 'bg-green-500' : 'bg-gray-300'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${invisible ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && <div className="text-center py-8 text-gray-500">Caricamento...</div>}
        {!loading && visible.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🐾</div>
            <p className="font-semibold text-gray-700">Nessun cane presente</p>
            <p className="text-xs text-gray-500 mt-1">Sii il primo a fare check-in!</p>
          </div>
        )}
        {visible.map((c, i) => {
          const dog = c.dogs; if (!dog) return null
          const isMe = dog.owner_id === user?.id
          const compat = calcCompat(myDog, dog)
          const compatColor = compat >= 75 ? '#10B981' : compat >= 60 ? '#F97316' : '#EF4444'
          return (
            <div key={c.id} className={`bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm ${isMe ? 'border-2 border-orange-200' : ''}`}>
              <button onClick={() => !isMe && setSelectedDog({ dog, compat })} className="relative">
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
                <p className="text-xs text-gray-600">{dog.breed} • {dog.age ? dog.age + 'a' : ''}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {(dog.traits || []).slice(0, 2).map((t, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{t}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Qui da {elapsed(c.checked_in_at)}</p>
              </div>
              {!isMe && (
                <div className="flex flex-col items-center gap-1.5">
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

      <div className="bg-white px-4 py-3 border-t border-gray-100">
        {!myDog ? (
          <p className="text-center text-sm text-gray-600 py-1">⚠️ Aggiungi un cane dal profilo per fare check-in</p>
        ) : (
          <button onClick={handleCheckin} disabled={busy}
            className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-60"
            style={{ background: checkinId ? 'linear-gradient(135deg, #6B7280, #4B5563)' : 'linear-gradient(135deg, #84CC16, #65A30D)' }}>
            <PawPrint className="w-5 h-5" fill="white" />
            {busy ? 'Attendere...' : checkinId ? `${myDog.name} è qui ✓ — Esci` : `SONO QUI con ${myDog.name}`}
          </button>
        )}
      </div>

      {/* Modal profilo cane */}
      {selectedDog && (
        <DogProfileModal
          dog={selectedDog.dog}
          compat={selectedDog.compat}
          onClose={() => setSelectedDog(null)}
          onChat={(ownerId) => { setSelectedDog(null); onChat && onChat(ownerId) }}
        />
      )}
    </div>
  )
}
