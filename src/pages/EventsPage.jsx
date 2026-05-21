import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Calendar, MapPin, Clock, Users, Plus, ChevronLeft, X, MessageCircle, Send, PawPrint } from 'lucide-react'

const EVENT_COLORS = ['#FED7AA', '#DDD6FE', '#BFDBFE', '#BBF7D0', '#FCE7F3', '#FEF3C7']

function EventDetail({ event, onBack, onJoin, isJoined }) {
  const { user, dogs } = useAuth()
  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [tab, setTab] = useState('info')
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchParticipants()
    if (tab === 'chat') fetchMessages()
  }, [event.id, tab])

  useEffect(() => {
    if (tab !== 'chat') return
    const ch = supabase.channel(`event-chat-${event.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_messages', filter: `event_id=eq.${event.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [event.id, tab])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchParticipants = async () => {
    const { data } = await supabase.from('event_participants')
      .select('user_id, profiles(username, city), joined_at')
      .eq('event_id', event.id)
    setParticipants(data || [])
  }

  const fetchMessages = async () => {
    const { data } = await supabase.from('event_messages')
      .select('*, profiles(username)')
      .eq('event_id', event.id)
      .order('created_at')
    setMessages(data || [])
  }

  const sendMsg = async () => {
    if (!text.trim()) return
    const t = text.trim(); setText('')
    await supabase.from('event_messages').insert({
      event_id: event.id, user_id: user.id, content: t
    })
  }

  const isPast = new Date(event.date) < new Date()
  const isFull = (event.participants_count || 0) >= event.max_participants

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack}><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900 flex-1 text-sm truncate">{event.title}</h2>
      </div>

      {/* Hero evento */}
      <div className="px-4 py-4" style={{ background: EVENT_COLORS[0] }}>
        <div className="flex items-start gap-3">
          <div className="text-4xl">{event.emoji || '🐾'}</div>
          <div className="flex-1">
            <h2 className="font-black text-lg text-gray-900 mb-1">{event.title}</h2>
            <div className="flex flex-col gap-1 text-xs text-gray-700">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(event.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} • {new Date(event.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {event.participants_count || 0}/{event.max_participants} partecipanti
              </span>
            </div>
          </div>
        </div>

        {/* Barra progresso */}
        <div className="w-full bg-white/50 rounded-full h-1.5 mt-3">
          <div className="h-1.5 rounded-full bg-orange-500"
            style={{ width: `${Math.min(((event.participants_count || 0) / event.max_participants) * 100, 100)}%` }} />
        </div>

        {/* Bottone partecipa */}
        {!isPast && (
          <button onClick={onJoin}
            className="w-full mt-3 text-white font-bold py-3 rounded-xl"
            style={{ background: isJoined ? 'linear-gradient(135deg,#6B7280,#4B5563)' : isFull ? '#9CA3AF' : 'linear-gradient(135deg,#84CC16,#65A30D)' }}
            disabled={isFull && !isJoined}>
            {isJoined ? '✓ Partecipi — Disdici' : isFull ? 'Evento pieno' : '✓ PARTECIPA'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white flex border-b border-gray-200">
        {[
          { id: 'info', label: 'Info' },
          { id: 'partecipanti', label: `Partecipanti (${participants.length})` },
          { id: 'chat', label: '💬 Chat' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-bold ${tab === t.id ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenuto tab */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === 'info' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {event.description && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-sm text-gray-900 mb-2">Descrizione</h3>
                <p className="text-sm text-gray-700">{event.description}</p>
              </div>
            )}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-sm text-gray-900 mb-3">Dettagli</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-500" />
                  {new Date(event.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" />
                  Ore {new Date(event.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" />{event.location}</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" />
                  {event.participants_count || 0} partecipanti su {event.max_participants} posti
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'partecipanti' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {participants.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <PawPrint className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nessun partecipante ancora</p>
                <p className="text-xs mt-1">Sii il primo!</p>
              </div>
            )}
            {participants.map((p, i) => (
              <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">👤</div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{p.profiles?.username || 'Utente'}</p>
                  <p className="text-[10px] text-gray-500">{p.profiles?.city || ''}</p>
                </div>
                {p.user_id === user?.id && <span className="ml-auto text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">TU</span>}
              </div>
            ))}
          </div>
        )}

        {tab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
              style={{ background: 'linear-gradient(180deg, #FEF3C7, #FED7AA)' }}>
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nessun messaggio ancora</p>
                  <p className="text-xs mt-1">Inizia la chat del gruppo!</p>
                </div>
              )}
              {messages.map((m, i) => {
                const isMe = m.user_id === user?.id
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <p className="text-[10px] text-gray-500 mb-0.5 ml-1">{m.profiles?.username}</p>}
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${isMe ? 'rounded-br-sm text-white' : 'bg-white text-gray-800 rounded-bl-sm'}`}
                      style={isMe ? { background: 'linear-gradient(135deg,#F97316,#EA580C)' } : {}}>
                      <p className="text-sm">{m.content}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
            <div className="bg-white px-3 py-2 border-t border-gray-100 flex items-center gap-2">
              <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2.5">
                <input type="text" value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  placeholder="Scrivi nella chat del gruppo..."
                  className="flex-1 bg-transparent text-sm outline-none" />
              </div>
              <button onClick={sendMsg} disabled={!text.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
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
  const { user, isAdmin } = useAuth()
  const [events, setEvents] = useState([])
  const [joined, setJoined] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(initialEvent)
  const [filter, setFilter] = useState('prossimi')
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', description: '', max_participants: 20, emoji: '🐾' })

  useEffect(() => { fetchEvents() }, [])
  useEffect(() => { if (initialEvent) setSelectedEvent(initialEvent) }, [initialEvent])

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('date')
    setEvents(data || [])
    if (user) {
      const { data: parts } = await supabase.from('event_participants').select('event_id').eq('user_id', user.id)
      setJoined(new Set(parts?.map(p => p.event_id) || []))
    }
    setLoading(false)
  }

  const handleJoin = async (eventId) => {
    if (!user) return
    if (joined.has(eventId)) {
      await supabase.from('event_participants').delete().eq('event_id', eventId).eq('user_id', user.id)
      await supabase.from('events').update({ participants_count: Math.max(0, ((events.find(e => e.id === eventId)?.participants_count) || 1) - 1) }).eq('id', eventId)
      setJoined(prev => { const s = new Set(prev); s.delete(eventId); return s })
    } else {
      await supabase.from('event_participants').insert({ event_id: eventId, user_id: user.id })
      const ev = events.find(e => e.id === eventId)
      await supabase.from('events').update({ participants_count: (ev?.participants_count || 0) + 1 }).eq('id', eventId)
      setJoined(prev => new Set([...prev, eventId]))
    }
    fetchEvents()
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const dt = new Date(`${form.date}T${form.time}`)
    await supabase.from('events').insert({
      title: form.title, date: dt.toISOString(), location: form.location,
      description: form.description, max_participants: parseInt(form.max_participants),
      emoji: form.emoji, participants_count: 0, created_by: user.id
    })
    setShowCreate(false)
    fetchEvents()
    setForm({ title: '', date: '', time: '', location: '', description: '', max_participants: 20, emoji: '🐾' })
  }

  const now = new Date()
  const filtered = events.filter(ev => {
    const d = new Date(ev.date)
    if (filter === 'prossimi') return d >= now
    if (filter === 'passati') return d < now
    return true
  })

  if (selectedEvent) return (
    <EventDetail
      event={selectedEvent}
      onBack={() => setSelectedEvent(null)}
      onJoin={() => handleJoin(selectedEvent.id)}
      isJoined={joined.has(selectedEvent.id)}
    />
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
              {['🐾', '🌅', '🐶', '🎉', '🏆', '🎓', '🍹', '🌳', '🤝', '❤️'].map(em => (
                <button key={em} type="button" onClick={() => setForm(f => ({ ...f, emoji: em }))}
                  className={`w-10 h-10 rounded-xl text-xl ${form.emoji === em ? 'bg-orange-100 ring-2 ring-orange-500' : 'bg-white border border-gray-200'}`}>{em}</button>
              ))}
            </div>
          </div>
          {[
            { key: 'title', label: 'Titolo *', placeholder: 'es. Passeggiata mattutina' },
            { key: 'location', label: 'Luogo *', placeholder: 'es. Parco Sempione' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">{f.label}</label>
              <input type="text" value={form[f.key]} onChange={e => setForm(ff => ({ ...ff, [f.key]: e.target.value }))}
                placeholder={f.placeholder} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Descrizione</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrivi l'evento..." rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Data *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Ora *</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Max partecipanti</label>
            <input type="number" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))}
              min={2} max={500}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
          </div>
          <button type="submit"
            className="w-full text-white font-bold py-4 rounded-xl shadow-md"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
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
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            <Plus className="w-3 h-3" /> Crea
          </button>
        </div>
        <div className="flex gap-2">
          {['tutti', 'prossimi', 'passati'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {f}
            </button>
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
          const isJoinedEv = joined.has(ev.id)
          const isFull = (ev.participants_count || 0) >= ev.max_participants
          return (
            <button key={ev.id} onClick={() => setSelectedEvent(ev)}
              className={`w-full bg-white rounded-2xl overflow-hidden shadow-sm text-left hover:shadow-md transition-shadow active:scale-95 ${isPast ? 'opacity-70' : ''}`}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: EVENT_COLORS[i % EVENT_COLORS.length] }}>
                <div className="text-3xl">{ev.emoji || '🐾'}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-900">{ev.title}</h3>
                  <p className="text-[10px] text-gray-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ev.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} • {new Date(ev.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {isJoinedEv && <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">✓ Partecipi</span>}
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <MapPin className="w-3 h-3" />{ev.location}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Users className="w-3 h-3" />{ev.participants_count || 0}/{ev.max_participants}
                  </span>
                  <span className="text-xs text-orange-600 font-bold flex items-center gap-1">
                    Dettagli e chat <MessageCircle className="w-3 h-3" />
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
                  <div className="h-1 rounded-full bg-orange-400"
                    style={{ width: `${Math.min(((ev.participants_count || 0) / ev.max_participants) * 100, 100)}%` }} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
