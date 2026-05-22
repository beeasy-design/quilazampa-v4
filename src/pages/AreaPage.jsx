import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ChevronLeft, PawPrint, Star, MessageCircle, Info, X, ChevronRight, Send, Users } from 'lucide-react'

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

function DogProfileModal({ dog, compat, onClose, onChat, onAddFriend }) {
  const compatColor = compat >= 75 ? '#10B981' : compat >= 60 ? '#F97316' : '#EF4444'
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
      <div className="bg-white w-full max-w-sm rounded-t-3xl p-6" style={{ maxHeight:'85vh',overflowY:'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-xl text-gray-900">Profilo cane</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        {/* Foto */}
        <div className="text-center mb-4">
          <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3 overflow-hidden border-4 border-orange-100">
            {dog.photo_url
              ? <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
              : <span className="text-5xl">🐕</span>}
          </div>
          <h3 className="font-black text-2xl text-gray-900">{dog.name}</h3>
          <p className="text-gray-600 text-sm">
            {dog.breed}
            {dog.age ? ` • ${dog.age} anni` : ''}
            {dog.age_months ? ` ${dog.age_months}m` : ''}
            {' • '}{dog.gender === 'M' ? '♂' : '♀'}
            {dog.sterilized ? ' • ✂️ Sterilizzato' : ''}
          </p>
          {dog.description && <p className="text-xs text-gray-500 mt-1 italic">"{dog.description}"</p>}
        </div>
        {/* Compatibilità */}
        <div className="bg-gray-50 rounded-2xl p-3 mb-4 text-center">
          <div className="text-3xl font-black mb-1" style={{ color: compatColor }}>{compat}%</div>
          <p className="text-sm text-gray-600">Compatibilità</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="h-2 rounded-full" style={{ width:`${compat}%`, background:compatColor }} />
          </div>
        </div>
        {/* Caratteristiche */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label:'Taglia', value: dog.size || 'N/D' },
            { label:'Energia', value: dog.energy || 'N/D' },
            { label:'Sesso', value: dog.gender === 'M' ? '♂ M' : '♀ F' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-2 text-center">
              <div className="text-[10px] text-gray-500">{item.label}</div>
              <div className="text-xs font-bold text-gray-900">{item.value}</div>
            </div>
          ))}
        </div>
        {(dog.traits||[]).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dog.traits.map((t,i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">{t}</span>
            ))}
          </div>
        )}
        {/* Azioni */}
        <div className="flex gap-2">
          <button onClick={() => onAddFriend(dog)}
            className="flex-1 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            style={{ background:'linear-gradient(135deg,#F97316,#EA580C)' }}>
            🐾 Aggiungi amico
          </button>
          <button onClick={() => onChat(dog.owner_id)}
            className="flex-1 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            style={{ background:'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
            <MessageCircle className="w-4 h-4" /> Scrivi
          </button>
        </div>
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
              <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                {dog.photo_url ? <img src={dog.photo_url} className="w-full h-full object-cover" /> : EMOJIS[i%EMOJIS.length]}
              </div>
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

function AreaChat({ area }) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    const ch = supabase.channel(`area-chat-${area.id}`)
      .on('postgres_changes', {
        event:'INSERT', schema:'public', table:'area_messages',
        filter:`area_id=eq.${area.id}`
      }, async (payload) => {
        const { data } = await supabase.from('area_messages')
          .select('id, content, user_id, created_at, profiles(username)')
          .eq('id', payload.new.id).single()
        if (data) setMessages(prev => [...prev, data])
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [area.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const fetchMessages = async () => {
    const { data } = await supabase.from('area_messages')
      .select('id, content, user_id, created_at, profiles(username)')
      .eq('area_id', area.id)
      .order('created_at')
      .limit(50)
    setMessages(data || [])
  }

  const sendMsg = async () => {
    if (!text.trim() || sending || !user) return
    setSending(true)
    const content = text.trim()
    setText('')
    await supabase.from('area_messages').insert({ area_id: area.id, user_id: user.id, content })
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0"
        style={{ background:'linear-gradient(180deg,#F0FDF4,#DCFCE7)' }}>
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nessun messaggio ancora</p>
            <p className="text-xs mt-1">Saluta i proprietari nell'area!</p>
          </div>
        )}
        {messages.map((m, i) => {
          const isMe = m.user_id === user?.id
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && <p className="text-[10px] text-gray-500 mb-0.5 ml-1">{m.profiles?.username || 'Utente'}</p>}
              <div className={`max-w-[78%] px-3 py-2 rounded-2xl shadow-sm ${isMe ? 'rounded-br-sm text-white' : 'bg-white text-gray-800 rounded-bl-sm'}`}
                style={isMe ? { background:'linear-gradient(135deg,#10B981,#059669)' } : {}}>
                <p className="text-sm">{m.content}</p>
                <p className={`text-[9px] mt-0.5 ${isMe ? 'text-green-100 text-right' : 'text-gray-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="bg-white px-3 py-2 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2.5">
          <input type="text" value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMsg() }}}
            placeholder="Scrivi nell'area..."
            className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <button onClick={sendMsg} disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          style={{ background:'linear-gradient(135deg,#10B981,#059669)' }}>
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}

export default function AreaPage({ area, onBack, onChat }) {
  const { user, dogs } = useAuth()
  const [activeDog, setActiveDog] = useState(dogs[0] || null)
  const [present, setPresent] = useState([])
  const [myCheckins, setMyCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedDog, setSelectedDog] = useState(null)
  const [showDogSelect, setShowDogSelect] = useState(false)
  const [activeTab, setActiveTab] = useState('cani') // cani | chat

  useEffect(() => {
    fetchAll()
    const ch = supabase.channel(`area-${area.id}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'checkins', filter:`area_id=eq.${area.id}` }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [area.id])

  const fetchAll = async () => {
    const { data } = await supabase
      .from('checkins')
      .select('id, dog_id, checked_in_at, dogs(id, name, breed, age, age_months, gender, size, energy, traits, owner_id, photo_url, sterilized, description)')
      .eq('area_id', area.id)
      .eq('active', true)
    setPresent(data || [])
    if (dogs.length > 0) {
      const myDogIds = dogs.map(d => d.id)
      setMyCheckins((data||[]).filter(c => myDogIds.includes(c.dog_id)))
    }
    setLoading(false)
  }

  const isMyDog = (dogId) => dogs.some(d => d.id === dogId)

  const handleCheckinPress = () => {
    if (dogs.length === 0) return
    if (dogs.length === 1) handleCheckin(dogs[0])
    else setShowDogSelect(true)
  }

  const handleCheckin = async (dog) => {
    if (!dog) return
    setBusy(true)
    setShowDogSelect(false)
    setActiveDog(dog)
    const existing = myCheckins.find(c => c.dog_id === dog.id)
    if (existing) {
      await supabase.from('checkins').update({ active:false, checked_out_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('checkins').insert({ dog_id: dog.id, area_id: area.id, active: true })
    }
    await fetchAll()
    setBusy(false)
  }

  const handleAddFriend = async (dog) => {
    if (!user || dogs.length === 0) return
    const myDog = dogs[0]
    const { error } = await supabase.from('dog_friendships').insert({
      dog_id_1: myDog.id, dog_id_2: dog.id, created_by: user.id, status: 'pending'
    })
    if (!error) alert(`Richiesta di amicizia inviata a ${dog.name}! 🐾`)
    setSelectedDog(null)
  }

  const elapsed = (ts) => {
    const m = Math.floor((Date.now() - new Date(ts)) / 60000)
    return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`
  }

  const myDogInArea = dogs.find(d => myCheckins.some(c => c.dog_id === d.id))

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
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

      {/* Tabs */}
      <div className="bg-white flex border-b border-gray-200 flex-shrink-0">
        <button onClick={() => setActiveTab('cani')}
          className={`flex-1 py-3 text-sm font-bold ${activeTab==='cani' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}>
          🐾 CANI ({present.length})
        </button>
        <button onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-bold ${activeTab==='chat' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}>
          💬 CHAT AREA
        </button>
      </div>

      {/* Contenuto */}
      {activeTab === 'cani' && (
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
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center text-2xl">
                    {dog.photo_url ? <img src={dog.photo_url} className="w-full h-full object-cover" /> : EMOJIS[i%EMOJIS.length]}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900">{dog.name}</h3>
                    <span className="text-xs">{dog.gender === 'M' ? '♂' : '♀'}</span>
                    {isMe && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded-full font-bold">TU</span>}
                    {dog.sterilized && <span className="text-[9px] bg-blue-100 text-blue-600 px-1 rounded-full">✂️</span>}
                  </div>
                  <p className="text-xs text-gray-600">
                    {dog.breed}
                    {dog.age ? ` • ${dog.age}a` : ''}
                    {dog.age_months ? `${dog.age_months}m` : ''}
                  </p>
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
      )}

      {activeTab === 'chat' && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <AreaChat area={area} />
        </div>
      )}

      {/* Check-in bar */}
      <div className="bg-white px-4 py-3 border-t border-gray-100 flex-shrink-0">
        {dogs.length === 0 ? (
          <p className="text-center text-sm text-gray-600">⚠️ Aggiungi un cane dal profilo</p>
        ) : myDogInArea ? (
          <div className="flex gap-2">
            <button onClick={() => handleCheckin(myDogInArea)} disabled={busy}
              className="flex-1 text-white font-bold py-3 rounded-xl active:scale-95"
              style={{ background:'linear-gradient(135deg,#6B7280,#4B5563)' }}>
              {busy ? '...' : `Esci con ${myDogInArea.name}`}
            </button>
            {dogs.length > 1 && (
              <button onClick={() => setShowDogSelect(true)}
                className="flex-1 text-white font-bold py-3 rounded-xl"
                style={{ background:'linear-gradient(135deg,#84CC16,#65A30D)' }}>
                + Altro cane
              </button>
            )}
          </div>
        ) : (
          <button onClick={handleCheckinPress} disabled={busy}
            className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95"
            style={{ background:'linear-gradient(135deg,#84CC16,#65A30D)' }}>
            <PawPrint className="w-5 h-5" fill="white" />
            {busy ? '...' : dogs.length > 1 ? 'SONO QUI — scegli cane' : `SONO QUI con ${dogs[0]?.name}`}
          </button>
        )}
      </div>

      {selectedDog && (
        <DogProfileModal
          dog={selectedDog.dog}
          compat={selectedDog.compat}
          onClose={() => setSelectedDog(null)}
          onChat={(ownerId) => { setSelectedDog(null); onChat && onChat(ownerId) }}
          onAddFriend={handleAddFriend}
        />
      )}
      {showDogSelect && (
        <SelectDogModal dogs={dogs} onSelect={handleCheckin} onClose={() => setShowDogSelect(false)} />
      )}
    </div>
  )
}
