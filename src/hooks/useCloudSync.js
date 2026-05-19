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

  const saveReport = useCallback(async (data, name) => {
    setSaving(true)
    setError(null)
    try {
      const owner = await getOwnerFilter()
      const { error: err } = await supabase
        .from('reports')
        .insert({
          ...owner,
          name: name || data.companyName || 'ESG Report',
          data,
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

  const updateReport = useCallback(async (id, data, name) => {
    setSaving(true)
    setError(null)
    try {
      const owner = await getOwnerFilter()
      const filter = Object.entries(owner)[0]
      const { error: err } = await supabase
        .from('reports')
        .update({ name: name || data.companyName || 'ESG Report', data, updated_at: new Date().toISOString() })
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

  const loadReport = useCallback(async (id) => {
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
      return data.data
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
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

  return { saveReport, updateReport, listSaves, loadReport, deleteSave, saving, loading, saves, error }
}
