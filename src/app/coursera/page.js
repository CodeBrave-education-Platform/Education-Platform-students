'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { createClient } from '@/utils/supabase/client'
import {
  Search,
  Bell,
  ChevronDown,
  Star,
  BookOpen,
  Briefcase,
  GraduationCap,
  Clock,
  CheckCircle2,
  X,
  TrendingUp,
  Award,
  ExternalLink,
  Info,
  Sliders,
  Play,
  Plus,
  Edit2,
  Trash2,
  Settings,
  Eye,
  Save,
  Check,
  RefreshCw
} from 'lucide-react'

// --- DEFAULT COURSERA DATA ---
const DEFAULT_COURSES = [
  {
    id: 1,
    title: 'Financial Management Specialization',
    partner: 'University of Illinois at Urbana-Champaign',
    partnerLogo: 'UIUC',
    rating: 4.8,
    reviews: '12,402',
    type: 'Specialization • 7 Course Series',
    level: 'Beginner',
    hours: 'Approx. 8 months (4 hrs/week)',
    imageBg: 'bg-gradient-to-br from-blue-900 to-indigo-950 text-white',
    badgeColor: 'text-[#0056D2] bg-blue-50 border-blue-100',
    primarySkill: 'Corporate Finance'
  },
  {
    id: 2,
    title: 'Google Data Analytics Professional Certificate',
    partner: 'Google',
    partnerLogo: 'G',
    rating: 4.8,
    reviews: '342,105',
    type: 'Professional Certificate • 8 Course Series',
    level: 'Beginner',
    hours: 'Approx. 6 months (10 hrs/week)',
    imageBg: 'bg-gradient-to-br from-cyan-900 to-teal-950 text-white',
    badgeColor: 'text-teal-700 bg-teal-50 border-teal-100',
    primarySkill: 'R Programming, SQL, Tableau'
  },
  {
    id: 3,
    title: 'Machine Learning Specialization',
    partner: 'Stanford University',
    partnerLogo: 'SU',
    rating: 4.9,
    reviews: '185,920',
    type: 'Specialization • 3 Course Series',
    level: 'Intermediate',
    hours: 'Approx. 2 months (10 hrs/week)',
    imageBg: 'bg-gradient-to-br from-red-950 to-orange-950 text-white',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-100',
    primarySkill: 'Supervised Learning, Deep Learning'
  },
  {
    id: 4,
    title: 'IBM Data Science Professional Certificate',
    partner: 'IBM',
    partnerLogo: 'IBM',
    rating: 4.6,
    reviews: '89,451',
    type: 'Professional Certificate • 10 Course Series',
    level: 'Beginner',
    hours: 'Approx. 5 months (10 hrs/week)',
    imageBg: 'bg-gradient-to-br from-purple-900 to-violet-950 text-white',
    badgeColor: 'text-purple-700 bg-purple-50 border-purple-100',
    primarySkill: 'Python, Machine Learning'
  }
]

export default function CourseraShowcase() {
  // Navigation states
  const [isExploreOpen, setIsExploreOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Simulation / Display states
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isToastVisible, setIsToastVisible] = useState(true)

  // Mode Selection: "student" or "admin"
  const [viewMode, setViewMode] = useState('student') // 'student' | 'admin'

  // Admin dynamic options (stored in state & loaded from localStorage)
  const supabase = createClient()
  const [courses, setCourses] = useState(DEFAULT_COURSES)
  const [themeColor, setThemeColor] = useState('#0056D2') // Coursera Brand Blue
  const [promoTitle, setPromoTitle] = useState('Google Advanced Data Analytics')
  const [promoPartner, setPromoPartner] = useState('Offered by Google Cloud Team')
  const [promoPrice, setPromoPrice] = useState('$39 / Month (Subscription)')
  const [promoBenefit1, setPromoBenefit1] = useState('Master Python programming, regression models, and statistical analysis.')
  const [promoBenefit2, setPromoBenefit2] = useState('Create portfolios of machine learning projects to present to employers.')
  const [promoBenefit3, setPromoBenefit3] = useState('Receive a globally accredited professional certificate directly from Google.')
  const [toastTitle, setToastTitle] = useState('Deadline Approaching')
  const [toastDesc, setToastDesc] = useState('Your final examination for Machine Learning Specialization cohort closes in 14 hours.')

  // Course editing states
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPartner, setEditPartner] = useState('')
  const [editRating, setEditRating] = useState(4.8)
  const [editReviews, setEditReviews] = useState('10,000')
  const [editType, setEditType] = useState('Specialization • 4 Course Series')
  const [editLevel, setEditLevel] = useState('Beginner')
  const [editHours, setEditHours] = useState('Approx. 3 months (6 hrs/week)')
  const [editSkill, setEditSkill] = useState('Data Analysis')
  const [editImageBg, setEditImageBg] = useState('bg-gradient-to-br from-blue-900 to-indigo-950 text-white')

  // Load from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCourses = localStorage.getItem('cs_courses')
      const savedTheme = localStorage.getItem('cs_themeColor')
      const savedPromoTitle = localStorage.getItem('cs_promoTitle')
      const savedPromoPartner = localStorage.getItem('cs_promoPartner')
      const savedPromoPrice = localStorage.getItem('cs_promoPrice')
      const savedPromoBenefit1 = localStorage.getItem('cs_promoB1')
      const savedPromoBenefit2 = localStorage.getItem('cs_promoB2')
      const savedPromoBenefit3 = localStorage.getItem('cs_promoB3')
      const savedToastTitle = localStorage.getItem('cs_toastTitle')
      const savedToastDesc = localStorage.getItem('cs_toastDesc')

      const fetchCourses = async () => {
        const { data, error } = await supabase.from('coursera_courses').select('*').order('created_at', { ascending: true })
        if (data && data.length > 0) setCourses(data)
      }
      fetchCourses()

      if (savedTheme) setThemeColor(savedTheme)
      if (savedPromoTitle) setPromoTitle(savedPromoTitle)
      if (savedPromoPartner) setPromoPartner(savedPromoPartner)
      if (savedPromoPrice) setPromoPrice(savedPromoPrice)
      if (savedPromoBenefit1) setPromoBenefit1(savedPromoBenefit1)
      if (savedPromoBenefit2) setPromoBenefit2(savedPromoBenefit2)
      if (savedPromoBenefit3) setPromoBenefit3(savedPromoBenefit3)
      if (savedToastTitle) setToastTitle(savedToastTitle)
      if (savedToastDesc) setToastDesc(savedToastDesc)
    }
  }, [])

  // Helper to save state changes
  const saveState = (key, val, stateSetter) => {
    stateSetter(val)
    localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val))
  }

  // Course handlers
  const handleAddNewCourse = () => {
    const newCourse = {
      id: Date.now(),
      title: 'New Custom Course Pathway',
      partner: 'Asentra University',
      partnerLogo: 'AU',
      rating: 5.0,
      reviews: '1',
      type: 'Specialization • 4 Course Series',
      level: 'Beginner',
      hours: 'Approx. 4 months (5 hrs/week)',
      imageBg: 'bg-gradient-to-br from-emerald-900 to-teal-950 text-white',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      primarySkill: 'Artificial Intelligence'
    }
    const updated = [...courses, newCourse]
    saveState('cs_courses', updated, setCourses)
  }

  const handleStartEdit = (course) => {
    setEditingCourseId(course.id)
    setEditTitle(course.title)
    setEditPartner(course.partner)
    setEditRating(course.rating)
    setEditReviews(course.reviews)
    setEditType(course.type)
    setEditLevel(course.level)
    setEditHours(course.hours)
    setEditSkill(course.primarySkill)
    setEditImageBg(course.imageBg)
  }

  const handleSaveEdit = (id) => {
    const updated = courses.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          title: editTitle,
          partner: editPartner,
          rating: Number(editRating) || 4.5,
          reviews: editReviews,
          type: editType,
          level: editLevel,
          hours: editHours,
          primarySkill: editSkill,
          imageBg: editImageBg
  const handleSaveCourse = async () => {
    if (!editTitle.trim()) return

    const newCourse = {
      id: editingCourseId || Date.now(),
      title: editTitle,
      partner: editPartner,
      partnerLogo: editPartner ? editPartner.substring(0, 2).toUpperCase() : 'CC',
      rating: editRating,
      reviews: editReviews,
      type: editType,
      level: editLevel,
      hours: editHours,
      imageBg: editImageBg,
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-100',
      primarySkill: editSkill
    }

    if (editingCourseId) {
      await supabase.from('coursera_courses').update(newCourse).eq('id', editingCourseId)
      const updated = courses.map(c => c.id === editingCourseId ? newCourse : c)
      setCourses(updated)
    } else {
      await supabase.from('coursera_courses').insert([newCourse])
      const updated = [...courses, newCourse]
      setCourses(updated)
    }

    closeCourseModal()
  }

  const handleDeleteCourse = async (id) => {
    await supabase.from('coursera_courses').delete().eq('id', id)
    const updated = courses.filter(c => c.id !== id)
    setCourses(updated)
  }

  const handleResetDefaults = () => {
    localStorage.clear()
    setCourses(DEFAULT_COURSES)
    setThemeColor('#0056D2')
    setPromoTitle('Google Advanced Data Analytics')
    setPromoPartner('Offered by Google Cloud Team')
    setPromoPrice('$39 / Month (Subscription)')
    setPromoBenefit1('Master Python programming, regression models, and statistical analysis.')
    setPromoBenefit2('Create portfolios of machine learning projects to present to employers.')
    setPromoBenefit3('Receive a globally accredited professional certificate directly from Google.')
    setToastTitle('Deadline Approaching')
    setToastDesc('Your final examination for Machine Learning Specialization cohort closes in 14 hours.')
    setEditingCourseId(null)
    setIsToastVisible(true)
  }

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleOutsideClick = () => {
      setIsExploreOpen(false)
      setIsProfileOpen(false)
      setIsNotificationsOpen(false)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans text-[#1F1F1F] select-none flex flex-col antialiased">
      
      {/* ADMIN CONTROL PANEL HEADER STRIP */}
      <div className="bg-[#1F1F1F] text-white py-2 px-4 border-b border-zinc-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-black uppercase tracking-widest text-[#E1E1E1]">Asentra Admin Framework</span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 flex">
              <button
                onClick={() => setViewMode('student')}
                className={`px-3 py-1 text-[11px] font-extrabold rounded-md uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'student'
                    ? 'bg-[#0056D2] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Student Preview</span>
              </button>
              <button
                onClick={() => setViewMode('admin')}
                className={`px-3 py-1 text-[11px] font-extrabold rounded-md uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'admin'
                    ? 'bg-[#0056D2] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            </div>

            <button
              onClick={handleResetDefaults}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border border-zinc-700"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* A. GLOBAL HEADER NAVIGATION */}
      <header className="sticky top-10 z-40 bg-white border-b border-[#E1E1E1] shadow-sm select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Logo and Explore Menu */}
            <div className="flex items-center gap-6 shrink-0">
              <Link 
                href="/coursera" 
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Replicating Coursera's clean Blue geometric wordmark logo */}
                <span 
                  className="font-black text-2xl tracking-tighter uppercase font-sans transition-colors"
                  style={{ color: themeColor }}
                >
                  coursera
                </span>
                <span className="text-[10px] font-bold tracking-widest text-[#5C5C5C] bg-[#E1E1E1]/40 px-1.5 py-0.5 rounded uppercase">
                  Showcase
                </span>
              </Link>

              {/* Explore Button and Dropdown wrapper */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsExploreOpen(!isExploreOpen)}
                  className="hidden md:flex items-center gap-1.5 text-white px-4 py-2 rounded font-bold text-sm tracking-wide transition-colors cursor-pointer"
                  style={{ backgroundColor: themeColor }}
                >
                  <span>Explore</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExploreOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mega-Menu Dropdown */}
                {isExploreOpen && (
                  <div className="absolute left-0 mt-3.5 w-[760px] bg-white border border-[#E1E1E1] shadow-xl rounded-lg overflow-hidden flex z-50 animate-in fade-in duration-100">
                    
                    {/* Column 1: Subject Verticals */}
                    <div className="w-1/3 bg-[#F5F7FA] p-6 border-r border-[#E1E1E1]">
                      <h4 className="text-xs font-black uppercase text-[#5C5C5C] tracking-widest mb-4">Subject Verticals</h4>
                      <ul className="space-y-3">
                        {['Data Science', 'Computer Science', 'Business', 'Information Technology', 'Health & Medicine', 'Math & Logic'].map((subj) => (
                          <li key={subj}>
                            <button className="text-sm font-semibold text-[#1F1F1F] hover:text-[#0056D2] text-left w-full transition-colors cursor-pointer">
                              {subj}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 2: Certificate Bundles */}
                    <div className="w-1/3 p-6 border-r border-[#E1E1E1]">
                      <h4 className="text-xs font-black uppercase text-[#5C5C5C] tracking-widest mb-4">Certificates</h4>
                      <ul className="space-y-3">
                        {['Google Career Certs', 'IBM Data Analytics', 'Meta Marketing Certificate', 'Microsoft Cloud Support', 'AWS Cloud Architect'].map((cert) => (
                          <li key={cert}>
                            <button className="text-sm font-semibold text-[#1F1F1F] hover:text-[#0056D2] text-left w-full transition-colors cursor-pointer">
                              {cert}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 3: Degrees */}
                    <div className="w-1/3 p-6 bg-blue-50/20">
                      <h4 className="text-xs font-black uppercase text-[#5C5C5C] tracking-widest mb-4">Online Degrees</h4>
                      <ul className="space-y-3">
                        {['Master of Computer Science', 'Bachelor of Business Admin', 'MS in Data Science', 'MBA - Illinois iMBA', 'MS in Management'].map((deg) => (
                          <li key={deg}>
                            <button className="text-sm font-bold hover:underline text-left w-full transition-colors cursor-pointer flex items-center gap-1" style={{ color: themeColor }}>
                              <span>{deg}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                )}
              </div>
            </div>

            {/* Centralized Search Bar */}
            <div className="flex-1 max-w-xl hidden sm:block">
              <div 
                className={`relative flex items-center border rounded-full transition-all duration-150 overflow-hidden ${
                  searchFocused 
                    ? 'ring-2 bg-white' 
                    : 'border-[#A3A3A3] bg-white'
                }`}
                style={{ borderColor: searchFocused ? themeColor : '#A3A3A3', boxShadow: searchFocused ? `${themeColor}20 0px 0px 0px 4px` : 'none' }}
              >
                <input
                  type="text"
                  placeholder="What do you want to learn?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full pl-5 pr-12 py-2 text-sm focus:outline-none text-[#1F1F1F] placeholder-[#5C5C5C]"
                />
                <button className="absolute right-1 text-white p-1.5 rounded-full transition-colors cursor-pointer" style={{ backgroundColor: themeColor }}>
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Aligned Navigation */}
            <div className="flex items-center gap-4">
              
              {/* Notification Bell */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen)
                    setIsProfileOpen(false)
                  }}
                  className="p-2 text-[#5C5C5C] hover:text-[#1F1F1F] rounded-full hover:bg-slate-100 transition-colors cursor-pointer relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full" />
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-[#E1E1E1] shadow-xl rounded-lg py-2 z-40 animate-in fade-in duration-100">
                    <div className="px-4 py-2 border-b border-[#E1E1E1] flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-[#5C5C5C] tracking-wide">Notifications</span>
                      <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded">NEW</span>
                    </div>
                    <div className="p-3 space-y-2.5">
                      <div className="p-2 bg-blue-50/50 rounded border border-blue-100/30">
                        <p className="text-xs font-bold text-[#1F1F1F]">Course Launch: Advanced R Programming</p>
                        <p className="text-[10px] text-[#5C5C5C] mt-0.5">Google Certificate team updated syllabus.</p>
                      </div>
                      <div className="p-2 hover:bg-slate-50 rounded transition-colors">
                        <p className="text-xs font-semibold text-[#1F1F1F]">Review Deadline approaching</p>
                        <p className="text-[10px] text-[#5C5C5C] mt-0.5">Submit Peer Review by 11:59 PM tomorrow.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar Pill Dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen)
                    setIsNotificationsOpen(false)
                  }}
                  className="flex items-center gap-1 hover:bg-slate-100 p-1.5 rounded-full cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-sm" style={{ backgroundColor: themeColor }}>
                    AS
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5C5C5C]" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white border border-[#E1E1E1] shadow-xl rounded-lg py-1.5 z-40 animate-in fade-in duration-100">
                    <div className="px-4 py-2 border-b border-[#E1E1E1]">
                      <p className="text-xs font-bold text-[#1F1F1F]">Asentra Student</p>
                      <p className="text-[10px] text-[#5C5C5C] truncate">student@asentra.edu</p>
                    </div>
                    <Link href="/dashboard" className="block px-4 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#F5F7FA]">
                      Student Dashboard
                    </Link>
                    <Link href="/profile" className="block px-4 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#F5F7FA]">
                      My Profile
                    </Link>
                    <div className="border-t border-[#E1E1E1] my-1" />
                    <button className="w-full text-left px-4 py-2 text-xs font-bold text-[#DC2626] hover:bg-red-50">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* SPLIT LAYOUT: ADMIN PANEL LEFT, PREVIEW RIGHT (only in admin viewMode) */}
      <div className="flex-grow flex flex-col">
        {viewMode === 'admin' && (
          <div className="bg-[#1E293B] border-b border-[#334155] text-slate-100 py-8 select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Admin CMS Controller Console</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure primary design tokens, course lists, deadline banners, and recommendation parameters. Changes reflect instantly below.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                
                {/* 1. Global Customizer */}
                <div className="bg-[#0F172A] p-5 rounded-lg border border-[#334155] space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-[#334155] pb-2">Global Tokens</h3>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Primary Theme Color</label>
                    <div className="flex gap-2.5 mt-1.5">
                      {[
                        { color: '#0056D2', name: 'Coursera Blue' },
                        { color: '#0F766E', name: 'Teal' },
                        { color: '#6366F1', name: 'Indigo' },
                        { color: '#BE123C', name: 'Rose' },
                        { color: '#1E293B', name: 'Slate' }
                      ].map((th) => (
                        <button
                          key={th.color}
                          onClick={() => setThemeColor(th.color)}
                          className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer relative ${
                            themeColor === th.color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: th.color }}
                          title={th.name}
                        >
                          {themeColor === th.color && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-bold">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">State Simulation</label>
                    <div className="flex gap-2.5 mt-1.5">
                      <button
                        onClick={() => setIsLoading(true)}
                        className={`flex-1 py-1.5 px-3 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                          isLoading
                            ? 'bg-amber-600/30 text-amber-300 border-amber-500'
                            : 'bg-[#1E293B] text-slate-350 border-slate-700 hover:bg-[#334155]'
                        }`}
                      >
                        Force Skeleton
                      </button>
                      <button
                        onClick={() => setIsLoading(false)}
                        className={`flex-1 py-1.5 px-3 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                          !isLoading
                            ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                            : 'bg-[#1E293B] text-slate-350 border-slate-700 hover:bg-[#334155]'
                        }`}
                      >
                        Force Hydrated
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Modal Configuration */}
                <div className="bg-[#0F172A] p-5 rounded-lg border border-[#334155] space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-[#334155] pb-2">Launch Program Modal</h3>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Program Title</label>
                      <input
                        type="text"
                        value={promoTitle}
                        onChange={(e) => saveState('cs_promoTitle', e.target.value, setPromoTitle)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Offer/Sub-label</label>
                      <input
                        type="text"
                        value={promoPartner}
                        onChange={(e) => saveState('cs_promoPartner', e.target.value, setPromoPartner)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Subscription Price Tag</label>
                      <input
                        type="text"
                        value={promoPrice}
                        onChange={(e) => saveState('cs_promoPrice', e.target.value, setPromoPrice)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Toast alerts & Actions */}
                <div className="bg-[#0F172A] p-5 rounded-lg border border-[#334155] space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-[#334155] pb-2">Toast & Cohort Alerts</h3>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Toast Alert Title</label>
                      <input
                        type="text"
                        value={toastTitle}
                        onChange={(e) => saveState('cs_toastTitle', e.target.value, setToastTitle)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Toast Description</label>
                      <textarea
                        rows={2}
                        value={toastDesc}
                        onChange={(e) => saveState('cs_toastDesc', e.target.value, setToastDesc)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 mt-1 resize-none"
                      />
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => setIsToastVisible(true)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        <span>Force Show Deadline Toast</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* HERO REGION */}
        <section className="bg-white border-b border-[#E1E1E1] py-12 select-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded" style={{ color: themeColor, backgroundColor: `${themeColor}10` }}>
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Coursera UI Architecture Showcase</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1F1F1F] tracking-tight leading-[1.1] font-sans">
                  Build Career-Ready Skills with a <span style={{ color: themeColor }}>Premium Component System</span>
                </h1>
                <p className="text-base text-[#5C5C5C] leading-relaxed max-w-xl">
                  This environment showcases the Coursera Design Tokens (CDS) using Next.js and Tailwind CSS. Toggle the loading simulation below to verify zero layout shifts.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-white px-6 py-3 rounded font-bold text-sm tracking-wide transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Launch Specialization Program</span>
                  </button>
                  <button 
                    onClick={() => setIsLoading(!isLoading)}
                    className={`px-5 py-3 rounded font-bold text-sm tracking-wide border transition-all cursor-pointer ${
                      isLoading 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-white text-[#1F1F1F] border-[#A3A3A3] hover:bg-slate-50'
                    }`}
                  >
                    {isLoading ? 'Hydrate Components' : 'Simulate Skeleton State'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative bg-[#F5F7FA] border border-[#E1E1E1] p-6 rounded-2xl shadow-inner">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-[#E1E1E1]">
                    <span className="text-xs font-black uppercase text-[#5C5C5C] tracking-wide">System Parameters</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded uppercase">Connected</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3.5 border border-[#E1E1E1] rounded">
                      <p className="text-[10px] uppercase font-bold text-[#5C5C5C] tracking-wider">Theme Mode</p>
                      <p className="text-sm font-bold text-[#1F1F1F] mt-1" style={{ color: themeColor }}>Coursera Light</p>
                    </div>
                    <div className="bg-white p-3.5 border border-[#E1E1E1] rounded">
                      <p className="text-[10px] uppercase font-bold text-[#5C5C5C] tracking-wider">Hydration State</p>
                      <p className="text-sm font-bold text-[#1F1F1F] mt-1">{isLoading ? 'Loading Skeleton' : 'Active (Hydrated)'}</p>
                    </div>
                    <div className="bg-white p-3.5 border border-[#E1E1E1] rounded">
                      <p className="text-[10px] uppercase font-bold text-[#5C5C5C] tracking-wider">Tailwind Version</p>
                      <p className="text-sm font-bold text-[#1F1F1F] mt-1">v4.0.0-beta</p>
                    </div>
                    <div className="bg-white p-3.5 border border-[#E1E1E1] rounded">
                      <p className="text-[10px] uppercase font-bold text-[#5C5C5C] tracking-wider">Layout Shift (CLS)</p>
                      <p className="text-sm font-bold text-emerald-700 mt-1">0.000 (Perfect)</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* B. BENTO COURSE GRID & C. LOADING STATE MECHANICS */}
        <main className="flex-grow py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 select-none">
              <div>
                <h2 className="text-2xl font-black text-[#1F1F1F] tracking-tight">
                  Recommended Programs & Degrees
                </h2>
                <p className="text-sm text-[#5C5C5C] mt-1">
                  Explore specialized career pathways designed by industry leaders and top universities.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Admin Mode Quick Action */}
                {viewMode === 'admin' && (
                  <button
                    onClick={handleAddNewCourse}
                    className="bg-[#2A7B4C] hover:bg-[#205E3A] text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Course Card</span>
                  </button>
                )}

                {/* Status indicator */}
                <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] px-3.5 py-1.5 rounded-full text-xs font-semibold">
                  <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-[#5C5C5C]">Status:</span>
                  <span className="text-[#1F1F1F] font-bold">{isLoading ? 'Simulating Latency...' : 'Hydrated (Instant Eager Loaded)'}</span>
                </div>
              </div>
            </div>

            {/* Grid Layout Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading
                ? // --- SKELETON LAYOUT ---
                  Array.from({ length: Math.max(courses.length, 4) }).map((_, idx) => (
                    <div 
                      key={idx}
                      className="bg-white border border-[#E1E1E1] rounded-lg overflow-hidden flex flex-col justify-between h-[394px]"
                    >
                      <div>
                        {/* Thumbnail Placeholder */}
                        <div className="h-32 bg-slate-200 animate-pulse" />
                        
                        <div className="p-4 space-y-3">
                          {/* Partner Logo and Name Placeholder */}
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-200 animate-pulse shrink-0" />
                            <div className="h-3.5 bg-slate-200 rounded w-2/3 animate-pulse" />
                          </div>
                          
                          {/* Title Placeholders (precise line heights) */}
                          <div className="space-y-1.5 mt-2">
                            <div className="h-5 bg-slate-200 rounded w-11/12 animate-pulse" />
                            <div className="h-5 bg-slate-200 rounded w-4/5 animate-pulse" />
                          </div>
                          
                          {/* Skill Badge Placeholder */}
                          <div className="h-6 bg-slate-200 rounded-full w-2/5 animate-pulse mt-2" />
                        </div>
                      </div>

                      <div className="p-4 pt-0 space-y-3">
                        {/* Rating row placeholder */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-200 animate-pulse" />
                          <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
                        </div>
                        
                        {/* Volume and level indicators */}
                        <div className="space-y-1">
                          <div className="h-3.5 bg-slate-200 rounded w-3/4 animate-pulse" />
                          <div className="h-3.5 bg-slate-200 rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))
                : // --- HYDRATED ACTIVE LAYOUT ---
                  courses.map((course) => (
                    <div key={course.id} className="bg-white border border-[#E1E1E1] hover:shadow-md transition-shadow duration-200 rounded-lg overflow-hidden flex flex-col justify-between h-[394px] cursor-pointer select-none group relative">
                      {/* Course Card Cover Image & Level Badge */}
                      <div className="relative h-40 bg-slate-100 overflow-hidden">
                        <img 
                          src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 text-white rounded text-[10px] font-bold uppercase">
                          {course.level || 'Foundation'}
                        </span>
                      </div>

                      {/* Course Card Details */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <div className="space-y-1.5">
                          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {course.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-sm font-black text-slate-900">
                            {Number(course.price) === 0 ? 'Free' : `₹${course.price}`}
                          </span>
                          <Link 
                            href={`/courses/${course.id}`}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold transition"
                          >
                            Explore Course
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}