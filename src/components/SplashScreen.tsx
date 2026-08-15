"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Car, Dices, Map, Play } from "lucide-react"

const SplashBoard = dynamic(() => import("./SplashBoard"), { ssr: false })

interface SplashScreenProps {
  onStart: () => void
}

function useLiteSplash() {
  const [lite, setLite] = useState(true)

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches
    const small = window.matchMedia("(max-width: 768px)").matches
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    setLite(coarse || small || Boolean(connection?.saveData))
  }, [])

  return lite
}

export default function SplashScreen({ onStart }: SplashScreenProps) {
  const [entered, setEntered] = useState(false)
  const lite = useLiteSplash()

  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 250)
    return () => window.clearTimeout(id)
  }, [])

  const fadeInUp = (delay: number): React.CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s`,
  })

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[radial-gradient(circle_at_top,#e9ecff_0%,#dfe5ff_25%,#bcbcf6_55%,#2c225f_100%)] text-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(255,255,255,0.06)_38%,rgba(20,16,53,0.18)_70%,rgba(12,10,30,0.4))]" />

      <div className="relative z-10 grid min-h-dvh grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex items-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="max-w-2xl">
            <div
              style={fadeInUp(0)}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-md"
            >
              Played on real OS Maps of Britain
            </div>

            <h1
              style={fadeInUp(0.08)}
              className="max-w-xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl"
            >
              Oscillation
            </h1>

            <p
              style={fadeInUp(0.16)}
              className="mt-5 max-w-xl text-lg leading-8 text-slate-700 sm:text-xl"
            >
              Roll the dice, race along A and B roads, and visit pubs, churches, phone boxes and schools on authentic Ordnance Survey maps.
            </p>

            <div style={fadeInUp(0.24)} className="mt-8">
              <button
                type="button"
                onClick={onStart}
                className="group inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-base font-semibold text-white shadow-2xl"
              >
                <Play className="h-4 w-4 transition group-hover:translate-x-0.5" />
                Start game
              </button>
            </div>

            <div style={fadeInUp(0.32)} className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  icon: <Car className="h-4 w-4" />,
                  title: "Race across Britain",
                  text: "Move along real A-roads and B-roads on the OS map",
                },
                {
                  icon: <Dices className="h-4 w-4" />,
                  title: "Strategic play",
                  text: "Collect tokens from pubs, churches, phones and schools",
                },
                {
                  icon: <Map className="h-4 w-4" />,
                  title: "Real cartography",
                  text: "Every game is a different sheet of the British countryside",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/45 bg-white/55 p-5 shadow-lg backdrop-blur-md"
                >
                  <div className="mb-3 inline-flex rounded-xl bg-slate-900 p-2 text-white">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[280px] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div
            style={fadeInUp(0.16)}
            className="relative h-[280px] w-full max-w-[820px] overflow-hidden rounded-[2rem] border border-white/35 bg-white/10 shadow-[0_30px_100px_rgba(17,15,50,0.45)] sm:h-[460px] xl:h-[620px]"
          >
            {lite ? (
              <img
                src="/splash-screen.jpg"
                alt="Oscillation board"
                className="h-full w-full object-cover"
              />
            ) : (
              <SplashBoard />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
