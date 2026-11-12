import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  X,
  Shield,
  ArrowRight,
  Loader2,
  Terminal,
} from 'lucide-react'
import { CyberButton } from '../ui/CyberButton'
import { uploadAndAnalyzeCapture, ApiError } from '../../services/api'
import type { AnalysisResponse } from '../../types'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onAnalysisSuccess: (data: AnalysisResponse) => void
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAnalysisSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null)
    const validExtensions = ['.pcap', '.pcapng']
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )

    if (!hasValidExt) {
      setErrorMsg('Invalid format. Please select a .pcap or .pcapng file.')
      setSelectedFile(null)
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50MB maximum upload limit.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    setErrorMsg(null)
    setLoadingStage('Streaming capture to analysis backend...')

    try {
      const stageTimer = setTimeout(() => {
        setLoadingStage('Invoking TShark subprocess decoder...')
      }, 700)

      const result = await uploadAndAnalyzeCapture(selectedFile)
      clearTimeout(stageTimer)

      setLoadingStage('Analysis complete!')
      onAnalysisSuccess(result)
      onClose()
      setSelectedFile(null)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setErrorMsg(
            'Cannot connect to PacketLearner backend. Ensure FastAPI server is running on http://127.0.0.1:8000.'
          )
        } else {
          setErrorMsg(err.message)
        }
      } else {
        setErrorMsg('An unexpected error occurred during packet analysis.')
      }
    } finally {
      setIsLoading(false)
      setLoadingStage('')
    }
  }

  const handleModalClose = () => {
    if (isLoading) return // Prevent closing while processing
    setErrorMsg(null)
    setSelectedFile(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-cyber-surface border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyber-neon/10 border border-cyber-neon/30 text-cyber-neon">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Upload Packet Capture</h3>
              <p className="text-xs text-cyber-muted">
                Analyzed locally by Wireshark TShark via FastAPI
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            disabled={isLoading}
            className="p-1 rounded-md text-cyber-muted hover:text-white hover:bg-white/5 disabled:opacity-30"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        {!isLoading && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-cyber-neon bg-cyber-neon/5 shadow-lg shadow-cyber-neon/10'
                : 'border-white/15 hover:border-cyber-blue/50 bg-black/30'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pcap,.pcapng"
              className="hidden"
              onChange={handleChange}
            />

            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyber-blue mb-3">
              <UploadCloud className="w-6 h-6 text-cyber-neon" />
            </div>

            <div className="text-sm font-semibold text-white">
              Click to select or drag &amp; drop
            </div>
            <p className="text-xs text-cyber-muted mt-1">
              Supports .pcap and .pcapng files up to 50 MB
            </p>
          </div>
        )}

        {/* Loading Progress State */}
        {isLoading && (
          <div className="border border-cyber-blue/30 bg-black/40 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-cyber-blue/20 border-t-cyber-neon animate-spin flex items-center justify-center" />
              <Terminal className="w-6 h-6 text-cyber-neon absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">Decoding Packets</div>
              <p className="text-xs font-mono text-cyber-neon animate-pulse">
                {loadingStage}
              </p>
            </div>
            <p className="text-[11px] text-cyber-muted max-w-xs">
              TShark is extracting frame metadata, packet headers, protocols, and talker metrics.
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1">
              <span className="font-semibold block text-red-200">Analysis Error</span>
              <span className="leading-relaxed block">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Selected file preview */}
        {selectedFile && !isLoading && !errorMsg && (
          <div className="p-3 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 truncate">
              <FileCheck className="w-4 h-4 text-cyber-neon flex-shrink-0" />
              <div className="truncate">
                <span className="font-mono text-white font-medium block truncate">
                  {selectedFile.name}
                </span>
                <span className="text-[11px] text-cyber-muted font-mono">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for TShark analysis
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-neon/20 text-cyber-neon border border-cyber-neon/40 uppercase">
              Valid Format
            </span>
          </div>
        )}

        {/* Backend notice */}
        {!isLoading && (
          <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 text-xs text-cyber-muted">
            <div className="flex items-center gap-1.5 text-cyber-text font-medium text-[11px]">
              <Shield className="w-3.5 h-3.5 text-cyber-blue" />
              <span>Security &amp; Processing:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Files are streamed into an isolated temporary file, analyzed via TShark with address-resolution disabled, and immediately deleted upon completion.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <CyberButton
            variant="ghost"
            size="md"
            onClick={handleModalClose}
            disabled={isLoading}
          >
            Cancel
          </CyberButton>
          <CyberButton
            variant="neon"
            size="md"
            disabled={!selectedFile || isLoading}
            onClick={handleAnalyze}
            icon={
              isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )
            }
          >
            {isLoading ? 'Analyzing...' : 'Start TShark Analysis'}
          </CyberButton>
        </div>
      </div>
    </div>
  )
}
