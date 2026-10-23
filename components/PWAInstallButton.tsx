import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed and running as standalone app, hide the button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Button */}
      {isInstallable ? (
        <button
          onClick={install}
          type="button"
          className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-semibold py-1.5 px-3 rounded-xl text-[11px] sm:text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 border border-indigo-400/40"
          title="Install RFL App on your phone"
        >
          <img src="/pwa-192x192.png" alt="RFL Icon" className="w-4 h-4 rounded-md object-contain" />
          <i className="fa-solid fa-download text-[11px]"></i>
          <span>Install App</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowIOSGuide(true)}
          type="button"
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700 font-medium py-1.5 px-2.5 rounded-xl text-[11px] transition-all active:scale-95"
          title="Install RFL App on iPhone / iPad"
        >
          <img src="/pwa-192x192.png" alt="RFL Icon" className="w-4 h-4 rounded-md object-contain" />
          <i className="fa-brands fa-apple text-xs"></i>
          <span>Add to Home</span>
        </button>
      ) : (
        <button
          onClick={() => setShowGuideModal(true)}
          type="button"
          className="flex items-center gap-1.5 bg-gray-800/90 hover:bg-gray-750 text-gray-300 border border-gray-700/80 font-medium py-1.5 px-2.5 rounded-xl text-[11px] transition-all active:scale-95"
          title="How to install RFL App"
        >
          <img src="/pwa-192x192.png" alt="RFL Icon" className="w-3.5 h-3.5 rounded-md object-contain" />
          <i className="fa-solid fa-mobile-screen-button text-[10px] text-indigo-400"></i>
          <span>Install App</span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl bg-gray-900 border border-gray-700 p-5 shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-3">
              <img src="/pwa-192x192.png" alt="RFL" className="w-12 h-12 rounded-2xl shadow-lg border border-indigo-500/40" />
              <div>
                <h3 className="text-base font-bold text-white">Install RFL App</h3>
                <p className="text-xs text-gray-400">Khulna Depot - 16531</p>
              </div>
            </div>

            <div className="bg-gray-850 rounded-2xl p-3 space-y-2 text-xs text-gray-300 border border-gray-800">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 text-[11px] font-bold">1</span>
                <span>Safari ব্রাউজারের নিচে <strong>Share</strong> বোতামে (<i className="fa-solid fa-arrow-up-from-bracket text-indigo-400"></i>) ট্যাপ করুন।</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 text-[11px] font-bold">2</span>
                <span>মেনু থেকে <strong>"Add to Home Screen"</strong> (<i className="fa-regular fa-square-plus text-indigo-400"></i>) সিলেক্ট করুন।</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 text-[11px] font-bold">3</span>
                <span>উপরে <strong>"Add"</strong> চাপলে মোবাইলের হোম স্ক্রিনে <strong>"RFL"</strong> আইকন যুক্ত হয়ে যাবে!</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition-all shadow-md active:scale-95"
            >
              বুঝেছি / ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* General Browser Guide Modal */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl bg-gray-900 border border-gray-700 p-5 shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-3">
              <img src="/pwa-192x192.png" alt="RFL" className="w-12 h-12 rounded-2xl shadow-lg border border-indigo-500/40" />
              <div>
                <h3 className="text-base font-bold text-white">মোবাইলে অ্যাপ ইনস্টল করুন</h3>
                <p className="text-xs text-gray-400">"RFL" নামে হোম স্ক্রিনে সেভ হবে</p>
              </div>
            </div>

            <div className="bg-gray-850 rounded-2xl p-3 space-y-2 text-xs text-gray-300 border border-gray-800">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 text-[11px] font-bold">1</span>
                <span>Chrome ব্রাউজারের উপরের ৩-ডট মেনুতে (<i className="fa-solid fa-ellipsis-vertical text-indigo-400"></i>) চাপ দিন।</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 text-[11px] font-bold">2</span>
                <span><strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> সিলেক্ট করুন।</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center flex-shrink-0 text-[11px] font-bold">3</span>
                <span>ইনস্টল সম্পন্ন হলে আপনার মোবাইলের হোম স্ক্রিনে <strong>"RFL"</strong> আইকন দেখা যাবে।</span>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition-all shadow-md active:scale-95"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </>
  );
};
