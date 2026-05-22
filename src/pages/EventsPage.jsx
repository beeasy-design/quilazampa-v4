import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Calendar, MapPin, Clock, Users, Plus, ChevronLeft, MessageCircle, Send, PawPrint } from 'lucide-react'

const EVENT_COLORS = ['#FED7AA','#DDD6FE','#BFDBFE','#BBF7D0','#FCE7F3','#FEF3C7']

function EventDetail({ event, onBack }) {
  const { user } = useAuth()
  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [tab, setTab] = useState('info')
  const [isJoined, setIsJoined] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  // Usa sempre il conteggio reale da event_participants
  const realCount = participants.length

  useEffect(() => {
    fetchParticipants()
  }, [event.id])

  useEffect(() => {
    if (tab !== 'chat') return
    fetchMessages()
    const ch = supabase.channel(`ev-${event.id}`)
      .on('postgres_changes', {
        event:'INSERT', schema:'public', table:'event_messages',
        filter:`event_id=eq.${event.id}`
      }, async (payload) => {
        const { data } = await supabase
          .from('event_messages')
          .select('id, content, user_id, created_at, profiles(username)')
          .eq('id', payload.new.id)
          .single()
        if (data) setMessages(prev => [...prev, data])
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [event.id, tab])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from('event_participants')
      .select('user_id, profiles(username, city)')
      .eq('event_id', event.id)
    if (!error) {
      setParticipants(data || [])
      setIsJoined(!!(data||[]).find(p => p.user_id === user?.id))
    }
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('event_messages')
      .select('id, content, user_id, created_at, profiles(username)')
      .eq('event_id', event.id)
      .order('created_at')
    setMessages(data || [])
  }

  const handleJoin = async () => {
    if (!user) return
    if (isJoined) {
      await supabase.from('event_participants')
        .delete().eq('event_id', event.id).eq('user_id', user.id)
    } else {
      await supabase.from('event_participants')
        .insert({ event_id: event.id, user_id: user.id })
    }
    // Aggiorna anche il campo participants_count nel DB
    const newCount = isJoined ? Math.max(0, realCount - 1) : realCount + 1
    await supabase.from('events').update({ participants_count: newCount }).eq('id', event.id)
    await fetchParticipants()
  }

  const sendMsg = async () => {
    if (!text.trim() || sending || !user) return
    setSending(true)
    const content = text.trim()
    setText('')
    await supabase.from('event_messages').insert({
      event_id: event.id, user_id: user.id, content
    })
    setSending(false)
  }

  const isPast = new Date(event.date) < new Date()
  const isFull = realCount >= event.max_participants

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={onBack}><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900 flex-1 text-sm truncate">{event.title}</h2>
      </div>

      <div className="px-4 py-4 flex-shrink-0" style={{ background: EVENT_COLORS[0] }}>
        <div className="flex items-start gap-3">
          <div className="text-4xl">{event.emoji || '🐾'}</div>
          <div className="flex-1">
            <h2 className="font-black text-base text-gray-900 mb-1">{event.title}</h2>
            <div className="flex flex-col gap-1 text-xs text-gray-700">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(event.date).toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})} ore {new Date(event.date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}
              </span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
              <span className="flex items-center gap-1 font-bold">
                <Users className="w-3 h-3" />{realCount}/{event.max_participants} partecipanti
              </span>
            </div>
          </div>
        </div>
        <div className="w-full bg-white/50 rounded-full h-1.5 mt-3">
          <div className="h-1.5 rounded-full bg-orange-500 transition-all"
            style={{ width:`${Math.min((realCount/event.max_participants)*100,100)}%` }} />
        </div>
        {!isPast && (
          <button onClick={handleJoin}
            className="w-full mt-3 text-white font-bold py-3 rounded-xl active:scale-95"
            style={{ background: isJoined ? 'linear-gradient(135deg,#6B7280,#4B5563)' : isFull ? '#9CA3AF' : 'linear-gradient(135deg,#84CC16,#65A30D)' }}
            disabled={isFull && !isJoined}>
            {isJoined ? '✓ Partecipi — Disdici' : isFull ? 'Evento pieno' : '✓ PARTECIPA'}
          </button>
        )}
      </div>

      <div className="bg-white flex border-b border-gray-200 flex-shrink-0">
        {[
          { id:'info', label:'Info' },
          { id:'partecipanti', label:`Partecipanti (${realCount})` },
          { id:'chat', label:'💬 Chat' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-bold ${tab===t.id ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {tab === 'info' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {event.description && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-sm text-gray-900 mb-2">Descrizione</h3>
                <p className="text-sm text-gray-700">{event.description}</p>
              </div>
            )}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-500" />{new Date(event.date).toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" />Ore {new Date(event.date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" />{event.location}</div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" />{realCount} partecipanti su {event.max_participants} posti</div>
            </div>
          </div>
        )}

        {tab === 'partecipanti' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {participants.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <PawPrint className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nessun partecipante ancora</p>
              </div>
            )}
            {participants.map((p,i) => (
              <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">👤</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{p.profiles?.username || 'Utente'}</p>
                  <p className="text-[10px] text-gray-500">{p.profiles?.city || ''}</p>
                </div>
                {p.user_id === user?.id && (
                  <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">TU</span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0"
              style={{ background:'linear-gradient(180deg,#FEF3C7,#FED7AA)' }}>
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nessun messaggio ancora</p>
                  <p className="text-xs mt-1">Inizia la chat del gruppo!</p>
                </div>
              )}
              {messages.map((m,i) => {
                const isMe = m.user_id === user?.id
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <p className="text-[10px] text-gray-500 mb-0.5 ml-1">{m.profiles?.username || 'Utente'}</p>}
                    <div className={`max-w-[78%] px-3 py-2 rounded-2xl shadow-sm ${isMe ? 'rounded-br-sm text-white' : 'bg-white text-gray-800 rounded-bl-sm'}`}
                      style={isMe ? { background:'linear-gradient(135deg,#F97316,#EA580C)' } : {}}>
                      <p className="text-sm">{m.content}</p>
                      <p className={`text-[9px] mt-0.5 ${isMe ? 'text-orange-100 text-right' : 'text-gray-400'}`}>
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
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }}}
                  placeholder="Scrivi nella chat del gruppo..."
                  className="flex-1 bg-transparent text-sm outline-none" />
              </div>
              <button onClick={sendMsg} disabled={!text.trim() || sending}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40"
                style={{ background:'linear-gradient(135deg,#F97316,#EA580C)' }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function EventsPage({ initialEvent = null }) {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(initialEvent)
  const [filter, setFilter] = useState('prossimi')
  const [participantCounts, setParticipantCounts] = useState({})
  const [form, setForm] = useState({ title:'', date:'', time:'', location:'', description:'', max_participants:20, emoji:'🐾' })

  useEffect(() => { fetchEvents() }, [])
  useEffect(() => { if (initialEvent) setSelectedEvent(initialEvent) }, [initialEvent])

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('date')
    setEvents(data || [])
    // Carica conteggi reali per tutti gli eventi
    if (data && data.length > 0) {
      const { data: parts } = await supabase
        .from('event_participants')
        .select('event_id')
        .in('event_id', data.map(e => e.id))
      const counts = {}
      ;(parts||[]).forEach(p => { counts[p.event_id] = (counts[p.event_id]||0) + 1 })
      setParticipantCounts(counts)
    }
    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const dt = new Date(`${form.date}T${form.time}`)
    const { error } = await supabase.from('events').insert({
      title: form.title, date: dt.toISOString(), location: form.location,
      description: form.description, max_participants: parseInt(form.max_participants),
      emoji: form.emoji, participants_count: 0, created_by: user.id
    })
    if (!error) {
      setShowCreate(false)
      fetchEvents()
      setForm({ title:'', date:'', time:'', location:'', description:'', max_participants:20, emoji:'🐾' })
    }
  }

  const now = new Date()
  const filtered = events.filter(ev => {
    const d = new Date(ev.date)
    if (filter === 'prossimi') return d >= now
    if (filter === 'passati') return d < now
    return true
  })

  if (selectedEvent) return (
    <EventDetail event={selectedEvent} onBack={() => { setSelectedEvent(null); fetchEvents() }} />
  )

  if (showCreate) return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => setShowCreate(false)}><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900">Crea evento</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {['🐾','🌅','🐶','🎉','🏆','🎓','🍹','🌳','🤝','❤️'].map(em => (
                <button key={em} type="button" onClick={() => setForm(f => ({...f, emoji:em}))}
                  className={`w-10 h-10 rounded-xl text-xl ${form.emoji===em ? 'bg-orange-100 ring-2 ring-orange-500' : 'bg-white border border-gray-200'}`}>{em}</button>
              ))}
            </div>
          </div>
          {[
            { key:'title', label:'Titolo *', placeholder:'es. Passeggiata mattutina' },
            { key:'location', label:'Luogo *', placeholder:'es. Parco Sempione' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">{f.label}</label>
              <input type="text" value={form[f.key]} onChange={e => setForm(ff => ({...ff, [f.key]:e.target.value}))}
                placeholder={f.placeholder} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Descrizione</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}
              rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Data *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Ora *</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({...f, time:e.target.value}))} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Max partecipanti</label>
            <input type="number" value={form.max_participants} onChange={e => setForm(f => ({...f, max_participants:e.target.value}))}
              min={2} max={500}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
          </div>
          <button type="submit" className="w-full text-white font-bold py-4 rounded-xl"
            style={{ background:'linear-gradient(135deg,#F97316,#EA580C)' }}>
            🎉 Pubblica evento
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900 text-base">Eventi & Raduni</h2>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-full"
            style={{ background:'linear-gradient(135deg,#F97316,#EA580C)' }}>
            <Plus className="w-3 h-3" /> Crea
          </button>
        </div>
        <div className="flex gap-2">
          {['tutti','prossimi','passati'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${filter===f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading && <div className="text-center py-8 text-gray-500">Caricamento...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📅</div>
            <p className="font-semibold text-gray-700">Nessun evento trovato</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-orange-600 font-bold">Crea il primo!</button>
          </div>
        )}
        {filtered.map((ev, i) => {
          const isPast = new Date(ev.date) < now
          // Usa conteggio reale, non quello nel DB
          const count = participantCounts[ev.id] ?? (ev.participants_count || 0)
          return (
            <button key={ev.id} onClick={() => setSelectedEvent(ev)}
              className={`w-full bg-white rounded-2xl overflow-hidden shadow-sm text-left hover:shadow-md transition-shadow active:scale-95 ${isPast ? 'opacity-70' : ''}`}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: EVENT_COLORS[i%EVENT_COLORS.length] }}>
                <div className="text-3xl">{ev.emoji || '🐾'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 truncate">{ev.title}</h3>
                  <p className="text-[10px] text-gray-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ev.date).toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'})} • {new Date(ev.date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}
                  </p>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <MapPin className="w-3 h-3" />{ev.location}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Users className="w-3 h-3" />{count}/{ev.max_participants}
                  </span>
                  <span className="text-xs text-orange-600 font-bold flex items-center gap-1">
                    Dettagli e chat <MessageCircle className="w-3 h-3" />
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
                  <div className="h-1 rounded-full bg-orange-400"
                    style={{ width:`${Math.min((count/ev.max_participants)*100,100)}%` }} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
