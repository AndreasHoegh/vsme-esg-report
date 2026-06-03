import { useState, useCallback } from 'react'
import { supabase, getDeviceId } from '../lib/supabase'

async function getOwnerFilter() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user?.id) return { user_id: session.user.id }
  return { device_id: getDeviceId() }
}

export function useCloudSync() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saves, setSaves] = useState([])
  const [error, setError] = useState(null)

  const saveReport = useCallback(async (data, name, includeCanvas = true) => {
    setSaving(true)
    setError(null)
    try {
      const owner = await getOwnerFilter()
      const payload = { ...data }
      if (includeCanvas) {
        try {
          const draft = localStorage.getItem('vsme_canvas_draft')
          if (draft) payload.__canvasDraft = JSON.parse(draft)
        } catch {}
      }
      const { error: err } = await supabase
        .from('reports')
        .insert({
          ...owner,
          name: name || data.companyName || 'ESG Report',
          data: payload,
        })
      if (err) throw err
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  const updateReport = useCallback(async (id, data, name, includeCanvas = true) => {
    setSaving(true)
    setError(null)
    try {
      const owner = await getOwnerFilter()
      const filter = Object.entries(owner)[0]
      const payload = { ...data }
      if (includeCanvas) {
        try {
          const draft = localStorage.getItem('vsme_canvas_draft')
          if (draft) payload.__canvasDraft = JSON.parse(draft)
        } catch {}
      }
      const { error: err } = await supabase
        .from('reports')
        .update({ name: name || data.companyName || 'ESG Report', data: payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq(filter[0], filter[1])
      if (err) throw err
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  const listSaves = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const owner = await getOwnerFilter()
      const filter = Object.entries(owner)[0]
      const { data, error: err } = await supabase
        .from('reports')
        .select('id, name, created_at, updated_at')
        .eq(filter[0], filter[1])
        .order('updated_at', { ascending: false })
        .limit(20)
      if (err) throw err
      setSaves(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadReport = useCallback(async (id, withCanvas = true) => {
    setLoading(true)
    setError(null)
    try {
      const owner = await getOwnerFilter()
      const filter = Object.entries(owner)[0]
      const { data, error: err } = await supabase
        .from('reports')
        .select('data')
        .eq('id', id)
        .eq(filter[0], filter[1])
        .single()
      if (err) throw err
      const { __canvasDraft, ...formData } = data.data || {}
      const { images: _i, ...snap } = formData

      if (__canvasDraft) {
        const { states = {}, customizedPageIndices = [], settings } = __canvasDraft

        // Write a settings-only draft so theme/font/colors are restored, but with
        // no page states — non-customised pages will fresh-render from form data.
        const settingsDraft = { states: {}, customizedPageIndices: [], settings: settings || {}, dataSnapshot: snap }
        try { localStorage.setItem('vsme_canvas_draft', JSON.stringify(settingsDraft)) } catch {}

        // Write only the manually-customised page states to page overrides so they
        // load with priority. Non-customised pages have no override → fresh render.
        if (customizedPageIndices.length > 0) {
          const customizedStates = {}
          customizedPageIndices.forEach(idx => { if (states[idx]) customizedStates[idx] = states[idx] })
          const pageOverrides = { pageCount: 0, states: customizedStates, dataSnapshot: snap }
          try { localStorage.setItem('vsme_canvas_page_overrides', JSON.stringify(pageOverrides)) } catch {}
        } else {
          localStorage.removeItem('vsme_canvas_page_overrides')
        }
      } else {
        localStorage.removeItem('vsme_canvas_draft')
        localStorage.removeItem('vsme_canvas_page_overrides')
      }
      localStorage.removeItem('vsme_canvas_user_objects')
      return { formData, canvasDraft: null }
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const loadLatestCanvasDraft = useCallback(async () => {
    try {
      const owner = await getOwnerFilter()
      const filter = Object.entries(owner)[0]
      const { data, error: err } = await supabase
        .from('reports')
        .select('data')
        .eq(filter[0], filter[1])
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      if (err || !data) return null
      const { __canvasDraft } = data.data || {}
      return __canvasDraft || null
    } catch { return null }
  }, [])

  const deleteSave = useCallback(async (id) => {
    const owner = await getOwnerFilter()
    const filter = Object.entries(owner)[0]
    const { error: err } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)
      .eq(filter[0], filter[1])
    if (!err) setSaves(prev => prev.filter(s => s.id !== id))
  }, [])

  return { saveReport, updateReport, listSaves, loadReport, loadLatestCanvasDraft, deleteSave, saving, loading, saves, error }
}
