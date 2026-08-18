'use client'

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, AlertTriangle, Brain, Sparkles, ChevronRight, Activity, BookOpen, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uggatacexipoidzhcjhx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setErrorMsg('You must be logged in to view analytics.');
          setLoading(false);
          return;
        }

        // Fetch user's test attempts
        const { data: attempts, error: attemptsError } = await supabase
          .from('test_attempts')
          .select('*, test_exams(questions, marks_scheme)')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: true });

        if (attemptsError) throw attemptsError;

        if (!attempts || attempts.length === 0) {
          setErrorMsg('No test data available. Take a mock test to generate your AI diagnostics!');
          setLoading(false);
          return;
        }

        let totalQuestions = 0;
        let totalCorrect = 0;
        const topicStats = {}; // { [topic]: { correct: 0, total: 0, subject: '' } }
        const recentScores = [];

        attempts.forEach(attempt => {
          let questions = [];
          if (typeof attempt.test_exams?.questions === 'string') {
            try { questions = JSON.parse(attempt.test_exams.questions); } catch (e) { questions = []; }
          } else if (Array.isArray(attempt.test_exams?.questions)) {
            questions = attempt.test_exams.questions;
          }

          let answers = {};
          if (typeof attempt.answers_payload === 'string') {
            try { answers = JSON.parse(attempt.answers_payload); } catch (e) { answers = {}; }
          } else if (attempt.answers_payload && typeof attempt.answers_payload === 'object') {
            answers = attempt.answers_payload;
          }
          let attemptScore = 0;
          let maxPossible = 0;

          questions.forEach(q => {
            const topic = q.sub_topic || 'General';
            const subject = q.subject || 'Mixed';
            
            if (!topicStats[topic]) {
              topicStats[topic] = { correct: 0, total: 0, subject };
            }

            topicStats[topic].total += 1;
            totalQuestions += 1;
            maxPossible += (attempt.test_exams?.marks_scheme?.positive_marks || 4);

            const ans = answers[q.id];
            if (ans && ans.selected_option === q.correct_option_index) {
              topicStats[topic].correct += 1;
              totalCorrect += 1;
              attemptScore += (attempt.test_exams?.marks_scheme?.positive_marks || 4);
            }
          });

          // Calculate percentage for the trend chart
          if (maxPossible > 0) {
            recentScores.push(Math.round((attemptScore / maxPossible) * 100));
          }
        });

        const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        let strongest = { topic: 'N/A', subject: 'N/A', score: 0 };
        let weakest = { topic: 'N/A', subject: 'N/A', score: 100 };

        for (const [topic, stats] of Object.entries(topicStats)) {
          if (stats.total > 0) {
            const pct = Math.round((stats.correct / stats.total) * 100);
            if (pct >= strongest.score) {
              strongest = { topic, subject: stats.subject, score: pct };
            }
            if (pct <= weakest.score && stats.total >= 1) {
              weakest = { topic, subject: stats.subject, score: pct };
            }
          }
        }

        // Generate Heuristic AI Advice
        let aiAdvice = `You have completed ${attempts.length} mock tests. Your overall accuracy is ${overallScore}%. `;
        if (strongest.topic !== 'N/A') {
          aiAdvice += `Your foundations in ${strongest.topic} (${strongest.subject}) are rock solid (${strongest.score}%). `;
        }
        if (weakest.topic !== 'N/A' && weakest.score < 60) {
          aiAdvice += `However, you are consistently bleeding marks in ${weakest.topic}. We strongly recommend reviewing the core concepts of ${weakest.subject} before your next attempt.`;
        } else {
          aiAdvice += `Keep up the steady momentum!`;
        }

        setDiagnostics({
          overallScore,
          strongest,
          weakest,
          aiAdvice,
          recentTrend: recentScores
        });
      } catch (err) {
        console.error('Analytics Error:', err);
        setErrorMsg('Failed to crunch analytics. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">AI Diagnostic Analytics</h1>
            <p className="text-sm font-semibold text-slate-500">Real-time performance heuristics & weakness detection</p>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Crunching Real-Time Data...</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Insufficient Data</h3>
            <p className="text-slate-500">{errorMsg}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* AI Insight Card - Spans 2 columns */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-fuchsia-50 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-110"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900">Athena AI Insight</h3>
                </div>
                
                <p className="text-lg md:text-xl font-bold text-slate-700 leading-relaxed">
                  {diagnostics.aiAdvice}
                </p>

                <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-200">
                  <BookOpen className="w-4 h-4" />
                  Start Recommended Lesson
                </button>
              </div>
            </div>

            {/* Overall Score */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Target className="w-32 h-32 text-white" />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Average Accuracy</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white">{diagnostics.overallScore}</span>
                  <span className="text-xl font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Weakness Matrix */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Strongest Domain</h4>
                  <div className="text-lg font-black text-slate-800">{diagnostics.strongest.topic}</div>
                  <div className="text-sm font-bold text-emerald-600 mt-1">{diagnostics.strongest.score}% Mastery • {diagnostics.strongest.subject}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Critical Weakness</h4>
                  <div className="text-lg font-black text-slate-800">{diagnostics.weakest.topic}</div>
                  <div className="text-sm font-bold text-rose-600 mt-1">{diagnostics.weakest.score}% Mastery • {diagnostics.weakest.subject}</div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
