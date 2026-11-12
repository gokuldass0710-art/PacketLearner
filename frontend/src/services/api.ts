import type { AnalysisResponse, BackendHealth } from '../types'

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
