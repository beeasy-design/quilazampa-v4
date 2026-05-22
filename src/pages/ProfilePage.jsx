import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { PawPrint, Shield, ChevronRight, Bell, Settings, Edit3, Plus, LogOut, Crown, X, Check, Heart, MessageCircle, Camera } from 'lucide-react'

const TRAITS = ['Socievole','Energico','Tranquillo','Giocoso','Timido','Protettivo','Curioso','Indipendente']

function NotificationsSettings({ onClose }) {
  const [s, setS] = useState({ newDog:true, event:true, friend:true, checkin:false })
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onClose}><X className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900">Notifiche</h2>
      </div>
      <div className="p-4 space-y-2">
        {[
          {k:'newDog',l:'Nuovo cane in area preferita',sub:'Avvisami quando arriva un cane'},
          {k:'event',l:'Evento vicino a te',sub:'Raduni e passeggiate nella zona'},
          {k:'friend',l:'Richiesta di amicizia',sub:'Quando un cane ti invia richiesta'},
          {k:'checkin',l:'Check-in automatico',sub:'Suggerisci check-in vicino alle aree'},
        ].map(item=>(
          <div key={item.k} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-semibold text-sm text-gray-900">{item.l}</p>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
            <button onClick={()=>setS(ss=>({...ss,[item.k]:!ss[item.k]}))}
              className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${s[item.k]?'bg-green-500':'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${s[item.k]?'translate-x-6':'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PrivacySettings({ onClose }) {
  const [s, setS] = useState({ invisible:false, location:true, publicProfile:true })
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onClose}><X className="w-6 h-6 text-gray-700" /></button>
        <h2 className="font-bold text-gray-900">Privacy</h2>
      </div>
      <div className="p-4 space-y-2">
        {[
          {k:'invisible',l:'Modalità invisibile',sub:'Non apparire nelle aree cani'},
          {k:'location',l:'Mostra posizione',sub:'Condividi posizione durante check-in'},
          {k:'publicProfile',l:'Profilo pubblico',sub:'Gli altri vedono il tuo cane'},
        ].map(item=>(
          <div key={item.k} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-semibold text-sm text-gray-900">{item.l}</p>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
            <button onClick={()=>setS(ss=>({...ss,[item.k]:!ss[item.k]}))}
              className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${s[item.k]?'bg-green-500':'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${s[item.k]?'translate-x-6':'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AccountSettings({ onClose, profile, user }) {
  const [username, setUsername] = useState(profile?.username||'')
  const [city, setCity] = useState(profile?.city||'')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ username, city }).eq('id', user.id)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000)
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
            <input value={username} onChange={e=>setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Città</label>
            <input value={city} onChange={e=>setCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Email</label>
            <input value={user?.email||''} disabled className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-500" />
          </div>
          <button onClick={save} disabled={saving}
            className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            style={{background:saved?'linear-gradient(135deg,#10B981,#059669)':'linear-gradient(135deg,#F97316,#EA580C)'}}>
            {saved?<><Check className="w-4 h-4"/> Salvato!</>:saving?'...':'Salva modifiche'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Form modifica cane con foto
function DogEditForm({ dog, onSave, onCancel, saving }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: dog.name||'', breed: dog.breed||'', age: dog.age||'',
    age_months: dog.age_months||0, gender: dog.gender||'M',
    size: dog.size||'Media', energy: dog.energy||'Media',
    traits: dog.traits||[], sterilized: dog.sterilized||false,
    description: dog.description||'', photo_url: dog.photo_url||''
  })
  const [uploading, setUploading] = useState(false)

  const toggle = (t) => setForm(f=>({...f, traits:f.traits.includes(t)?f.traits.filter(x=>x!==t):[...f.traits,t]}))

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${dog.id}.${ext}`
    const { error } = await supabase.storage.from('dog-photos').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('dog-photos').getPublicUrl(path)
      setForm(f => ({ ...f, photo_url: data.publicUrl }))
    }
    setUploading(false)
  }

  return (
    <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: '70vh' }}>
      {/* Foto */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center text-3xl relative">
          {form.photo_url ? <img src={form.photo_url} className="w-full h-full object-cover" /> : '🐕'}
        </div>
        <label className="cursor-pointer flex items-center gap-1 text-xs text-orange-600 font-bold">
          <Camera className="w-3 h-3" />
          {uploading ? 'Caricamento...' : 'Cambia foto'}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1">Nome</label>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1">Razza</label>
          <input value={form.breed} onChange={e=>setForm(f=>({...f,breed:e.target.value}))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1">Anni</label>
          <input type="number" min="0" max="30" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1">Mesi</label>
          <input type="number" min="0" max="11" value={form.age_months} onChange={e=>setForm(f=>({...f,age_months:parseInt(e.target.value)||0}))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-600 block mb-1">Sesso</label>
          <div className="flex gap-1">
            {['M','F'].map(g=>(
              <button key={g} type="button" onClick={()=>setForm(f=>({...f,gender:g}))}
                className={`flex-1 py-2 rounded-lg text-xs font-bold ${form.gender===g?'text-white':'bg-gray-100 text-gray-600'}`}
                style={form.gender===g?{background:'linear-gradient(135deg,#F97316,#EA580C)'}:{}}>
                {g==='M'?'♂':'♀'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
        <input type="checkbox" id="ster" checked={form.sterilized} onChange={e=>setForm(f=>({...f,sterilized:e.target.checked}))}
          className="w-4 h-4 rounded accent-blue-500" />
        <label htmlFor="ster" className="text-sm text-gray-700">✂️ Sterilizzato/a</label>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-600 block mb-1">Descrizione</label>
        <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
          placeholder="Racconta qualcosa del tuo cane..." rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none" />
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-600 block mb-1">Carattere</label>
        <div className="flex flex-wrap gap-1">
          {TRAITS.map(t=>(
            <button key={t} type="button" onClick={()=>toggle(t)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold ${form.traits.includes(t)?'bg-orange-500 text-white':'bg-gray-100 text-gray-600'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={()=>onSave(form)} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
          style={{background:'linear-gradient(135deg,#84CC16,#65A30D)'}}>
          {saving?'...':'Salva'}
        </button>
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Annulla</button>
      </div>
    </div>
  )
}

export default function ProfilePage({ onAddDog, onAdminPanel, onChat }) {
  const { user, profile, dogs, isAdmin, signOut, refreshDogs } = useAuth()
  const [editingDog, setEditingDog] = useState(null)
  const [saving, setSaving] = useState(false)
  const [subPage, setSubPage] = useState(null)

  const updateDog = async (id, updates) => {
    setSaving(true)
    await supabase.from('dogs').update({
      ...updates,
      age: parseInt(updates.age)||null,
      age_months: parseInt(updates.age_months)||0
    }).eq('id', id)
    refreshDogs()
    setEditingDog(null)
    setSaving(false)
  }

  const deleteDog = async (id) => {
    if (!confirm('Rimuovere questo cane?')) return
    await supabase.from('dogs').delete().eq('id', id)
    refreshDogs()
  }

  if (subPage==='notifications') return <NotificationsSettings onClose={()=>setSubPage(null)} />
  if (subPage==='privacy') return <PrivacySettings onClose={()=>setSubPage(null)} />
  if (subPage==='settings') return <AccountSettings onClose={()=>setSubPage(null)} profile={profile} user={user} />

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 text-base text-center">Profilo</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-4 pt-5 pb-4 text-white relative overflow-hidden"
          style={{background:'linear-gradient(135deg,#1E3A8A,#3B82F6)'}}>
          <div className="absolute -right-6 -top-6 text-9xl opacity-10">🐾</div>
          <div className="flex items-center gap-3 relative">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl border-2 border-white/40">
              {isAdmin?'👑':'👤'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">{profile?.username||user?.email?.split('@')[0]}</h2>
                {isAdmin&&<Crown className="w-4 h-4 text-yellow-300" fill="#fde68a" />}
              </div>
              <p className="text-xs text-blue-100">{profile?.city||'Città non impostata'}</p>
              <p className="text-xs text-blue-200">{user?.email}</p>
            </div>
            <button onClick={()=>setSubPage('settings')}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isAdmin&&(
          <div className="px-4 mt-3">
            <button onClick={onAdminPanel}
              className="w-full text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md"
              style={{background:'linear-gradient(135deg,#1E3A8A,#3B82F6)'}}>
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
          {dogs.length===0?(
            <button onClick={onAddDog} className="w-full bg-white border-2 border-dashed border-orange-300 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-orange-50">
              <div className="text-4xl">🐕</div>
              <p className="font-semibold text-gray-700 text-sm">Aggiungi il tuo primo cane</p>
            </button>
          ):(
            <div className="space-y-3">
              {dogs.map(dog=>(
                <div key={dog.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {editingDog===dog.id?(
                    <DogEditForm dog={dog} onSave={u=>updateDog(dog.id,u)} onCancel={()=>setEditingDog(null)} saving={saving} />
                  ):(
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-amber-100 flex items-center justify-center text-3xl">
                        {dog.photo_url?<img src={dog.photo_url} className="w-full h-full object-cover"/>:'🐕'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg text-gray-900">{dog.name}</h3>
                          <div className="flex gap-2">
                            <button onClick={()=>setEditingDog(dog.id)} className="text-orange-500 text-xs font-bold">MODIFICA</button>
                            <button onClick={()=>deleteDog(dog.id)} className="text-red-400 text-xs font-bold">RIMUOVI</button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {dog.breed||'Razza sconosciuta'} •
                          {dog.age?` ${dog.age} anni`:''}
                          {dog.age_months?` ${dog.age_months} mesi`:''}
                          {' • '}{dog.gender==='M'?'♂':'♀'}
                          {dog.sterilized?' • ✂️':''}
                        </p>
                        {dog.description&&<p className="text-xs text-gray-500 italic mt-0.5">"{dog.description}"</p>}
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {dog.size&&<span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Taglia {dog.size}</span>}
                          {dog.energy&&<span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Energia {dog.energy}</span>}
                          {(dog.traits||[]).slice(0,2).map((t,i)=>(
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

        {/* Menu */}
        <div className="px-4 mt-4 mb-4">
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            {[
              {icon:Bell,label:'Notifiche',sub:'Personalizza avvisi',action:'notifications',color:'#F97316'},
              {icon:Shield,label:'Privacy',sub:'Modalità invisibile, dati',action:'privacy',color:'#3B82F6'},
              {icon:Settings,label:'Impostazioni',sub:'Account, username, città',action:'settings',color:'#8B5CF6'},
            ].map((item,i)=>{
              const Icon=item.icon
              return (
                <button key={i} onClick={()=>setSubPage(item.action)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{background:item.color+'15'}}>
                    <Icon className="w-4 h-4" style={{color:item.color}} />
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
