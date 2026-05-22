import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Bell, Search, SlidersHorizontal, MapPin, PawPrint, ChevronRight, Calendar, X, MessageCircle, Heart } from 'lucide-react'

const EMOJIS = ['🐕','🐶','🦮','🐕‍🦺','🐩','🦴']

// Schermata lista cani vicini
function NearbyDogsScreen({ onBack, onChat, onAddFriend }) {
  const { user, dogs } = useAuth()
  const [allDogs, setAllDogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNearbyDogs()
  }, [])

  const fetchNearbyDogs = async () => {
    // Prendi tutti i cani in check-in attivo
    const { data } = await supabase
      .from('checkins')
      .select('dog_id, area_id, dogs(id,name,breed,age,age_months,gender,size,energy,traits,owner_id,photo_url,sterilized,description), dog_areas(name,city)')
      .eq('active', true)
    const myDogIds = dogs.map(d => d.id)
    const others = (data||[]).filter(c => !myDogIds.includes(c.dog_id))
    setAllDogs(others)
    setLoading(false)
  }

  const calcCompat = (myDog, b) => {
    if (!myDog || !b) return 50
    let s = 50
    if (myDog.size === b.size) s += 10
    const em = {Bassa:1,Media:2,Alta:3}
    const d = Math.abs((em[myDog.energy]||2)-(em[b.energy]||2))
    s += d===0?15:d===1?7:0
    const common=(myDog.traits||[]).filter(t=>(b.traits||[]).includes(t))
    s += Math.min(common.length*5,25)
    return Math.min(s,99)
  }

  const myDog = dogs[0]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack}>
          <ChevronRight className="w-6 h-6 text-gray-700 rotate-180" />
        </button>
        <h2 className="font-bold text-gray-900">🐕 Cani ora fuori</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && <div className="text-center py-8 text-gray-500">Caricamento...</div>}
        {!loading && allDogs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🐾</div>
            <p className="font-semibold text-gray-700">Nessun cane nelle aree adesso</p>
          </div>
        )}
        {allDogs.map((c, i) => {
          const dog = c.dogs
          if (!dog) return null
          const compat = calcCompat(myDog, dog)
          const compatColor = compat>=75?'#10B981':compat>=60?'#F97316':'#EF4444'
          return (
            <div key={c.dog_id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                {dog.photo_url ? <img src={dog.photo_url} className="w-full h-full object-cover" /> : EMOJIS[i%EMOJIS.length]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">{dog.name}</h3>
                <p className="text-xs text-gray-600">{dog.breed}{dog.age?` • ${dog.age}a`:''}</p>
                <p className="text-[10px] text-orange-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{c.dog_areas?.name}
                </p>
                <div className="flex gap-1 mt-1">
                  {(dog.traits||[]).slice(0,2).map((t,j)=>(
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="text-lg font-black" style={{color:compatColor}}>{compat}%</div>
                <div className="flex gap-1">
                  <button onClick={() => onAddFriend && onAddFriend(dog)}
                    className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-orange-400" />
                  </button>
                  <button onClick={() => onChat && onChat(dog.owner_id)}
                    className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HomePage({ onAreaSelect, onTabChange, onEventSelect, onChat }) {
  const { dogs, user } = useAuth()
  const [areas, setAreas] = useState([])
  const [areaStats, setAreaStats] = useState({})
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilter, setShowFilter] = useState(false)
  const [filterFenced, setFilterFenced] = useState(false)
  const [filterMinDogs, setFilterMinDogs] = useState(0)
  const [search, setSearch] = useState('')
  const [subScreen, setSubScreen] = useState(null) // null | 'nearby-dogs'

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    const [{ data: areasData }, { data: checkins }, { data: eventsData }] = await Promise.all([
      supabase.from('dog_areas').select('*').order('name'),
      supabase.from('checkins').select('area_id').eq('active', true),
      supabase.from('events').select('*').gte('date', new Date().toISOString()).order('date').limit(3)
    ])
    const stats = {}
    checkins?.forEach(c => { stats[c.area_id] = (stats[c.area_id]||0)+1 })
    setAreas(areasData||[])
    setAreaStats(stats)
    setEvents(eventsData||[])
    setLoading(false)
  }

  const totalDogs = Object.values(areaStats).reduce((a,b)=>a+b,0)

  const filteredAreas = areas.filter(a => {
    if (filterFenced && !a.fenced) return false
    if (filterMinDogs>0 && (areaStats[a.id]||0)<filterMinDogs) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.city?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const COLORS = ['#F97316','#3B82F6','#10B981','#8B5CF6','#EF4444','#F59E0B','#EC4899','#14B8A6']

  const handleAddFriend = async (dog) => {
    if (!user || dogs.length===0) return
    const myDog = dogs[0]
    const { error } = await supabase.from('dog_friendships').insert({
      dog_id_1: myDog.id, dog_id_2: dog.id, created_by: user.id, status: 'pending'
    })
    if (!error) alert(`Richiesta inviata a ${dog.name}! 🐾`)
  }

  if (subScreen === 'nearby-dogs') return (
    <NearbyDogsScreen
      onBack={() => setSubScreen(null)}
      onChat={(id) => { setSubScreen(null); onChat && onChat(id) }}
      onAddFriend={handleAddFriend}
    />
  )

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center justify-between border-b border-gray-100">
        <button className="relative"><Bell className="w-6 h-6 text-gray-700" /></button>
        <div className="flex items-center gap-0.5">
          <span className="text-2xl font-black" style={{color:'#F97316',fontFamily:'Fredoka, sans-serif'}}>QU</span>
          <span className="text-2xl font-black" style={{color:'#1E3A8A',fontFamily:'Fredoka, sans-serif'}}>ilazampa</span>
          <span className="text-2xl font-black" style={{color:'#F97316'}}>!</span>
        </div>
        <button onClick={() => setShowFilter(!showFilter)}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${showFilter?'bg-orange-500':'bg-gray-100'}`}>
          <SlidersHorizontal className={`w-5 h-5 ${showFilter?'text-white':'text-gray-700'}`} />
        </button>
      </div>

      {showFilter && (
        <div className="bg-white px-4 py-3 border-b border-orange-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-gray-900">Filtra aree</h3>
            <button onClick={() => { setFilterFenced(false); setFilterMinDogs(0); setSearch('') }}
              className="text-xs text-orange-600 font-bold">Reset</button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Cerca area o città..." className="flex-1 bg-transparent text-sm outline-none" />
              {search && <button onClick={()=>setSearch('')}><X className="w-4 h-4 text-gray-400" /></button>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={()=>setFilterFenced(!filterFenced)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${filterFenced?'bg-green-500 text-white':'bg-gray-100 text-gray-600'}`}>
                🔒 Solo recintate
              </button>
              {[0,1,3,5].map(n=>(
                <button key={n} onClick={()=>setFilterMinDogs(n)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${filterMinDogs===n?'bg-orange-500 text-white':'bg-gray-100 text-gray-600'}`}>
                  {n===0?'Tutti':`≥${n} cani`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showFilter && (
        <div className="bg-white px-4 pb-3">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Cerca area, città..." className="flex-1 bg-transparent text-sm outline-none text-gray-700" />
            {search && <button onClick={()=>setSearch('')}><X className="w-4 h-4 text-gray-400" /></button>}
          </div>
        </div>
      )}

      {/* Stats cliccabili */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <button onClick={() => onTabChange('map')}
          className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md active:scale-95">
          <div className="text-xl">🗺️</div>
          <div className="text-xl font-black text-gray-900">{areas.length}</div>
          <div className="text-[10px] text-gray-500">Aree attive</div>
        </button>
        <button onClick={() => setSubScreen('nearby-dogs')}
          className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md active:scale-95">
          <div className="text-xl">🐕</div>
          <div className="text-xl font-black text-orange-500">{totalDogs}</div>
          <div className="text-[10px] text-gray-500">Cani ora fuori</div>
        </button>
        <button onClick={() => onTabChange('events')}
          className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md active:scale-95">
          <div className="text-xl">📅</div>
          <div className="text-xl font-black text-blue-500">{events.length}</div>
          <div className="text-[10px] text-gray-500">Eventi vicini</div>
        </button>
      </div>

      {/* Aree */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900">Aree cani vicine</h3>
          <button onClick={()=>onTabChange('map')} className="text-xs text-orange-600 font-bold flex items-center gap-1">
            Vedi mappa <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {filteredAreas.map((area,i)=>{
            const count=areaStats[area.id]||0
            const color=COLORS[i%COLORS.length]
            return (
              <button key={area.id} onClick={()=>onAreaSelect(area)}
                className="w-full bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md text-left active:scale-95">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{background:color+'20'}}>🌳</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-gray-900 truncate">{area.name}</h4>
                    {area.fenced&&<span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">REC.</span>}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <span><PawPrint className="w-3 h-3 inline" style={{color}} /> {count} cani</span>
                    <span><MapPin className="w-3 h-3 inline" /> {area.city}</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0"
                  style={{backgroundColor:color+'20',color}}>{count}</div>
              </button>
            )
          })}
          {filteredAreas.length===0&&(
            <div className="text-center py-6 text-gray-500 text-sm bg-white rounded-2xl">Nessuna area trovata</div>
          )}
        </div>
      </div>

      {/* Prossimi eventi */}
      {events.length>0&&(
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">Prossimi eventi</h3>
            <button onClick={()=>onTabChange('events')} className="text-xs text-orange-600 font-bold flex items-center gap-1">
              Tutti <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {events.map(ev=>(
              <button key={ev.id} onClick={()=>onEventSelect(ev)}
                className="w-full bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md text-left active:scale-95">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{background:'#FED7AA'}}>{ev.emoji||'🐾'}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-gray-900 truncate">{ev.title}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(ev.date).toLocaleDateString('it-IT',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-orange-600">{ev.participants_count||0}/{ev.max_participants}</div>
                  <div className="text-[10px] text-gray-500">part.</div>
                  <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {dogs.length===0&&(
        <div className="mx-4 mb-4 bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">🐕</div>
          <p className="font-bold text-gray-900 text-sm">Aggiungi il tuo cane!</p>
          <p className="text-xs text-gray-600">Senza un cane non puoi fare check-in</p>
        </div>
      )}
    </div>
  )
}
