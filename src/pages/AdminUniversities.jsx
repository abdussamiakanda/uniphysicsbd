import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'

function slugFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function AdminUniversities() {
  const [universities, setUniversities] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUni, setEditingUni] = useState(null)
  const [uniName, setUniName] = useState('')
  const [uniSlug, setUniSlug] = useState('')
  const [uniAcronym, setUniAcronym] = useState('')
  const [uniUrl, setUniUrl] = useState('')
  const [uniLogoUrl, setUniLogoUrl] = useState('')
  const [uniFounded, setUniFounded] = useState('')
  const [uniLocation, setUniLocation] = useState('')
  const [uniDivision, setUniDivision] = useState('')
  const [uniType, setUniType] = useState('')
  const [uniDescription, setUniDescription] = useState('')
  const [savingUni, setSavingUni] = useState(false)
  const [uniError, setUniError] = useState('')

  useEffect(() => {
    loadUniversities()
  }, [])

  async function loadUniversities() {
    const { data } = await supabase
      .from('universities')
      .select('id, name, slug, acronym, url, logo_url, founded, location, division, type, description')
      .order('name')
    setUniversities(data || [])
  }

  function openAddModal() {
    setEditingUni(null)
    setUniName('')
    setUniSlug('')
    setUniAcronym('')
    setUniUrl('')
    setUniLogoUrl('')
    setUniFounded('')
    setUniLocation('')
    setUniDivision('')
    setUniType('')
    setUniDescription('')
    setUniError('')
    setModalOpen(true)
  }

  function openEditModal(u) {
    setEditingUni(u)
    setUniName(u.name)
    setUniSlug(u.slug || '')
    setUniAcronym(u.acronym || '')
    setUniUrl(u.url || '')
    setUniLogoUrl(u.logo_url || '')
    setUniFounded(u.founded != null ? String(u.founded) : '')
    setUniLocation(u.location || '')
    setUniDivision(u.division || '')
    setUniType(u.type || '')
    setUniDescription(u.description || '')
    setUniError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingUni(null)
    setUniError('')
  }

  async function saveUniversity(e) {
    e.preventDefault()
    setUniError('')
    setSavingUni(true)
    const name = uniName.trim()
    const slug = uniSlug.trim() || slugFromName(name)
    if (!name) {
      setUniError('Name is required.')
      setSavingUni(false)
      return
    }
    const acronym = uniAcronym.trim() || null
    const url = uniUrl.trim() || null
    const logo_url = uniLogoUrl.trim() || null
    const founded = uniFounded.trim() ? parseInt(uniFounded.trim(), 10) : null
    const location = uniLocation.trim() || null
    const division = uniDivision.trim() || null
    const type = uniType.trim() || null
    const description = uniDescription.trim() || null
    const payload = { name, slug, acronym, url, logo_url, founded, location, division, type, description }
    if (editingUni) {
      const { error } = await supabase.from('universities').update(payload).eq('id', editingUni.id)
      if (error) {
        setUniError(error.message)
        setSavingUni(false)
        return
      }
    } else {
      const { error } = await supabase.from('universities').insert(payload)
      if (error) {
        setUniError(error.message)
        setSavingUni(false)
        return
      }
    }
    await loadUniversities()
    setSavingUni(false)
    closeModal()
  }

  async function deleteUniversity(uni) {
    if (!confirm(`Delete "${uni.name}"? This will fail if any teams use this university.`)) return
    const { error } = await supabase.from('universities').delete().eq('id', uni.id)
    if (error) {
      if (error.code === '23503') alert('Cannot delete: this university has teams. Remove or reassign teams first.')
      else alert(error.message)
      return
    }
    await loadUniversities()
    if (editingUni?.id === uni.id) closeModal()
  }

  return (
    <>
      <div className="admin-card">
        <h2>Universities</h2>
        <p className="admin-card-description">
          Pre-entered list. Use these when adding teams to avoid typos. Each university has a dedicated page.
        </p>
        <div className="admin-actions" style={{ borderTop: 'none', paddingTop: 0, marginBottom: '1rem' }}>
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            Add university
          </button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug (URL)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {universities.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td><code>{u.slug}</code></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEditModal(u)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteUniversity(u)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={editingUni ? `Edit ${editingUni.name}` : 'Add university'}
        open={modalOpen}
        onClose={closeModal}
      >
        <form className="admin-form" onSubmit={saveUniversity}>
          {uniError && (
            <p className="error" style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px', fontSize: '0.875rem' }}>
              {uniError}
            </p>
          )}
          <label>University name</label>
          <input
            value={uniName}
            onChange={(e) => {
              setUniName(e.target.value)
              if (!editingUni) setUniSlug(slugFromName(e.target.value))
            }}
            placeholder="e.g. Rajshahi University of Engineering and Technology"
            required
          />
          <label>Slug (URL: /university/slug)</label>
          <input value={uniSlug} onChange={(e) => setUniSlug(e.target.value)} placeholder="e.g. ruet" />
          <label>Acronym</label>
          <input value={uniAcronym} onChange={(e) => setUniAcronym(e.target.value)} placeholder="e.g. RUET" />
          <label>Type</label>
          <select value={uniType} onChange={(e) => setUniType(e.target.value)}>
            <option value="">—</option>
            <option value="Public">Public</option>
            <option value="Private">Private</option>
            <option value="International">International</option>
          </select>
          <label>Website URL</label>
          <input type="url" value={uniUrl} onChange={(e) => setUniUrl(e.target.value)} placeholder="https://www.ruet.ac.bd/" />
          <label>Logo URL</label>
          <input type="url" value={uniLogoUrl} onChange={(e) => setUniLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
          <label>Founded (year)</label>
          <input type="number" min="1900" max="2030" value={uniFounded} onChange={(e) => setUniFounded(e.target.value)} placeholder="e.g. 2003" />
          <label>Location</label>
          <input value={uniLocation} onChange={(e) => setUniLocation(e.target.value)} placeholder="e.g. Motihar, Rajshahi" />
          <label>Division</label>
          <input value={uniDivision} onChange={(e) => setUniDivision(e.target.value)} placeholder="e.g. Rajshahi Division" />
          <label>Description</label>
          <textarea value={uniDescription} onChange={(e) => setUniDescription(e.target.value)} placeholder="Short description or about the university" rows={3} />
          <div className="admin-actions">
            <button type="submit" className="btn btn-primary" disabled={savingUni}>
              {savingUni ? 'Saving…' : editingUni ? 'Update' : 'Add university'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
