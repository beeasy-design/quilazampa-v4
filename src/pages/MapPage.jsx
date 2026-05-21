import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, X, MapPin, Navigation } from 'lucide-react'

const AREA_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#14B8A6']
const PIN_POSITIONS = [
  { x: 48, y: 38 }, { x: 26, y: 22 }, { x: 68, y: 26 },
  { x: 34, y: 60 }, { x: 70, y: 55 }, { x: 18, y: 62 },
  { x: 78, y: 38 }, { x: 54, y: 70 }
]

export default function MapPage({ onAreaSelect }) {
  const [areas, setAreas] = useState([])
  const [areaStats, setAreaStats] = useState({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    const { data: areasData } = await supabase.from('dog_areas').select('*')
    const { data: checkins } = await supabase.from('checkins').select('area_id').eq('active', true)
    const stats = {}
    checkins?.forEach(c => { stats[c.area_id] = (stats[c.area_id] || 0) + 1 })
    setAreas(areasData || [])
    setAreaStats(stats)
  }

  const openInMaps = (area) => {
    window.open(`https://www.google.com/maps?q=${area.lat},${area.lng}&z=16`, '_blank')
  }

  const openAllInMaps = () => {
    window.open(`https://www.google.com/maps/search/aree+cani`, '_blank')
  }

  const filtered = areas.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.city || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalDogs = Object.values(areaStats).reduce((a, b) => a + b, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
        <h2 className="font-bold text-gray-900 text-base text-center mb-2">Mappa Aree Cani</h2>
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca area o città..." className="flex-1 bg-transparent text-sm outline-none" />
          {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
      </div>

      {/* Mappa SVG */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}
          viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          {/* Sfondo */}
          <rect width="100" height="100" fill="#e8f5e9" />
          {/* Grid */}
          <defs>
            <pattern id="g" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#c8e6c9" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#g)" />
          {/* Strade principali */}
          <path d="M 0 50 Q 40 45 60 50 T 100 52" stroke="white" strokeWidth="3" fill="none" />
          <path d="M 50 0 Q 52 30 50 50 T 48 100" stroke="white" strokeWidth="2.5" fill="none" />
          <path d="M 0 28 L 100 26" stroke="white" strokeWidth="1.5" fill="none" opacity="0.8" />
          <path d="M 0 72 L 100 74" stroke="white" strokeWidth="1.5" fill="none" opacity="0.8" />
          <path d="M 25 0 L 22 100" stroke="white" strokeWidth="1.2" fill="none" opacity="0.7" />
          <path d="M 75 0 L 78 100" stroke="white" strokeWidth="1.2" fill="none" opacity="0.7" />
          {/* Parchi verdi */}
          <rect x="8" y="8" width="16" height="12" rx="3" fill="#a5d6a7" opacity="0.7" />
          <rect x="60" y="55" width="18" height="13" rx="3" fill="#a5d6a7" opacity="0.7" />
          <rect x="72" y="8" width="14" height="16" rx="3" fill="#a5d6a7" opacity="0.7" />
          <text x="16" y="15" fontSize="3" fill="#388e3c" textAnchor="middle">🌳</text>
          <text x="69" y="63" fontSize="3" fill="#388e3c" textAnchor="middle">🌳</text>
          {/* Edifici stilizzati */}
          <rect x="30" y="30" width="8" height="8" rx="1" fill="#b0bec5" opacity="0.4" />
          <rect x="55" y="30" width="6" height="10" rx="1" fill="#b0bec5" opacity="0.4" />
          <rect x="40" y="60" width="10" height="8" rx="1" fill="#b0bec5" opacity="0.4" />
        </svg>

        {/* Pin aree cliccabili */}
        {areas.map((area, i) => {
          const pos = PIN_POSITIONS[i % PIN_POSITIONS.length]
          const color = AREA_COLORS[i % AREA_COLORS.length]
          const count = areaStats[area.id] || 0
          return (
            <button key={area.id} onClick={() => onAreaSelect(area)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer', zIndex: 10, background: 'none', border: 'none', padding: 0
              }}>
              {/* Cerchio pin */}
              <div style={{
                width: 42, height: 42, borderRadius: '50%', background: color,
                border: '3px solid white', boxShadow: '0 3px 12px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, position: 'relative'
              }}>
                🐾
                {/* Badge contatore */}
                <div style={{
                  position: 'absolute', top: -8, right: -8,
                  background: count > 0 ? color : '#9CA3AF',
                  color: 'white', fontSize: 9, fontWeight: 900,
                  width: 18, height: 18, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                }}>
                  {count}
                </div>
              </div>
              {/* Punta pin */}
              <div style={{
                width: 0, height: 0,
                borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                borderTop: `8px solid ${color}`, marginTop: -1,
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.15))'
              }} />
              {/* Label */}
              <div style={{
                background: 'white', borderRadius: 6, padding: '2px 6px',
                fontSize: 9, fontWeight: 700, color: '#374151',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)', marginTop: 2,
                whiteSpace: 'nowrap', maxWidth: 85,
                overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {area.name.length > 14 ? area.name.substring(0, 12) + '…' : area.name}
              </div>
            </button>
          )
        })}

        {/* Info badge */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'white', borderRadius: 20, padding: '5px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: 11, fontWeight: 700, color: '#374151',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          🗺️ {areas.length} aree
          <span style={{ color: '#F97316' }}>• 🐾 {totalDogs}</span>
        </div>

        {/* Apri Google Maps */}
        <button onClick={openAllInMaps} style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'white', borderRadius: 20, padding: '5px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: 11, fontWeight: 700, color: '#3B82F6',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          <Navigation style={{ width: 12, height: 12 }} /> Apri Maps
        </button>
      </div>

      {/* Lista aree */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0" style={{ maxHeight: '180px', overflowY: 'auto' }}>
        {filtered.map((area, i) => {
          const count = areaStats[area.id] || 0
          const color = AREA_COLORS[i % AREA_COLORS.length]
          return (
            <div key={area.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100">
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: color + '20', border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
              }}>🐾</div>
              <button onClick={() => onAreaSelect(area)} className="flex-1 text-left min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{area.name}</p>
                <p className="text-xs text-gray-500">
                  {area.city} • <span style={{ color }}>🐾 {count} cani</span>
                  {area.fenced && <span className="ml-1 text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">RECINTATA</span>}
                </p>
              </button>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => openInMaps(area)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: '#DBEAFE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Navigation style={{ width: 12, height: 12, color: '#2563EB' }} />
                </button>
                <button onClick={() => onAreaSelect(area)}
                  style={{ background: 'linear-gradient(135deg,#84CC16,#65A30D)', color: 'white', border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                  Sono qui
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
