import { useState } from 'react';
import {
  IoWater,
  IoAddOutline,
  IoRemoveOutline,
  IoSettingsOutline,
  IoCheckmarkCircle,
  IoFlame,
  IoTrendingUp,
  IoTrashOutline,
  IoClose,
} from 'react-icons/io5';
import { Card, Button, ProgressRing, Modal, Input } from '@/components/ui';
import { useWaterStore, useAuthStore } from '@/stores';

const QUICK_AMOUNTS = [
  { ml: 150, label: 'Sorbo',    icon: '🥤' },
  { ml: 250, label: 'Vaso',     icon: '🥛' },
  { ml: 500, label: 'Botella',  icon: '🍶' },
  { ml: 750, label: 'Grande',   icon: '💧' },
];

const HYDRATION_TIPS = [
  'Bebe un vaso al despertar para activar el metabolismo.',
  'El café y el té también cuentan, pero con moderación.',
  'Las frutas y verduras aportan hasta un 20% de tu hidratación.',
  'Un cuerpo bien hidratado mejora el rendimiento físico hasta un 25%.',
  'El color de tu orina es el mejor indicador de hidratación.',
];

export default function Water() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customMl, setCustomMl] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const {
    targetMl,
    glassSize,
    setTarget,
    setGlassSize,
    addWater,
    removeEntry,
    getTodayProgress,
    getWeekProgress,
    getStreak,
  } = useWaterStore();
  const { user } = useAuthStore();

  const today = getTodayProgress();
  const weekProgress = getWeekProgress();
  const streak = getStreak();
  const weeklyAvg = Math.round(weekProgress.reduce((s, d) => s + d.total, 0) / 7);
  const weekGoalsDays = weekProgress.filter(d => d.progress >= 1).length;
  const tip = HYDRATION_TIPS[new Date().getDay() % HYDRATION_TIPS.length];

  const [tempTarget, setTempTarget] = useState(targetMl);
  const [tempGlassSize, setTempGlassSize] = useState(glassSize);

  const handleSaveSettings = () => {
    setTarget(tempTarget, user?.uid);
    setGlassSize(tempGlassSize, user?.uid);
    setIsSettingsOpen(false);
  };

  const handleCustomAdd = () => {
    const ml = parseInt(customMl);
    if (!ml || ml < 1 || ml > 5000) return;
    addWater(user?.uid, ml);
    setCustomMl('');
    setShowCustom(false);
  };

  const percentText = `${Math.round(today.progress * 100)}%`;

  return (
    <div className="px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6 animate-fadeIn">

      {/* Header */}
      <header className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Mi <span className="text-gradient">Hidratación</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Mantén tu cuerpo en equilibrio
          </p>
        </div>
        <button
          onClick={() => { setTempTarget(targetMl); setTempGlassSize(glassSize); setIsSettingsOpen(true); }}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95"
        >
          <IoSettingsOutline className="w-6 h-6" />
        </button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-lg shadow-slate-200/40 dark:shadow-black/20">
          <Card.Body className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IoFlame className="w-4 h-4 text-orange-500" />
              <p className="text-2xl font-black text-slate-900 dark:text-white">{streak}</p>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Racha</p>
          </Card.Body>
        </Card>
        <Card className="border-none shadow-lg shadow-slate-200/40 dark:shadow-black/20">
          <Card.Body className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IoTrendingUp className="w-4 h-4 text-cyan-500" />
              <p className="text-2xl font-black text-slate-900 dark:text-white">{weeklyAvg >= 1000 ? `${(weeklyAvg/1000).toFixed(1)}L` : `${weeklyAvg}`}</p>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Prom/día</p>
          </Card.Body>
        </Card>
        <Card className="border-none shadow-lg shadow-slate-200/40 dark:shadow-black/20">
          <Card.Body className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IoCheckmarkCircle className="w-4 h-4 text-emerald-500" />
              <p className="text-2xl font-black text-slate-900 dark:text-white">{weekGoalsDays}/7</p>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Metas</p>
          </Card.Body>
        </Card>
      </div>

      {/* Main Progress */}
      <Card className="py-10 border-none shadow-2xl shadow-cyan-500/10 dark:shadow-black/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -ml-24 -mb-24" />

        <div className="flex flex-col items-center relative z-10">
          <ProgressRing
            progress={today.progress}
            size={200}
            strokeWidth={14}
            color={today.progress >= 1 ? '#10B981' : '#06B6D4'}
          >
            <div className="text-center">
              {today.progress >= 1 ? (
                <div className="space-y-1">
                  <IoCheckmarkCircle className="w-14 h-14 text-emerald-500 mx-auto drop-shadow-lg" />
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Meta Lograda</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{percentText}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {today.consumed >= 1000 ? `${(today.consumed/1000).toFixed(1)}L` : `${today.consumed} ml`}
                  </p>
                  <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600">
                    de {targetMl >= 1000 ? `${(targetMl/1000).toFixed(1)}L` : `${targetMl} ml`}
                  </p>
                </div>
              )}
            </div>
          </ProgressRing>

          <div className="mt-6 px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-full border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              {today.remaining > 0 ? (
                <>Faltan <span className="text-cyan-500">{today.remaining >= 1000 ? `${(today.remaining/1000).toFixed(1)}L` : `${today.remaining} ml`}</span> para el objetivo</>
              ) : (
                <span className="text-emerald-500 flex items-center gap-1.5">
                  <IoCheckmarkCircle className="w-4 h-4" /> Objetivo diario alcanzado
                </span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Add */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Agregar Agua</h2>

        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map(({ ml, label, icon }) => (
            <button
              key={ml}
              onClick={() => addWater(user?.uid, ml)}
              className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 hover:border-cyan-400/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 shadow-sm active:scale-95 transition-all group"
            >
              <span className="text-2xl mb-1">{icon}</span>
              <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{ml}</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ml</span>
              <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 mt-0.5">{label}</span>
            </button>
          ))}
        </div>

        {/* Custom + Glass Add row */}
        <div className="flex gap-3">
          {showCustom ? (
            <div className="flex-1 flex gap-2">
              <input
                type="number"
                placeholder="Cantidad en ml"
                value={customMl}
                onChange={e => setCustomMl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
                autoFocus
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <Button onClick={handleCustomAdd} className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white">
                <IoAddOutline className="w-5 h-5" />
              </Button>
              <button onClick={() => { setShowCustom(false); setCustomMl(''); }} className="w-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                <IoClose className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowCustom(true)}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-cyan-400 hover:text-cyan-500 transition-all text-xs font-black uppercase tracking-widest"
              >
                <IoAddOutline className="w-4 h-4" /> Cantidad personalizada
              </button>
              <button
                onClick={() => addWater(user?.uid)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 active:scale-95 transition-all"
              >
                <IoWater className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Week Chart */}
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden">
        <Card.Body className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Esta Semana</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-slate-400">Meta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-[9px] font-bold text-slate-400">Parcial</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end h-28 px-1 gap-2">
            {weekProgress.map((day, index) => {
              const isToday = index === 6;
              const isMet = day.progress >= 1;
              const height = Math.max(Math.min(day.progress, 1) * 100, day.total > 0 ? 8 : 4);
              return (
                <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                  {day.total > 0 && (
                    <span className={`text-[8px] font-black ${isMet ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {day.total >= 1000 ? `${(day.total/1000).toFixed(1)}L` : `${day.total}`}
                    </span>
                  )}
                  <div className="w-full relative flex flex-col justify-end" style={{ height: '80px' }}>
                    <div
                      className={`w-full rounded-xl transition-all duration-700 ease-out ${isMet ? 'bg-emerald-500 shadow-emerald-500/25 shadow-lg' : day.total > 0 ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                      style={{ height: `${height}%`, opacity: isToday ? 1 : 0.75 }}
                    >
                      {isToday && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_white]" />}
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-center">
            <div>
              <p className="text-base font-black text-slate-900 dark:text-white">{weekGoalsDays}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Días meta</p>
            </div>
            <div>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {weeklyAvg >= 1000 ? `${(weeklyAvg/1000).toFixed(1)}L` : `${weeklyAvg} ml`}
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Promedio</p>
            </div>
            <div>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {weekProgress.reduce((s, d) => s + d.total, 0) >= 1000
                  ? `${(weekProgress.reduce((s, d) => s + d.total, 0) / 1000).toFixed(1)}L`
                  : `${weekProgress.reduce((s, d) => s + d.total, 0)} ml`}
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Total semana</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Today's Log */}
      {today.entries.length > 0 && (
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <Card.Body className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Registro de Hoy</h2>
              <span className="text-[10px] font-black text-slate-400">{today.entries.length} registros</span>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {[...today.entries].reverse().map((entry, reversedIdx) => {
                const realIdx = today.entries.length - 1 - reversedIdx;
                return (
                  <div
                    key={realIdx}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
                        <IoWater className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">{entry.ml} ml</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.time}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeEntry(user?.uid, realIdx)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-700 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <IoTrashOutline className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Tip */}
      <div className="flex items-start gap-3 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl border border-cyan-100 dark:border-cyan-800/40">
        <span className="text-xl flex-shrink-0">💡</span>
        <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 leading-relaxed">{tip}</p>
      </div>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Configuración">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">Meta Diaria</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[1500, 2000, 2500, 3000, 3500, 4000].map(v => (
                <button key={v} onClick={() => setTempTarget(v)}
                  className={`py-3 rounded-2xl text-sm font-black transition-all ${tempTarget === v ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  {v >= 1000 ? `${v/1000}L` : `${v} ml`}
                </button>
              ))}
            </div>
            <Input label="O ingresa un valor (ml)" type="number" value={tempTarget} onChange={e => setTempTarget(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">Tamaño del Vaso</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[150, 200, 250, 350].map(v => (
                <button key={v} onClick={() => setTempGlassSize(v)}
                  className={`py-3 rounded-2xl text-sm font-black transition-all ${tempGlassSize === v ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  {v} ml
                </button>
              ))}
            </div>
            <Input label="O ingresa un valor (ml)" type="number" value={tempGlassSize} onChange={e => setTempGlassSize(parseInt(e.target.value) || 0)} />
          </div>
          <Button onClick={handleSaveSettings} className="w-full h-14 bg-cyan-500 hover:bg-cyan-400 text-white">
            Guardar Configuración
          </Button>
        </div>
      </Modal>
    </div>
  );
}

