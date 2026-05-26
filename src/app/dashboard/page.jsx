import * as React from 'react'
import { redirect } from 'next/navigation'
import { BookOpen, Calendar, GraduationCap, LayoutDashboard, Settings, Users } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Securely retrieve active user
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if unauthenticated
  if (!user) {
    redirect('/login')
  }

  // Retrieve matching profile if exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name || user.email.split('@')[0]
  const displayRole = profile?.role ? (profile.role === 'teacher' ? 'Instructor' : 'Student') : 'Student'

  // Dashboard Stats mock data
  const stats = [
    { title: 'Enrolled Courses', value: '4', icon: BookOpen, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Hours Studied', value: '28.5 hrs', icon: Calendar, color: 'text-purple-500 bg-purple-500/10' },
    { title: 'Active Projects', value: '3', icon: GraduationCap, color: 'text-pink-500 bg-pink-500/10' },
    { title: 'Study Peers', value: '12', icon: Users, color: 'text-emerald-500 bg-emerald-500/10' },
  ]

  return (
    <div className="relative min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      
      {/* Background animated shift gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/20 dark:via-purple-950/15 dark:to-pink-950/20 bg-gradient-size animate-gradient-shift filter blur-3xl opacity-80 pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl hidden md:flex flex-col p-6 gap-8 justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-pink-500 bg-clip-text text-transparent">
              <GraduationCap className="w-6 h-6 text-indigo-500" />
              <span>EduPortal</span>
            </div>

            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-4 py-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold rounded-2xl">
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-600 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-850/50 font-medium rounded-2xl transition-colors">
                <BookOpen className="w-5 h-5" />
                <span>My Courses</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-600 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-850/50 font-medium rounded-2xl transition-colors">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </a>
            </nav>
          </div>

          <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                {displayName.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{displayName}</p>
                <p className="text-xs text-zinc-400 truncate">{displayRole} Account</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Dashboard Workspace */}
        <main className="flex-1 flex flex-col min-h-screen">
          
          <header className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md">
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Dashboard</h1>
              <p className="text-xs font-semibold text-zinc-400 mt-0.5">Welcome, <span className="text-indigo-500 dark:text-indigo-400">{user.email}</span></p>
            </div>
          </header>

          <div className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl w-full mx-auto">
            
            {/* High-end decorative greeting banner */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white relative overflow-hidden shadow-xl">
              <div className="absolute -top-[50%] -left-[10%] w-[50rem] h-[50rem] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative z-10 max-w-xl space-y-3">
                <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-widest bg-white/20 rounded-full">Term Active</span>
                <h2 className="text-3xl font-extrabold tracking-tight">Level up your learning journey, {displayName}!</h2>
                <p className="text-sm font-medium text-white/90 leading-relaxed">
                  Access lectures, secure enrollments, manage homework timelines, and interact with peers instantly.
                </p>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat) => {
                const IconComponent = stat.icon
                return (
                  <div
                    key={stat.title}
                    className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-md flex items-center gap-4 transition-all"
                  >
                    <div className={`p-3.5 rounded-xl shrink-0 ${stat.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{stat.title}</p>
                      <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">{stat.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Content Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md space-y-4">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">In Progress Courses</h3>
                
                <div className="space-y-3">
                  {[
                    { name: 'Introduction to Algorithms', progress: 75, code: 'CS-201' },
                    { name: 'Human Computer Interaction', progress: 40, code: 'CS-340' },
                    { name: 'Database Management Systems', progress: 90, code: 'CS-250' }
                  ].map((course) => (
                    <div key={course.name} className="p-4 rounded-2xl border border-zinc-200/30 dark:border-zinc-800/30 bg-white/30 dark:bg-zinc-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">{course.code}</span>
                        <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-250 mt-1">{course.name}</h4>
                      </div>
                      <div className="w-full md:w-48 flex items-center gap-3">
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${course.progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 w-8 text-right">{course.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md space-y-4">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Study Rooms</h3>
                
                <div className="space-y-3">
                  {[
                    { name: 'AI Research Group', members: '8 online' },
                    { name: 'Algorithmic Solutions Lab', members: '3 online' },
                    { name: 'HCI Prototyping Squad', members: '5 online' }
                  ].map((group) => (
                    <div key={group.name} className="p-3.5 rounded-2xl border border-zinc-200/30 dark:border-zinc-800/30 bg-white/30 dark:bg-zinc-950/20 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-250">{group.name}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{group.members}</p>
                      </div>
                      <button className="px-3 py-1.5 text-[10px] font-bold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer">Join Room</button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
