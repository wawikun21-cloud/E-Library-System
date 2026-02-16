import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { X, Camera, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QRCodeScannerProps {
  onScan: (isbn: string) => void
  onClose: () => void
}

export default function QRCodeScanner({ onScan, onClose }: QRCodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const hasInitialized = useRef(false)
  const hasScanned = useRef(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')
  const scannerDivId = 'html5qr-code-full-region'

  useEffect(() => {
    // Prevent duplicate initialization
    if (hasInitialized.current) {
      console.log('⚠️ Already initialized')
      return
    }

    hasInitialized.current = true
    console.log('🚀 Initializing scanner...')

    // Wait for DOM to be ready
    const initTimer = setTimeout(() => {
      const element = document.getElementById(scannerDivId)

      if (!element) {
        console.error('❌ Scanner element not found')
        setError('Scanner element not found')
        hasInitialized.current = false
        return
      }

      console.log('✅ Element found, creating scanner...')

      try {
        scannerRef.current = new Html5QrcodeScanner(
          scannerDivId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
          },
          false
        )

        scannerRef.current.render(
          (decodedText) => {
            if (hasScanned.current) return
            hasScanned.current = true

            console.log('✅ Scanned:', decodedText)

            // Stop scanner
            if (scannerRef.current) {
              scannerRef.current.clear().catch(() => {})
            }

            const isbn = extractISBN(decodedText)
            onScan(isbn || decodedText)
          },
          (error) => {
            // Suppress normal scanning messages
            if (!error.includes('No QR code found') && 
                !error.includes('NotFoundException')) {
              console.warn('Scanner:', error)
            }
          }
        )

        setIsReady(true)
        console.log('✅ Scanner ready')
      } catch (err: any) {
        console.error('❌ Init failed:', err)
        setError(err.message || 'Failed to start camera')
        hasInitialized.current = false
      }
    }, 200)

    return () => {
      clearTimeout(initTimer)
      if (scannerRef.current) {
        console.log('🧹 Cleaning up...')
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
      hasInitialized.current = false
      hasScanned.current = false
    }
  }, [])

  const extractISBN = (text: string): string => {
    const cleaned = text.replace(/[^0-9X]/gi, '')
    
    if (cleaned.length === 13 && /^\d{13}$/.test(cleaned)) {
      return cleaned
    }
    
    if (cleaned.length === 10 && /^\d{9}[0-9X]$/i.test(cleaned)) {
      return cleaned
    }
    
    const isbn13Match = text.match(/(?:ISBN[-\s]?(?:13)?:?\s?)?(\d{3}[-\s]?\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d{1})/)
    if (isbn13Match) {
      return isbn13Match[1].replace(/[-\s]/g, '')
    }
    
    const isbn10Match = text.match(/(?:ISBN[-\s]?(?:10)?:?\s?)?(\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?[0-9X])/)
    if (isbn10Match) {
      return isbn10Match[1].replace(/[-\s]/g, '')
    }
    
    if (cleaned.length >= 10 && cleaned.length <= 13) {
      return cleaned
    }
    
    return text
  }

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {})
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#9770FF] to-[#0033FF] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              {isReady ? (
                <Camera className="h-5 w-5 text-white" />
              ) : (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              )}
            </div>
            <h3 className="text-white font-semibold text-lg">
              {isReady ? 'Scan ISBN Barcode' : 'Starting Camera...'}
            </h3>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scanner Container */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Camera Error</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Please allow camera access in your browser settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scanner element - camera will render here */}
          <div 
            id={scannerDivId} 
            className="rounded-lg overflow-hidden min-h-[300px] bg-black"
          />
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p className="mb-2 font-medium">Position the ISBN barcode within the frame</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>Supports ISBN-10 & ISBN-13</span>
              {isReady && (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Camera Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t">
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full h-10 font-medium"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}