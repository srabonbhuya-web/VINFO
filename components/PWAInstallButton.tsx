import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';

const GITHUB_REPO_URL = 'https://github.com/srabonbhuya-web/VINFO';
const APK_DOWNLOAD_URL = 'https://github.com/srabonbhuya-web/VINFO/releases/latest/download/VINFO.apk';
const PWA_BUILDER_URL = 'https://www.pwabuilder.com/';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed and running as standalone app, hide the top button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Button in Header */}
      {isInstallable ? (
        <button
          onClick={install}
          type="button"
          className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-semibold py-1.5 px-3 rounded-xl text-[11px] sm:text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 border border-indigo-400/40"
          title="Install RFL App on your phone"
        >
          <img src="/pwa-192x192.png" alt="RFL Icon" className="w-4 h-4 rounded-md object-contain" />
          <i className="fa-solid fa-download text-[11px]"></i>
          <span>Install App / APK</span>
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
          title="Install App or Download APK"
        >
          <img src="/pwa-192x192.png" alt="RFL Icon" className="w-3.5 h-3.5 rounded-md object-contain" />
          <i className="fa-solid fa-download text-[10px] text-indigo-400"></i>
          <span>App / APK</span>
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

      {/* General Browser & APK Download Modal */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-gray-900 border border-gray-700 p-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <img src="/pwa-192x192.png" alt="RFL" className="w-12 h-12 rounded-2xl shadow-lg border border-red-500/40 object-contain" />
                <div>
                  <h3 className="text-base font-bold text-white">VINFO / RFL Android App</h3>
                  <p className="text-xs text-indigo-400 font-mono">srabonbhuya-web/VINFO</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300">
              {/* Option 1: Direct WebAPK Install (Recommended) */}
              <div className="bg-gray-850 rounded-2xl p-3.5 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    <i className="fa-brands fa-android"></i>
                  </span>
                  <strong className="text-white text-xs sm:text-sm">পদ্ধতি ১: ব্রাউজার থেকে সরাসরি ইনস্টল (WebAPK)</strong>
                </div>
                <p className="text-gray-400 leading-relaxed text-[11px] sm:text-xs">
                  কোনো আলাদা APK ডাউনলোড বা সিকিউরিটি ওয়ার্নিং ছাড়াই সরাসরি আপনার মোবাইলে নেটিভ অ্যান্ড্রয়েড অ্যাপের মতো ইনস্টল হয়:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-300 text-[11px] sm:text-xs">
                  <li>মোবাইলের <strong>Chrome</strong> ব্রাউজারে ৩-ডট মেনুতে (<i className="fa-solid fa-ellipsis-vertical text-indigo-400"></i>) ট্যাপ করুন।</li>
                  <li><strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> বাটনে চাপ দিন।</li>
                  <li>আপনার ফোনে <strong>"RFL"</strong> আইকন সহ সম্পূর্ণ অ্যাপ ইনস্টল হয়ে যাবে।</li>
                </ol>
                {isInstallable && (
                  <button
                    onClick={() => {
                      setShowGuideModal(false);
                      install();
                    }}
                    className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <i className="fa-solid fa-download"></i>
                    <span>এখনই সরাসরি ইনস্টল করুন</span>
                  </button>
                )}
              </div>

              {/* Option 2: Direct APK Download Link */}
              <div className="bg-gray-850 rounded-2xl p-3.5 border border-gray-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-600/30 text-red-400 flex items-center justify-center font-bold text-xs">
                    <i className="fa-solid fa-file-arrow-down"></i>
                  </span>
                  <strong className="text-white text-xs sm:text-sm">পদ্ধতি ২: VINFO.APK ডাইরেক্ট ডাউনলোড</strong>
                </div>
                <p className="text-gray-400 text-[11px] sm:text-xs leading-relaxed">
                  আপনার GitHub রিপোজিটরি <strong>srabonbhuya-web/VINFO</strong> থেকে সরাসরি <code>VINFO.apk</code> ডাউনলোড করতে নিচের বাটনে ক্লিক করুন:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={APK_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-md active:scale-95 text-center"
                  >
                    <i className="fa-solid fa-download"></i>
                    <span>Download VINFO.apk</span>
                  </a>
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all text-center active:scale-95"
                  >
                    <i className="fa-brands fa-github"></i>
                    <span>GitHub Repo</span>
                  </a>
                </div>
              </div>

              {/* Option 3: Generate APK via PWABuilder */}
              <div className="bg-gray-850/80 rounded-2xl p-3 border border-gray-800 text-[11px] text-gray-400 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
                  <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                  <span>নিজে APK বিল্ড করতে চান?</span>
                </div>
                <p>
                  <strong>PWABuilder.com</strong>-এ গিয়ে এই অ্যাপের URL পেস্ট করে মাত্র ১ ক্লিকে প্লে-স্টোর ও অ্যান্ড্রয়েডের জন্য সরাসরি <strong>VINFO.apk</strong> তৈরি করে ডাউনলোড করতে পারেন।
                </p>
                <div className="pt-1">
                  <a
                    href={PWA_BUILDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    <span>PWABuilder ওপেন করুন</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full rounded-xl bg-gray-800 hover:bg-gray-700 py-2.5 text-xs font-semibold text-gray-300 transition-all border border-gray-700 active:scale-95"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </>
  );
};
