import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { X, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QRCodeScannerProps {
  onScan: (isbn: string) => void
  onClose: () => void
}

export default function QRCodeScanner({ onScan, onClose }: QRCodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const hasScanned = useRef(false) // Prevents multiple scans from firing
  const scannerDivId = 'qr-reader'

  useEffect(() => {
    // Initialize scanner only once
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        scannerDivId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      )

      scannerRef.current.render(
        (decodedText) => {
          // Block if already scanned - prevents looping on same barcode
          if (hasScanned.current) return
          hasScanned.current = true

          // Stop scanner immediately after successful scan
          scannerRef.current?.clear().catch(() => {})

          // Extract ISBN from QR code
          const isbn = extractISBN(decodedText)
          onScan(isbn || decodedText)
        },
        (_error) => {
          // Suppress scan errors - normal during scanning
        }
      )
    }

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.error('Failed to clear scanner:', error)
        })
        scannerRef.current = null
      }
    }
  }, []) // Empty deps - only run once on mount

  /**
   * Extract ISBN from scanned QR code text
   * Handles various formats: ISBN-10, ISBN-13, with/without hyphens
   */
  const extractISBN = (text: string): string => {
    // Remove all non-digit and non-X characters
    const cleaned = text.replace(/[^0-9X]/gi, '')
    
    // Check for ISBN-13 (13 digits)
    if (cleaned.length === 13 && /^\d{13}$/.test(cleaned)) {
      return cleaned
    }
    
    // Check for ISBN-10 (10 digits, last char can be X)
    if (cleaned.length === 10 && /^\d{9}[0-9X]$/i.test(cleaned)) {
      return cleaned
    }
    
    // Try to find ISBN-13 pattern in the text
    const isbn13Match = text.match(/(?:ISBN[-\s]?(?:13)?:?\s?)?(\d{3}[-\s]?\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d{1})/)
    if (isbn13Match) {
      return isbn13Match[1].replace(/[-\s]/g, '')
    }
    
    // Try to find ISBN-10 pattern in the text
    const isbn10Match = text.match(/(?:ISBN[-\s]?(?:10)?:?\s?)?(\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?[0-9X])/)
    if (isbn10Match) {
      return isbn10Match[1].replace(/[-\s]/g, '')
    }
    
    // Return cleaned text if it looks like an ISBN
    if (cleaned.length >= 10 && cleaned.length <= 13) {
      return cleaned
    }
    
    // Return original text if no ISBN pattern found
    return text
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-[#9770FF]/20">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-[#9770FF] to-[#0033FF] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ScanLine className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Scan ISBN Barcode</h3>
                <p className="text-white/80 text-sm">Position the barcode within the frame</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-9 w-9 rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scanner Container */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800">
          <div id={scannerDivId} className="rounded-xl overflow-hidden border-2 border-[#9770FF]/30"></div>
          
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">How to scan:</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Hold your device steady and align the ISBN barcode within the scanning frame. The scanner will automatically detect and read the code.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-muted-foreground font-medium">Supported Format</p>
                <p className="text-sm font-bold text-[#9770FF] mt-1">ISBN-10 & ISBN-13</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-muted-foreground font-medium">Auto-Detection</p>
                <p className="text-sm font-bold text-green-600 mt-1">Enabled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-11 font-semibold border-2 hover:border-[#9770FF] hover:text-[#9770FF]"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Scanning
          </Button>
        </div>
      </div>
    </div>
  )
}