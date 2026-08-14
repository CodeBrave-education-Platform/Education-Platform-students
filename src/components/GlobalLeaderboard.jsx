'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trophy, Flame, Crown, Medal } from 'lucide-react'

export default function GlobalLeaderboard() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, xp, level, streak')
          .eq('role', 'student')
          .order('xp', { ascending: false })
          .limit(10)
        
        if (data) setLeaders(data)
      } catch (e) {
        console.error('Error fetching leaders:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaders()

    // Real-time subscription to XP updates
    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        fetchLeaders() // Refetch when profiles update to keep leaderboard live
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-3xl" />

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-slate-900 text-lg">Global Rankings</h3>
          <p className="text-xs text-slate-500 font-medium">Top Rankers by XP</p>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {leaders.map((leader, index) => (
          <div key={leader.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${index === 0 ? 'bg-amber-50 border-amber-200' : index === 1 ? 'bg-slate-50 border-slate-200' : index === 2 ? 'bg-orange-50 border-orange-200' : 'border-transparent hover:bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-amber-400 text-white shadow-md' : index === 1 ? 'bg-slate-300 text-slate-700 shadow-sm' : index === 2 ? 'bg-orange-300 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                {index === 0 ? <Crown className="w-4 h-4" /> : index === 1 ? <Medal className="w-4 h-4" /> : index + 1}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{leader.full_name || 'Anonymous'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold">Lvl {leader.level || 1}</div>
                  <div className="flex items-center gap-0.5 text-orange-500 text-[10px] font-bold">
                    <Flame className="w-3 h-3" /> {leader.streak || 0}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-slate-800">{leader.xp?.toLocaleString() || 0}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">XP</div>
            </div>
          </div>
        ))}
        {leaders.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No rankers yet.</p>}
      </div>
    </div>
  )
}
