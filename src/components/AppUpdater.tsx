import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UpdateService, UpdateInfo } from '../services/updateService';
import { Download, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export const AppUpdater: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only check on native platforms (Android)
    if (Capacitor.getPlatform() === 'android') {
      checkForUpdates();
    }
  }, []);

  const checkForUpdates = async () => {
    const info = await UpdateService.checkForUpdates();
    if (info) {
      setUpdateInfo(info);
    }
  };

  const handleUpdate = async () => {
    if (!updateInfo) return;
    
    setIsDownloading(true);
    setError(null);
    try {
      await UpdateService.downloadAndInstall(updateInfo.downloadUrl, (p) => {
        setProgress(p);
      });
    } catch (err: any) {
      setError('Falha ao baixar atualização. Tente novamente mais tarde.');
      setIsDownloading(false);
    }
  };

  if (isDismissed || !updateInfo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Atualização Disponível</h3>
                  <p className="text-xs text-gray-500">Versão {updateInfo.version}</p>
                </div>
              </div>
              {!isDownloading && (
                <button 
                  onClick={() => setIsDismissed(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 line-clamp-3">
                {updateInfo.releaseNotes || 'Novas melhorias e correções de erros.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isDownloading ? (
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Baixando...</span>
                  <span className="text-blue-600 font-mono">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-blue-600"
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-blue-200"
                >
                  Atualizar Agora
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Depois
                </button>
              </div>
            )}
          </div>
          
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Dados do sistema preservados</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
