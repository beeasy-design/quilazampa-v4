import React, { useState } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import AreaPage from './pages/AreaPage'
import EventsPage from './pages/EventsPage'
import AdoptionsPage from './pages/AdoptionsPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import AdminPanel from './pages/AdminPanel'
import { Home, Map, PawPrint, Calendar, User, MessageCircle } from 'lucide-react'

function AppContent() {
  const { user, dogs, loading } = useAuth()
  const [tab, setTab] = useState('home')
  const [screen, setScreen] = useState('main')
  const [selectedArea, setSelectedArea] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [chatReceiver, setChatReceiver] = useState(null)

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #FEF3C7, #FED7AA)' }}>
      <div className="text-6xl mb-4 animate-bounce">🐾</div>
      <div className="flex items-center gap-0.5">
        <span className="text-3xl font-black" style={{ color: '#F97316', fontFamily: 'Fredoka, sans-serif' }}>QU</span>
        <span className="text-3xl font-black" style={{ color: '#1E3A8A', fontFamily: 'Fredoka, sans-serif' }}>ilazampa</span>
        <span className="text-3xl font-black" style={{ color: '#F97316' }}>!</span>
      </div>
    </div>
  )

  if (!user) return <AuthPage />

  if (dogs.length === 0 && screen !== 'onboarding') {
    return (
      <div className="min-h-screen flex items-start justify-center"
        style={{ background: 'linear-gradient(135deg, #FEF3C7, #FED7AA)' }}>
        <div className="w-full bg-white shadow-2xl flex flex-col" style={{ maxWidth: '430px', minHeight: '100svh' }}>
          <OnboardingPage onComplete={() => setScreen('main')} />
        </div>
      </div>
    )
  }

  const goMain = () => { setScreen('main'); setSelectedArea(null); setSelectedEvent(null) }

  const handleAreaSelect = (area) => { setSelectedArea(area); setScreen('area') }
  const handleEventSelect = (event) => { setSelectedEvent(event); setTab('events'); setScreen('main') }
  const handleChat = (receiverId) => {
    setChatReceiver(receiverId)
    setTab('chat')
    setScreen('main')
    setSelectedArea(null)
  }
  const handleTabChange = (t) => { setTab(t); setScreen('main'); setSelectedArea(null) }

  const renderMain = () => {
    if (screen === 'onboarding') return <OnboardingPage onComplete={() => setScreen('main')} />
    if (screen === 'area' && selectedArea) return <AreaPage area={selectedArea} onBack={goMain} onChat={handleChat} />
    if (screen === 'admin') return <AdminPanel onBack={goMain} />

    switch (tab) {
      case 'home': return <HomePage onAreaSelect={handleAreaSelect} onTabChange={handleTabChange} onEventSelect={handleEventSelect} />
      case 'map': return <MapPage onAreaSelect={handleAreaSelect} />
      case 'events': return <EventsPage initialEvent={selectedEvent} />
      case 'adoptions': return <AdoptionsPage />
      case 'chat': return <ChatPage initialReceiverId={chatReceiver} />
      case 'profile': return (
        <ProfilePage
          onAddDog={() => setScreen('onboarding')}
          onAdminPanel={() => setScreen('admin')}
          onChat={handleChat}
        />
      )
      default: return <HomePage onAreaSelect={handleAreaSelect} onTabChange={handleTabChange} onEventSelect={handleEventSelect} />
    }
  }

  const showNav = !['area', 'onboarding', 'admin'].includes(screen)

  const NAV = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'map', icon: Map, label: 'Mappa' },
    { id: 'events', icon: Calendar, label: 'Eventi' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'profile', icon: User, label: 'Profilo' },
  ]

  return (
    <div className="min-h-screen flex items-start justify-center"
      style={{ background: 'linear-gradient(135deg, #FEF3C7, #FED7AA)' }}>
      <div className="w-full bg-white shadow-2xl overflow-hidden flex flex-col"
        style={{ maxWidth: '430px', minHeight: '100svh' }}>
        <div className="hidden sm:flex bg-white px-6 py-2 items-center justify-between text-xs font-semibold border-b border-gray-50 flex-shrink-0">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 16 12">
              <path d="M1 8h2v3H1zM5 6h2v5H5zM9 4h2v7H9zM13 2h2v9h-2z" />
            </svg>
            <div className="w-6 h-3 border border-gray-900 rounded-sm flex items-center px-0.5">
              <div className="w-4/5 h-full bg-gray-900 rounded-sm" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">{renderMain()}</div>
        {showNav && (
          <div className="bg-white border-t border-gray-200 flex justify-around items-center py-2 flex-shrink-0"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
            {NAV.map(item => {
              const Icon = item.icon
              const active = tab === item.id && screen === 'main'
              return (
                <button key={item.id} onClick={() => handleTabChange(item.id)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1">
                  <Icon className={`w-5 h-5 ${active ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className={`text-[10px] ${active ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>{item.label}</span>
                </button>
              )
            })}
          </div>
        )}
        <div className="bg-white pb-1 flex justify-center flex-shrink-0">
          <div className="w-32 h-1 bg-gray-900 rounded-full opacity-20" />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>
}
