import { useState } from 'react';
import {
  IoWater,
  IoAddOutline,
  IoRemoveOutline,
  IoSettingsOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';
import { Card, Button, ProgressRing, Modal, Input } from '@/components/ui';
import { useWaterStore, useAuthStore } from '@/stores';

export default function Water() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    targetMl,
    glassSize,
    setTarget,
    setGlassSize,
    addWater,
    removeLastEntry,
    getTodayProgress,
    getWeekProgress
  } = useWaterStore();
  const { user } = useAuthStore();

  const today = getTodayProgress();
  const weekProgress = getWeekProgress();

  const [tempTarget, setTempTarget] = useState(targetMl);
  const [tempGlassSize, setTempGlassSize] = useState(glassSize);

  const quickAmounts = [150, 250, 500, 750];

  const handleSaveSettings = () => {
    setTarget(tempTarget, user?.uid);
    setGlassSize(tempGlassSize, user?.uid);
    setIsSettingsOpen(false);
  };

  return (
    <div className="px-5 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mi <span className="text-gradient">Hidratacion</span></h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Mantén tu cuerpo en equilibrio</p>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-indigo-600 transition-all active:scale-95"
        >
          <IoSettingsOutline className="w-6 h-6" />
        </button>
      </header>

      {/* Main Progress */}
      <Card className="py-12 border-none shadow-2xl shadow-cyan-500/10 dark:shadow-black/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />

        <div className="flex flex-col items-center relative z-10">
          <ProgressRing
            progress={today.progress}
            size={220}
            strokeWidth={16}
            color={today.progress >= 1 ? '#10B981' : '#06B6D4'}
          >
            <div className="text-center">
              {today.progress >= 1 ? (
                <div className="animate-bounce-subtle">
                  <IoCheckmarkCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3 drop-shadow-lg" />
                  <p className="text-xl font-black text-emerald-600 uppercase tracking-tighter">Meta Lograda</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-2 text-cyan-500">
                    <IoWater className="w-7 h-7" />
                  </div>
                  <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{today.consumed}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">de {today.target} ml</p>
                </div>
              )}
            </div>
          </ProgressRing>

          <div className="mt-10 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-full border border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              {today.remaining > 0 ? (
                <>Faltan <span className="text-cyan-500">{today.remaining} ml</span> para el objetivo</>
              ) : (
                <span className="text-emerald-500 flex items-center gap-1.5"><IoCheckmarkCircle className="w-4 h-4" /> Objetivo diario alcanzado</span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Add */}
      <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1 -mb-4">Agregar Agua</h2>
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20">
          <Card.Body className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => addWater(user?.uid, amount)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-cyan-500/30 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 group transition-all active:scale-95"
                >
                  <span className="text-lg font-black text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">{amount}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ml</span>
                </button>
              ))}
            </div>
          </Card.Body>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20 bg-gradient-to-br from-indigo-500 to-blue-600 text-white overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          <Card.Body className="p-4 flex flex-col justify-between h-full relative z-10">
            <div className="flex justify-between items-start">
              <button
                onClick={() => removeLastEntry(user?.uid)}
                disabled={today.entries.length === 0}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition-all active:scale-90"
              >
                <IoRemoveOutline className="w-6 h-6" />
              </button>
              <div className="text-right">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Vaso</p>
                <p className="text-2xl font-black">{glassSize}ml</p>
              </div>
            </div>

            <Button
              onClick={() => addWater(user?.uid)}
              className="w-full h-14 bg-white text-indigo-600 hover:bg-blue-50 mt-4 rounded-2xl shadow-lg border-none"
            >
              <IoAddOutline className="w-6 h-6 mr-1" />
              Agregar
            </Button>
          </Card.Body>
        </Card>
      </div>

      {/* Week Overview */}
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden">
        <Card.Body className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Resumen Semanal</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-[10px] font-bold text-slate-400">Objetivo Diario</span>
            </div>
          </div>

          <div className="flex justify-between items-end h-32 px-2 gap-3">
            {weekProgress.map((day, index) => {
              const isToday = index === 6;
              const isMet = day.progress >= 1;
              return (
                <div key={index} className="flex flex-col items-center gap-3 flex-1 group">
                  <div className="w-full relative flex flex-col justify-end h-24">
                    <div
                      className={`w-full rounded-xl transition-all duration-700 ease-out relative z-10 ${isMet ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-cyan-500 hover:bg-cyan-400'
                        }`}
                      style={{
                        height: `${Math.max(day.progress * 100, 10)}%`,
                        opacity: day.progress > 0 ? (isToday ? 1 : 0.8) : 0.2
                      }}
                    >
                      {isToday && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${isToday ? 'text-indigo-500' : 'text-slate-400'
                    }`}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Today's Log */}
      {today.entries.length > 0 && (
        <Card className="p-4 border-slate-100 dark:border-slate-800 shadow-sm group">
          <Card.Header className="pb-2 border-none">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Logs de Hoy</h2>
          </Card.Header>
          <Card.Body className="p-4 pt-2">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {today.entries.slice().reverse().map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
                      <IoWater className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">{entry.ml} ml</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.time}</p>
                    </div>
                  </div>
                  <IoCheckmarkCircle className="w-5 h-5 text-emerald-500 opacity-30" />
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Settings Modal updated by Modal.jsx, inner layout fix */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Meta Personalizada"
      >
        <div className="space-y-8">
          <Input
            label="Meta Diaria (ml)"
            type="number"
            value={tempTarget}
            onChange={(e) => setTempTarget(parseInt(e.target.value) || 0)}
          />
          <Input
            label="Tamaño del Vaso (ml)"
            type="number"
            value={tempGlassSize}
            onChange={(e) => setTempGlassSize(parseInt(e.target.value) || 0)}
          />
          <Button onClick={handleSaveSettings} className="w-full h-14 premium-gradient mt-2">
            Actualizar Meta
          </Button>
        </div>
      </Modal>
    </div>
  );
}
