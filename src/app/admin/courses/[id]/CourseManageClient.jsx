</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[420px] flex-1">
                {/* Editor Pane */}
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                    <span>Source Markdown & LaTeX</span>
                    <span className="text-indigo-400 font-extrabold font-mono">Math Supported</span>
                  </div>

                  {/* Toolbar */}
                  <div className="bg-zinc-950/80 border border-zinc-850 px-3 py-2 rounded-xl flex flex-wrap gap-2">
                    {[
                      { label: 'H1', value: '# Title', desc: 'Main Header' },
                      { label: 'H2', value: '## Subtitle', desc: 'Sub Header' },
                      { label: 'Bold', value: '**text**', desc: 'Bold text' },
                      { label: 'Italics', value: '*text*', desc: 'Italic text' },
                      { label: 'List', value: '\n- Item', desc: 'Bullet list' },
                      { label: 'Inline Math', value: '$v=u+at$', desc: 'LaTeX inline math' },
                      { label: 'Block Math', value: '\n\n$$L=I\\omega$$\n\n', desc: 'LaTeX display equation' }
                    ].map(btn => (
                      <button
                      
                <div className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between hover:border-zinc-700/50 transition h-20">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block leading-none">Unanswered</span>
                  <h4 className="text-lg font-black text-zinc-405 font-mono">{selectedAttempt.unanswered} <span className="text-[9px] text-zinc-550 font-bold">Qns</span></h4>
                </div>
              </div>

              {/* Close Button Footer */}
              <div className="mt-6 pt-5 border-t border-zinc-850 flex justify-end shrink-0 font-sans">
                <button
                  type="button"
                  onClick={() => setSelectedAttempt(null)}
                  className="px-5 py-2.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-350 hover:text-white rounded-xl text-xs font-bold transition select-none cursor-pointer tactile-press hover:scale-105 active:scale-95"
                >
                  Close Scorecard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Local Toast notifications */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-3.5 rounded-xl border font-bold text-sm shadow-2xl animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-600/10 border-rose-500/30 text-rose-455'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}