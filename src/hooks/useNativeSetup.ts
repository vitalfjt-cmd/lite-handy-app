import { useState, useEffect } from 'react'
import { AppView } from '../types'

const NATIVE_CONFIG_KEY = 'lite-pos.native-config'

export type NativeConfig = {
  view: AppView
  storeSlug: string
  qrToken: string
  ticketToken?: string
  terminalName?: string
}

export function useNativeSetup() {
  const [config, setConfig] = useState<NativeConfig | null>(() => {
    const saved = localStorage.getItem(NATIVE_CONFIG_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  })

  const saveConfig = (next: NativeConfig) => {
    setConfig(next)
    localStorage.setItem(NATIVE_CONFIG_KEY, JSON.stringify(next))
  }

  const resetConfig = () => {
    setConfig(null)
    localStorage.removeItem(NATIVE_CONFIG_KEY)
  }

  return {
    config,
    saveConfig,
    resetConfig,
    isConfigured: config !== null
  }
}
