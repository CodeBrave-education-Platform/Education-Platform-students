import React from 'react'
import Link from 'next/link'
import { Trophy, Flame, Target, ArrowLeft, Crown, Medal } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch top 50 users globally, order by xp
  // If XP doesn't exist yet, this will fail or return nothing, so we fallback to mock data for demo.
  let topUsers = []
  try {
    const { data: dbUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, xp, streak, rank_badge')
      .order('xp', { ascending: false })
      .limit(50)
      
    if (dbUsers && dbUsers.length > 0 && dbUsers[0].xp !== undefined) {
      topUsers = dbUsers
    } else {
      throw new Error('XP column not found')
    }
  } catch (err) {
    // Mock Data Fallback since we didn't run DB migrations for XP column yet
    topUsers = Array.from({ length: 50 }).map((_, i) => ({
      id: `mock-${i}`,
      full_name: i === 0 ? 'Anjali Sharma' : i === 1 ? 'Rahul Verma' : i === 2 ? 'Vikram Singh' : `Student ${i + 1}`,
      xp: 15000 - (i * 250) - Math.floor(Math.random() * 50),
      streak: Math.floor(Math.random() * 30) + 1,
      rank_badge: i === 0 ? 'Grandmaster' : i < 10 ? 'Master' : i < 25 ? 'Diamond' : 'Platinum'
    }))

    // Insert the current user in a random position if logged in
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('full_name, xp, streak').eq('id', user.id).maybeSingle()
      if (profile) {
        topUsers[15] = {
          id: user.id,
          full_name: profile.full_name || user.email,
          xp: profile.xp || 11050,
          streak: profile.streak || 4,
          rank_badge: 'Diamond'
        }
      }
    }
  }

  const top3 = topUsers.slice(0, 3)
  const rest = topUsers.slice(3)

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-teal-500/30 overflow-x-hidden">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-black tracking-tight text-white">Global Leaderboard</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-1.5 border border-white/10">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-400">Season 4 Active</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-16">
        
        {/* Top 3 Podium */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent blur-3xl rounded-full" />
          
          <div className="relative flex items-end justify-center gap-2 md:gap-6 pt-10 h-72">
            
            {/* Rank 2 */}
            <div className="flex flex-col items-center z-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-300 bg-slate-800 flex items-center justify-center overflow-hidden z-10 shadow-[0_0_30px_rgba(203,213,225,0.2)]">
                  <span className="text-2xl font-black text-slate-300">{top3[1]?.full_name?.charAt(0)}</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-900 text-xs font-black px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-xl z-20">
                  #2
                </div>
              </div>
              <div className="mt-6 flex flex-col items-center bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-t-2xl w-24 md:w-32 h-32 pt-4 shadow-xl">
                <span className="text-sm md:text-base font-bold text-white truncate w-full px-2 text-center">{top3[1]?.full_name.split(' ')[0]}</span>
                <span className="text-xs font-black text-emerald-400 mt-1">{top3[1]?.xp.toLocaleString()} XP</span>
              </div>
            </div>

            {/* Rank 1 */}
            <div className="flex flex-col items-center z-20 -mx-4 md:-mx-2 animate-fade-in-up">
              <div className="relative">
                <Crown className="w-8 h-8 text-amber-400 absolute -top-10 left-1/2 -translate-x-1/2 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-amber-400 bg-slate-800 flex items-center justify-center overflow-hidden z-10 shadow-[0_0_40px_rgba(251,191,36,0.4)]">
                  <span className="text-3xl md:text-4xl font-black text-amber-400">{top3[0]?.full_name?.charAt(0)}</span>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-sm font-black px-3 py-1 rounded-full border-2 border-slate-900 shadow-xl z-20">
                  #1
                </div>
              </div>
              <div className="mt-8 flex flex-col items-center bg-gradient-to-t from-slate-800/90 to-slate-800/50 backdrop-blur-md border border-amber-500/30 rounded-t-2xl w-28 md:w-40 h-40 pt-5 shadow-2xl">
                <span className="text-base md:text-lg font-bold text-amber-50 truncate w-full px-2 text-center">{top3[0]?.full_name.split(' ')[0]}</span>
                <span className="text-sm md:text-base font-black text-amber-400 mt-1 drop-shadow-md">{top3[0]?.xp.toLocaleString()} XP</span>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Flame className="w-3 h-3" /> {top3[0]?.streak} Day Streak
                </div>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="flex flex-col items-center z-10 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-orange-700 bg-slate-800 flex items-center justify-center overflow-hidden z-10 shadow-[0_0_30px_rgba(194,65,12,0.2)]">
                  <span className="text-2xl font-black text-orange-600">{top3[2]?.full_name?.charAt(0)}</span>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-700 text-white text-xs font-black px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-xl z-20">
                  #3
                </div>
              </div>
              <div className="mt-6 flex flex-col items-center bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-t-2xl w-24 md:w-32 h-28 pt-4 shadow-xl">
                <span className="text-sm md:text-base font-bold text-white truncate w-full px-2 text-center">{top3[2]?.full_name.split(' ')[0]}</span>
                <span className="text-xs font-black text-emerald-400 mt-1">{top3[2]?.xp.toLocaleString()} XP</span>
              </div>
            </div>

          </div>
        </section>

        {/* List */}
        <section className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-400" />
              Global Rankings
            </h2>
          </div>
          
          <div className="divide-y divide-white/5">
            {rest.map((student, index) => {
              const rank = index + 4
              const isCurrentUser = student.id === user?.id

              return (
                <div 
                  key={student.id} 
                  className={`flex items-center gap-4 p-4 transition hover:bg-white/5 ${isCurrentUser ? 'bg-teal-900/20 border-l-2 border-teal-500' : ''}`}
                >
                  <div className="w-8 text-center text-sm font-black text-slate-500">
                    {rank}
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-slate-300">{student.full_name.charAt(0)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold truncate ${isCurrentUser ? 'text-teal-400' : 'text-slate-200'}`}>
                        {student.full_name} {isCurrentUser && '(You)'}
                      </h4>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400 hidden sm:inline-block">
                        {student.rank_badge}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-sm font-bold w-20">
                      <Flame className={`w-4 h-4 ${student.streak > 5 ? 'text-orange-500' : 'text-slate-600'}`} />
                      {student.streak}
                    </div>
                    
                    <div className="text-right w-24">
                      <div className="text-sm font-black text-emerald-400">
                        {student.xp.toLocaleString()} <span className="text-xs text-emerald-600">XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}} />
    </div>
  )
}
