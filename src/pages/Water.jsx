import { useState } from 'react';
import {
  IoWater,
  IoAddOutline,
  IoRemoveOutline,
  IoSettingsOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';
import { Card, Button, ProgressRing, Modal, Input } from '@/components/ui';
import { useWaterStore } from '@/stores';

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

  const today = getTodayProgress();
  const weekProgress = getWeekProgress();

  const [tempTarget, setTempTarget] = useState(targetMl);
  const [tempGlassSize, setTempGlassSize] = useState(glassSize);

  const quickAmounts = [150, 250, 500, 750];

  const handleSaveSettings = () => {
    setTarget(tempTarget);
    setGlassSize(tempGlassSize);
    setIsSettingsOpen(false);
  };

  const progressColor = today.progress >= 1 ? '#10B981' : '#06B6D4';

  return (
    <div className="px-4 py-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <div className="flex items-center gap-2">
            <IoWater className="w-6 h-6 text-cyan-600" />
            <h1 className="text-2xl font-bold text-gray-900">Hidratacion</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Mantente hidratado</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10"
        >
          <IoSettingsOutline className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Progress */}
      <Card className="py-8 shadow-lg">
        <div className="flex flex-col items-center">
          <ProgressRing
            progress={today.progress}
            size={180}
            strokeWidth={14}
            color={progressColor}
          >
            <div className="text-center">
              {today.progress >= 1 ? (
                <>
                  <IoCheckmarkCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-base font-bold text-green-600">Meta cumplida!</p>
                </>
              ) : (
                <>
                  <IoWater className="w-7 h-7 text-cyan-500 mx-auto mb-1" />
                  <p className="text-3xl font-bold text-gray-900">{today.consumed}</p>
                  <p className="text-gray-500 text-sm">de {today.target} ml</p>
                </>
              )}
            </div>
          </ProgressRing>

          <p className="mt-6 text-gray-600 text-sm">
            {today.remaining > 0 ? (
              <>Faltan <span className="font-semibold text-cyan-600">{today.remaining} ml</span> para tu meta</>
            ) : (
              <span className="text-green-600 font-medium flex items-center justify-center gap-1"><IoCheckmarkCircle className="w-4 h-4" /> Excelente trabajo!</span>
            )}
          </p>
        </div>
      </Card>

      {/* Quick Add */}
      <Card className="shadow-sm">
        <Card.Header>
          <h2 className="font-semibold text-gray-900">Agregar agua</h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => addWater(amount)}
                className="flex-col py-3 px-2 h-auto active-scale-95 transition-transform"
              >
                <span className="text-base font-bold">{amount}</span>
                <span className="text-[10px] text-gray-500">ml</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-4">
            <Button
              variant="secondary"
              size="icon"
              onClick={removeLastEntry}
              disabled={today.entries.length === 0}
              className="w-12 h-12 rounded-xl"
            >
              <IoRemoveOutline className="w-6 h-6" />
            </Button>

            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{glassSize} ml</p>
              <p className="text-xs text-gray-500">Vaso predeterminado</p>
            </div>

            <Button
              size="icon"
              onClick={() => addWater()}
              className="w-12 h-12 rounded-xl"
            >
              <IoAddOutline className="w-6 h-6" />
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Today's Log */}
      {today.entries.length > 0 && (
        <Card className="shadow-sm">
          <Card.Header>
            <h2 className="font-semibold text-gray-900">Registro de hoy</h2>
          </Card.Header>
          <Card.Body className="p-3">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {today.entries.slice().reverse().map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 flex items-center justify-center">
                      <IoWater className="w-4 h-4 text-cyan-600" />
                    </div>
                    <span className="text-sm text-gray-600">{entry.time}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{entry.ml} ml</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Week Overview */}
      <Card className="shadow-sm">
        <Card.Header>
          <h2 className="font-semibold text-gray-900">Esta semana</h2>
        </Card.Header>
        <Card.Body>
          <div className="flex justify-between items-end h-28 px-2">
            {weekProgress.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-full max-w-[28px] rounded-lg transition-all duration-300 ${day.progress >= 1 ? 'bg-green-500' : 'bg-cyan-500'
                    }`}
                  style={{
                    height: `${Math.max(day.progress * 100, 8)}%`,
                    opacity: day.progress > 0 ? 1 : 0.2
                  }}
                />
                <span className={`text-xs ${index === 6 ? 'font-bold text-cyan-600' : 'text-gray-500'
                  }`}>
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Configuracion"
      >
        <div className="space-y-5">
          <Input
            label="Meta diaria (ml)"
            type="number"
            value={tempTarget}
            onChange={(e) => setTempTarget(parseInt(e.target.value) || 0)}
          />
          <Input
            label="Tamano del vaso (ml)"
            type="number"
            value={tempGlassSize}
            onChange={(e) => setTempGlassSize(parseInt(e.target.value) || 0)}
          />
          <Button onClick={handleSaveSettings} className="w-full mt-4">
            Guardar cambios
          </Button>
        </div>
      </Modal>
    </div>
  );
}
