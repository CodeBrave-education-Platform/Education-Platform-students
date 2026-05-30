'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { 
  Play, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  BookOpen, 
  ChevronRight, 
  Award,
  Video,
  BookOpenCheck,
  MessageSquare,
  FileText,
  ClipboardList,
  Send,
  Trash2,
  Download,
  AlertCircle,
  Tv,
  ExternalLink,
  Award as AwardIcon
} from 'lucide-react'

export default function CoursePlayerClient({
  course,
  lessons,
  initialLessonId,
  initialCompletedLessonIds,
  initialDoubts,
  liveSessions,
  assessments,
  user
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Read active lesson from URL search parameter '?lesson='
  const activeLessonId = searchParams.get('lesson')
  const currentLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0]

  // Optimistic tracking state for progress checkmarks
  const [completedSet, setCompletedSet] = useState(new Set(initialCompletedLessonIds))
  const debounceTimeoutRef = useRef(null)
  
  // Interactive navigation tabs
  // Options: 'NOTES', 'READING', 'ASSIGNMENT', 'DOUBTS', 'LIVE', 'EXAMS', 'SYLLABUS'
  const [activeTab, setActiveTab] = useState('NOTES')
  
  // Live doubt forum state
  const [doubts, setDoubts] = useState(initialDoubts)
  const [newDoubt, setNewDoubt] = useState('')
  const [isPostingDoubt, setIsPostingDoubt] = useState(false)
  const doubtsEndRef = useRef(null)

  // 1. Silent URL Redirection/Update if lesson param is missing
  useEffect(() => {
    if (!activeLessonId) {
      router.replace(`?lesson=${lessons[0].id}`, { scroll: false })
    }
  }, [activeLessonId, lessons, router])

  // 2. Fetch doubts dynamically on the client when the active lesson changes
  useEffect(() => {
    let active = true
    
    const fetchDoubtsForLesson = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lesson_doubts')
        .select('*, profiles(full_name, email)')
        .eq('lesson_id', currentLesson.id)
        .order('created_at', { ascending: true })

      if (active && !error && data) {
        setDoubts(data)
      }
    }

    // Optimize initial load: skip fetch if current lesson matches initial page load
    const matchesInitial = currentLesson.id === (initialLessonId || lessons[0].id)
    if (matchesInitial) {
      setDoubts(initialDoubts)
    } else {
      fetchDoubtsForLesson()
    }

    return () => {
      active = false
    }
  }, [currentLesson.id, initialLessonId, initialDoubts, lessons])

  // Scroll to bottom of doubts thread when tab changes or doubts update
  useEffect(() => {
    if (activeTab === 'DOUBTS' && doubtsEndRef.current) {
      doubtsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [doubts, activeTab])

  const currentLessonIndex = lessons.findIndex((l) => l.id === currentLesson.id)
  const prevLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex < lessons.length - 1 ? lessons[currentLessonIndex + 1] : null

  // Calculate course completion details
  const percentComplete = lessons.length 
    ? Math.round((completedSet.size / lessons.length) * 100) 
    : 0

  // 3. Optimistic Completion Tracking with 500ms Anti-Spam Debounce
  const handleToggleProgress = (lessonId) => {
    const isCompleted = completedSet.has(lessonId)
    const newCompleted = new Set(completedSet)

    if (isCompleted) {
      newCompleted.delete(lessonId)
    } else {
      newCompleted.add(lessonId)
    }

    // Optimistic Update
    setCompletedSet(newCompleted)

    // Clear any existing debounce timer
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Register debounced network write (500ms window)
    debounceTimeoutRef.current = setTimeout(async () => {
      const supabase = createClient()
      try {
        if (isCompleted) {
          const { error } = await supabase
            .from('user_progress')
            .delete()
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('user_progress')
            .insert({
              user_id: user.id,
              lesson_id: lessonId
            })

          if (error) throw error
        }
      } catch (err) {
        console.error('Failed to sync progress on Supabase:', err)
        setCompletedSet((prev) => {
          const reverted = new Set(prev)
          if (isCompleted) {
            reverted.add(lessonId)
          } else {
            reverted.delete(lessonId)
          }
          return reverted
        })
      }
    }, 500)
  }

  const handlePostDoubt = async (e) => {
    e.preventDefault()
    if (!newDoubt.trim() || isPostingDoubt) return
    setIsPostingDoubt(true)

    const supabase = createClient()
    const mockProfile = {
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      email: user.email
    }

    try {
      const { data, error } = await supabase
        .from('lesson_doubts')
        .insert({
          lesson_id: currentLesson.id,
          user_id: user.id,
          content: newDoubt.trim()
        })
        .select()
        .single()

      if (error) throw error

      const appendedDoubt = {
        ...data,
        profiles: mockProfile
      }
      setDoubts((prev) => [...prev, appendedDoubt])
      setNewDoubt('')
    } catch (err) {
      console.error('Failed to post doubt thread:', err)
    } finally {
      setIsPostingDoubt(false)
    }
  }

  const handleDeleteDoubt = async (doubtId) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('lesson_doubts')
        .delete()
        .eq('id', doubtId)
        .eq('user_id', user.id)

      if (error) throw error

      setDoubts((prev) => prev.filter((d) => d.id !== doubtId))
    } catch (err) {
      console.error('Failed to delete doubt thread:', err)
    }
  }

  // Generate secure download routing link
  const getSecureDownloadUrl = (rawUrl) => {
    if (!rawUrl) return '#'
    return `/api/downloads?lessonId=${currentLesson.id}&file=${encodeURIComponent(rawUrl)}`
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-800 animate-fade-in flex flex-col">
      {/* Premium Sticky Course Header */}
      <header className="relative md:sticky md:top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800 shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider">
                <span>Focus Mode Player</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                <span className="text-slate-500 truncate">{course.title}</span>
              </div>
              <h1 className="text-base md:text-lg font-black text-slate-850 mt-0.5 truncate">
                {currentLesson.title}
              </h1>
            </div>
          </div>

          {/* Progress Tracker Widget */}
          <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Course Progress
              </span>
              <span className="text-xs font-extrabold text-slate-700">
                {completedSet.size} of {lessons.length} Lessons ({percentComplete}% Completed)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 md:w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40 relative">
                <div 
                  className="h-full bg-teal-500 transition-all duration-500 ease-out"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <span className="text-xs font-black text-teal-650 sm:hidden">
                {percentComplete}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Focus Mode Grid */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-x-hidden">
        
        {/* Left Side: Widescreen Video Player & Dynamic Tabs switcher */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* Custom HTML5 Video Player Canvas */}
          <div className="sticky top-0 z-40 w-full bg-black aspect-video rounded-none md:rounded-3xl overflow-hidden shadow-md border-b md:border border-slate-250/20 lg:relative">
            <video
              key={currentLesson.video_url}
              src={currentLesson.video_url}
              controls
              autoPlay
              className="w-full h-full object-contain"
              poster="/academic_prosperity_1779866712293.png"
            />
          </div>

          {/* Premium Tablet & Mobile Optimized Tabbed Interface Panel */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
            
            {/* Horizontal Scrollable Tabs bar */}
            <div className="flex items-center border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap shrink-0">
              <button
                onClick={() => setActiveTab('NOTES')}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'NOTES'
                    ? 'bg-teal-50 text-teal-650 font-black font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <Video className="w-4 h-4 shrink-0" />
                <span>Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('READING')}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'READING'
                    ? 'bg-teal-50 text-teal-650 font-black font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Readings</span>
              </button>

              <button
                onClick={() => setActiveTab('ASSIGNMENT')}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ASSIGNMENT'
                    ? 'bg-teal-50 text-teal-650 font-black font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>Homework</span>
              </button>

              <button
                onClick={() => setActiveTab('DOUBTS')}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'DOUBTS'
                    ? 'bg-teal-50 text-teal-650 font-black font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Doubt Solver</span>
              </button>

              {/* 🎥 New Live Sessions schedule Tab */}
              <button
                onClick={() => setActiveTab('LIVE')}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'LIVE'
                    ? 'bg-teal-50 text-teal-650 font-black font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span>Live Classes</span>
              </button>

              {/* 🏆 New Assessment Quizzes & JEE Exams Tab */}
              <button
                onClick={() => setActiveTab('EXAMS')}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'EXAMS'
                    ? 'bg-teal-50 text-teal-650 font-black font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <AwardIcon className="w-4 h-4 shrink-0" />
                <span>Test Center</span>
              </button>

              <button
                onClick={() => setActiveTab('SYLLABUS')}
                className={`lg:hidden px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'SYLLABUS'
                    ? 'bg-teal-50 text-teal-650 font-black font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <BookOpenCheck className="w-4 h-4 shrink-0" />
                <span>Syllabus</span>
              </button>
            </div>

            {/* Dynamic Tab Body Container */}
            <div className="p-6 md:p-8 min-h-[300px]">
              
              {/* TAB 1: NOTES */}
              {activeTab === 'NOTES' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-teal-55 bg-teal-50 text-teal-700 border border-teal-100">
                        <Video className="w-3.5 h-3.5" />
                        Lecture {currentLessonIndex + 1} of {lessons.length}
                      </span>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                        {currentLesson.title}
                      </h2>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-350" />
                          {currentLesson.duration_minutes || 0} Minutes
                        </span>
                        <span className="w-1.5 h-1.5 bg-slate-350 rounded-full" />
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-slate-350" />
                          Focus Lecture
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleProgress(currentLesson.id)}
                      className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition duration-200 select-none cursor-pointer flex items-center justify-center gap-2 border shadow-sm ${
                        completedSet.has(currentLesson.id)
                          ? 'bg-teal-50 border-teal-200 text-teal-650 hover:bg-teal-100/50'
                          : 'bg-teal-600 border-teal-600 text-white hover:bg-teal-700 active:bg-teal-800'
                      }`}
                    >
                      <CheckCircle2 className={`w-4.5 h-4.5 shrink-0 ${completedSet.has(currentLesson.id) ? 'text-teal-600' : 'text-white'}`} />
                      <span>
                        {completedSet.has(currentLesson.id) ? 'Completed' : 'Mark Completed'}
                      </span>
                    </button>
                  </div>

                  {currentLesson.description ? (
                    <>
                      <hr className="border-slate-100" />
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          Overview & Key Takeaways
                        </h4>
                        <p className="text-slate-655 text-sm leading-relaxed whitespace-pre-line font-medium">
                          {currentLesson.description}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 text-sm italic py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-150">
                      No summary overview provided for this lecture notes page.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ADMIN READING MATERIAL */}
              {activeTab === 'READING' && (
                <div className="space-y-6">
                  <div className="border-l-4 border-teal-500 bg-teal-50/40 p-4 rounded-r-2xl border-t border-r border-b border-teal-100/60">
                    <h3 className="text-xs font-black text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      Assigned Reading Material
                    </h3>
                    <p className="text-[11px] font-bold text-teal-650 mt-1">
                      Read through the study materials prepared by the course instructor to supplement the video lecture.
                    </p>
                  </div>

                  {currentLesson.reading_material ? (
                    <article className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-4 pt-2">
                      <div 
                        dangerouslySetInnerHTML={{ __html: currentLesson.reading_material }}
                        className="p-5 bg-slate-50 rounded-2xl border border-slate-200/50 overflow-hidden break-words text-slate-655 space-y-3 md:p-6"
                      />
                    </article>
                  ) : (
                    <div className="text-slate-400 text-sm italic py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      No reading materials have been posted for this lesson.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DYNAMIC HOMEWORK ASSIGNMENT SECTION */}
              {activeTab === 'ASSIGNMENT' && (
                <div className="space-y-6">
                  {currentLesson.assignment_title ? (
                    <div className="space-y-6">
                      <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/50 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                              Homework
                            </span>
                            <h3 className="text-base font-extrabold text-slate-800 pt-1 leading-snug">
                              {currentLesson.assignment_title}
                            </h3>
                          </div>
                          {currentLesson.assignment_url && (
                            <a
                              href={getSecureDownloadUrl(currentLesson.assignment_url)}
                              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-650 hover:text-slate-800 transition shadow-sm shrink-0 flex items-center justify-center cursor-pointer"
                              title="Download Homework Worksheet"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        {currentLesson.assignment_description && (
                          <p className="text-slate-600 text-sm leading-relaxed font-medium">
                            {currentLesson.assignment_description}
                          </p>
                        )}
                      </div>

                      {/* Secure download action block */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50">
                        <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0 hidden sm:block" />
                        <div className="flex-1 text-center sm:text-left">
                          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                            Secure Dossier Vault
                          </h4>
                          <p className="text-[11px] font-bold text-emerald-650 mt-1">
                            Attachments are dynamically signed for 60 seconds to safeguard proprietary academy resources.
                          </p>
                        </div>
                        {currentLesson.assignment_url && (
                          <a
                            href={getSecureDownloadUrl(currentLesson.assignment_url)}
                            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-emerald-600 text-center"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Worksheet</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm italic py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      No assignments have been assigned to this focus lecture.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DOUBT RESOLUTION DISCUSSION BOARD */}
              {activeTab === 'DOUBTS' && (
                <div className="space-y-6">
                  {/* Discussion forum header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight">
                        Live Doubt Solving Q&A Thread
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {doubts.length} active questions in community forum
                      </p>
                    </div>
                  </div>

                  {/* Doubts list */}
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                    {doubts.length > 0 ? (
                      doubts.map((doubt) => {
                        const isOwnDoubt = doubt.user_id === user.id
                        const authorName = doubt.profiles?.full_name || doubt.profiles?.email?.split('@')[0] || 'Student'
                        const postedAt = new Date(doubt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                        return (
                          <div 
                            key={doubt.id}
                            className={`p-4 rounded-2xl border text-sm leading-relaxed relative group transition shadow-sm ${
                              isOwnDoubt
                                ? 'bg-teal-50/30 border-teal-100 text-slate-700'
                                : 'bg-slate-50/50 border-slate-200/50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 font-extrabold text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
                              <span className={isOwnDoubt ? 'text-teal-700 font-black' : 'text-slate-500'}>
                                {authorName} {isOwnDoubt && '(You)'}
                              </span>
                              <span>
                                {postedAt}
                              </span>
                            </div>
                            <p className="text-slate-655 text-xs md:text-sm font-bold">
                              {doubt.content}
                            </p>

                            {isOwnDoubt && (
                              <button
                                onClick={() => handleDeleteDoubt(doubt.id)}
                                className="absolute top-3 right-3 text-slate-350 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Delete question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-slate-400 text-sm italic py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-150">
                        Ask a question to start the community doubt solver thread.
                      </div>
                    )}
                    <div ref={doubtsEndRef} />
                  </div>

                  {/* Submit dynamic doubts form */}
                  <form onSubmit={handlePostDoubt} className="flex gap-2.5 items-end">
                    <input
                      type="text"
                      value={newDoubt}
                      onChange={(e) => setNewDoubt(e.target.value)}
                      placeholder="Type your question or doubt..."
                      disabled={isPostingDoubt}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-xs md:text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white placeholder-slate-400 text-slate-800 font-bold"
                    />
                    <button
                      type="submit"
                      disabled={!newDoubt.trim() || isPostingDoubt}
                      className="p-3.5 bg-teal-650 hover:bg-teal-750 text-white rounded-2xl transition disabled:bg-slate-100 disabled:text-slate-350 disabled:border-slate-100 cursor-pointer shadow-sm shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* 🎥 NEW TAB 5: LIVE CLASSES SCHEDULE */}
              {activeTab === 'LIVE' && (
                <div className="space-y-6">
                  <div className="border-l-4 border-emerald-500 bg-emerald-50/40 p-4 rounded-r-2xl border-t border-r border-b border-emerald-100/60">
                    <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Tv className="w-4 h-4" />
                      Live Lecture Schedule
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-650 mt-1">
                      Join active live lectures directly via our encrypted Google Meet/Zoom portals. Review scheduled classes below.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {liveSessions.length > 0 ? (
                      liveSessions.map((session) => {
                        const isLive = session.status === 'live'
                        const isEnded = session.status === 'ended'
                        const startTime = new Date(session.scheduled_start).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })

                        return (
                          <div 
                            key={session.id}
                            className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                              isLive 
                                ? 'bg-emerald-50/30 border-emerald-200' 
                                : 'bg-white border-slate-200/60'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {isLive ? (
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                ) : null}
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                  isLive 
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                    : isEnded 
                                      ? 'bg-slate-100 text-slate-400 border-slate-200' 
                                      : 'bg-teal-50 text-teal-700 border-teal-100'
                                }`}>
                                  {session.status}
                                </span>
                              </div>
                              <h4 className="text-sm font-extrabold text-slate-800 leading-snug">
                                {session.title}
                              </h4>
                              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-350" />
                                  {session.duration_minutes} Minutes
                                </span>
                                <span>•</span>
                                <span>{startTime}</span>
                              </div>
                            </div>

                            {isLive && (
                              <a
                                href={session.meeting_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm border border-emerald-600 cursor-pointer"
                              >
                                <span>Join Live Class</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-slate-400 text-sm italic py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        No live sessions have been scheduled for this course.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 🏆 NEW TAB 6: QUIZZES & JEE EXAMS TEST CENTER */}
              {activeTab === 'EXAMS' && (
                <div className="space-y-6">
                  <div className="border-l-4 border-teal-500 bg-teal-50/40 p-4 rounded-r-2xl border-t border-r border-b border-teal-100/60">
                    <h3 className="text-xs font-black text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AwardIcon className="w-4 h-4" />
                      JEE Assessment Test Center
                    </h3>
                    <p className="text-[11px] font-bold text-teal-650 mt-1">
                      Simulate high-fidelity JEE Main mock exams and dynamic chapter quizzes. Grading is strictly zero-trust and timed authoritatively on the server.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assessments.length > 0 ? (
                      assessments.map((exam) => {
                        const isMock = exam.type === 'jee_mock'

                        return (
                          <div 
                            key={exam.id}
                            className="p-5 bg-white border border-slate-200/60 hover:border-teal-300 rounded-2xl shadow-sm transition flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-1">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                isMock 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                  : 'bg-teal-50 text-teal-700 border-teal-100'
                              }`}>
                                {isMock ? 'JEE Main Mock' : 'Chapter Quiz'}
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-800 leading-snug pt-1">
                                {exam.title}
                              </h4>
                              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 pt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-350" />
                                  {exam.duration_minutes}m Duration
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => router.push(`/learn/${course.id}/exams/${exam.id}`)}
                              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm border border-teal-600 text-center cursor-pointer"
                            >
                              Enter Test Center
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-full text-slate-400 text-sm italic py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        No mock exams or quizzes have been scheduled yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: MOBILE ONLY SYLLABUS LIST */}
              {activeTab === 'SYLLABUS' && (
                <div className="space-y-4 lg:hidden">
                  <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/50 shrink-0">
                    <h3 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <BookOpenCheck className="w-4.5 h-4.5 text-teal-600" />
                      Course Lectures Checklist
                    </h3>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
                    {lessons.map((lesson, idx) => {
                      const isActive = lesson.id === currentLesson.id
                      const isCompleted = completedSet.has(lesson.id)

                      return (
                        <div
                          key={lesson.id}
                          className={`p-3.5 rounded-2xl border transition flex items-start gap-3 select-none ${
                            isActive
                              ? 'bg-teal-50/40 border-teal-200/60 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <button
                            onClick={() => handleToggleProgress(lesson.id)}
                            className="mt-0.5 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                            style={{
                              borderColor: isCompleted ? '#14b8a6' : '#cbd5e1',
                              backgroundColor: isCompleted ? '#14b8a6' : 'transparent'
                            }}
                          >
                            {isCompleted && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <div 
                            onClick={() => {
                              if (!isActive) {
                                router.push(`?lesson=${lesson.id}`, { scroll: false })
                                setActiveTab('NOTES') // reset dynamic mobile tab
                              }
                            }}
                            className="flex-1 min-w-0 cursor-pointer"
                          >
                            <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${
                              isActive ? 'text-teal-900 font-extrabold' : 'text-slate-700'
                            }`}>
                              {idx + 1}. {lesson.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-350" />
                                {lesson.duration_minutes || 0}m
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-teal-100 text-teal-700 border border-teal-200/40">
                                  Playing
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Pagination footer */}
            <div className="border-t border-slate-100 p-6 flex items-center justify-between gap-4 select-none shrink-0 bg-slate-50/20">
              {prevLesson ? (
                <button
                  onClick={() => {
                    router.push(`?lesson=${prevLesson.id}`, { scroll: false })
                    setActiveTab('NOTES')
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-xs font-bold text-slate-650 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              ) : (
                <div className="w-10" />
              )}

              {nextLesson ? (
                <button
                  onClick={() => {
                    router.push(`?lesson=${nextLesson.id}`, { scroll: false })
                    setActiveTab('NOTES')
                  }}
                  className="px-4 py-2.5 bg-teal-650 border border-teal-605 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Next Lesson</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2.5 rounded-xl border border-emerald-100">
                  <Award className="w-4 h-4" />
                  <span>Finished!</span>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Right Sidebar Syllabus - shown only on large screens */}
        <aside className="lg:col-span-1 hidden lg:block">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[600px] sticky top-28">
            
            {/* Sidebar Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-teal-600" />
                Course Curriculum
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                {lessons.length} total lectures • {course.level || 'Foundation'}
              </p>
            </div>

            {/* Syllabus Lesson Checklist Scroll area */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
              {lessons.map((lesson, idx) => {
                const isActive = lesson.id === currentLesson.id
                const isCompleted = completedSet.has(lesson.id)

                return (
                  <div
                    key={lesson.id}
                    className={`group p-3 rounded-2xl border transition-all duration-200 flex items-start gap-3 select-none ${
                      isActive
                        ? 'bg-teal-50/40 border-teal-200/60 shadow-sm'
                        : 'bg-white hover:bg-slate-50/80 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleProgress(lesson.id)}
                      className="mt-0.5 w-5.5 h-5.5 rounded-full border-2 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                      style={{
                        borderColor: isCompleted ? '#14b8a6' : '#cbd5e1',
                        backgroundColor: isCompleted ? '#14b8a6' : 'transparent'
                      }}
                      title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {isCompleted && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div 
                      onClick={() => {
                        if (!isActive) {
                          router.push(`?lesson=${lesson.id}`, { scroll: false })
                        }
                      }}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <h4 className={`text-xs font-bold leading-snug line-clamp-2 transition ${
                        isActive ? 'text-teal-900 font-extrabold' : 'text-slate-700 group-hover:text-slate-900'
                      }`}>
                        {idx + 1}. {lesson.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-350" />
                          {lesson.duration_minutes || 0}m
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-teal-100 text-teal-700 border border-teal-200/40">
                            Now Playing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
          </div>
        </aside>

      </main>
    </div>
  )
}
