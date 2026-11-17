import type { AnalysisResponse, AssistantConfig, AssistantQuestionRequest, AssistantResponse, BackendHealth, CaptureInterface, CaptureStatus } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || ''

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number = 500) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Check backend and TShark installation status
 */
export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      throw new ApiError(`Health check returned status ${res.status}`, res.status)
    }

    return await res.json()
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err
    const msg = err instanceof Error ? err.message : 'Backend connection unavailable'
    throw new ApiError(msg, 0)
  }
}

/**
 * Upload a .pcap or .pcapng file to the FastAPI backend for TShark dissection
 */
export async function uploadAndAnalyzeCapture(
  file: File,
  maxPackets: number = 1000
): Promise<AnalysisResponse> {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await fetch(`${API_BASE}/api/captures/analyze?max_packets=${maxPackets}`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`
      try {
        const errorJson = await res.json()
        if (errorJson && errorJson.detail) {
          errorMsg = errorJson.detail
        }
      } catch {
        // Fallback to text
        const text = await res.text()
        if (text) errorMsg = text
      }
      throw new ApiError(errorMsg, res.status)
    }

    const data: AnalysisResponse = await res.json()
    return data
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err
    const msg =
      err instanceof Error
        ? err.message
        : 'Failed to connect to the packet processing backend.'
    throw new ApiError(msg, 0)
  }
}

export async function askOpenAIAssistant(
  request: AssistantQuestionRequest
): Promise<AssistantResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(request),
    })

    if (!res.ok) {
      let errorMsg = `Assistant request failed (${res.status})`
      try {
        const errorJson = await res.json()
        if (errorJson?.detail) errorMsg = errorJson.detail
      } catch {
        // Keep the safe status-based fallback.
      }
      throw new ApiError(errorMsg, res.status)
    }
    return await res.json()
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err
    const msg = err instanceof Error ? err.message : 'Failed to connect to the OpenAI Assistant backend.'
    throw new ApiError(msg, 0)
  }
}

export async function getAssistantConfig(): Promise<AssistantConfig> {
  try {
    const res = await fetch(`${API_BASE}/api/assistant/config`, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new ApiError(`Assistant configuration returned status ${res.status}`, res.status)
    return await res.json()
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err
    throw new ApiError(err instanceof Error ? err.message : 'Assistant configuration unavailable.', 0)
  }
}

async function captureRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) {
    let message = `Capture agent request failed (${res.status})`
    try { const body = await res.json(); if (body?.detail) message = body.detail } catch { /* status fallback */ }
    throw new ApiError(message, res.status)
  }
  return await res.json() as T
}

export const listCaptureInterfaces = () => captureRequest<CaptureInterface[]>('/api/capture/interfaces')
export const getCaptureStatus = () => captureRequest<CaptureStatus>('/api/capture/status')
export const startLocalCapture = (interfaceId: string) => captureRequest<CaptureStatus>('/api/capture/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interface_id: interfaceId }) })
export const stopLocalCapture = () => captureRequest<AnalysisResponse>('/api/capture/stop', { method: 'POST' })
