import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'

// ─── Helpers ────────────────────────────────────────────────────────────────

const THEME_COLORS = {
  'Neurologie':    { tag: 'neuro',   label: '🧠', bg: 'var(--neuro-bg)',  accent: 'var(--neuro)',       light: 'var(--neuro-light)' },
  'Traumatologie': { tag: 'trauma',  label: '🦴', bg: 'var(--trauma-bg)', accent: 'var(--trauma)',      light: 'var(--trauma-light)' },
  'Rhumatologie':  { tag: 'rhuma',   label: '🫀', bg: 'var(--rhuma-bg)',  accent: 'var(--rhuma)',       light: 'var(--rhuma-light)' },
}

function getThemeStyle(themeName) {
  return THEME_COLORS[themeName] || { tag: 'accent', label: '📋', bg: 'var(--accent-bg)', accent: 'var(--accent)', light: 'var(--accent-light)' }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Components ─────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1.5rem'
    }}>
      <div style={{ fontSize: '3rem' }}>🩺</div>
      <div style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--text-muted)' }}>
        Chargement des flashcards…
      </div>
      <div style={{
        width: 48, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', background: 'var(--accent-light)', borderRadius: 2,
          animation: 'slide 1.2s ease-in-out infinite',
          width: '40%'
        }} />
      </div>
      <style>{`@keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }`}</style>
    </div>
  )
}

function Header({ onHome }) {
  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0.5rem 1rem',
      minHeight: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
      gap: '0.5rem'
    }}>
      <button onClick={onHome} style={{
        background: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
        fontSize: '1rem', fontWeight: 700, color: 'var(--accent)',
        letterSpacing: '-0.01em', flexShrink: 0
      }}>
        <img src="/logo.png" alt="KineLearn" style={{ height: 28, width: 28, objectFit: 'contain' }} />
        KineLearn
      </button>
      <div style={{
        flex: 1, minWidth: 0, textAlign: 'center',
        fontFamily: 'Lora, serif', fontStyle: 'italic',
        fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400,
        lineHeight: 1.3, overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
      }}>
        "Une carte par jour, le savoir pour toujours"
      </div>
      <div style={{
        fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500,
        textAlign: 'center', lineHeight: 1.3, flexShrink: 0, maxWidth: 72,
        overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
      }}>
        Flashcards cycle 2 IFMK Reims
      </div>
    </header>
  )
}

function ThemeCard({ theme, subthemes, onStudy, onAddSubtheme, onAddCard }) {
  const style = getThemeStyle(theme.name)
  const [expanded, setExpanded] = useState(false)
  const totalCards = subthemes.reduce((acc, s) => acc + (s.flashcards?.length || 0), 0)

  return (
    <div className="animate-fade" style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Header band */}
      <div style={{
        background: style.bg, borderBottom: '1px solid var(--border)',
        padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>{style.label}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: style.accent }}>{theme.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {subthemes.length} sous-thème{subthemes.length !== 1 ? 's' : ''} · {totalCards} carte{totalCards !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <button
          onClick={() => onStudy({ type: 'theme', theme })}
          disabled={totalCards === 0}
          style={{
            background: totalCards > 0 ? style.accent : 'var(--border)',
            color: totalCards > 0 ? 'white' : 'var(--text-muted)',
            padding: '0.5rem 1rem', borderRadius: 8,
            fontWeight: 600, fontSize: '0.85rem',
            cursor: totalCards > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Réviser tout
        </button>
      </div>

      {/* Subthemes */}
      <div style={{ padding: '0.5rem 0' }}>
        {subthemes.map(sub => (
          <div key={sub.id} style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto',
            alignItems: 'center',
            padding: '0.6rem 1rem',
            gap: '0.5rem',
            borderBottom: '1px solid var(--bg2)'
          }}>
            <span style={{
              fontWeight: 500, fontSize: '0.9rem', color: 'var(--text)',
              minWidth: 0, wordBreak: 'break-word'
            }}>
              {sub.name}
            </span>
            <span style={{
              fontSize: '0.72rem', color: 'var(--text-muted)',
              background: 'var(--bg2)', padding: '2px 6px', borderRadius: 20,
              fontWeight: 600, textAlign: 'center', lineHeight: 1.3,
              whiteSpace: 'nowrap', minWidth: 48
            }}>
              {sub.flashcards?.length || 0}<br/>carte{(sub.flashcards?.length || 0) !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => onAddCard(sub)}
              style={{
                background: 'var(--bg2)', color: 'var(--text-muted)',
                padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
              title="Ajouter une carte"
            >+ carte</button>
            <button
              onClick={() => onStudy({ type: 'subtheme', subtheme: sub, theme })}
              disabled={(sub.flashcards?.length || 0) === 0}
              style={{
                background: (sub.flashcards?.length || 0) > 0 ? style.light : 'var(--border)',
                color: 'white', padding: '4px 10px', borderRadius: 6,
                fontSize: '0.8rem', fontWeight: 600,
                cursor: (sub.flashcards?.length || 0) > 0 ? 'pointer' : 'not-allowed',
                opacity: (sub.flashcards?.length || 0) === 0 ? 0.5 : 1,
                whiteSpace: 'nowrap'
              }}
            >Réviser</button>
          </div>
        ))}

        {/* Add subtheme */}
        <button
          onClick={() => onAddSubtheme(theme)}
          style={{
            width: '100%', padding: '0.7rem 1.5rem',
            background: 'none', color: 'var(--text-muted)',
            textAlign: 'left', fontSize: '0.85rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '1rem', color: 'var(--accent-light)' }}>＋</span>
          Ajouter un sous-thème
        </button>
      </div>
    </div>
  )
}

function FlashCard({ card, subthemeName, themeName, index, total, onSuccess, onFail, onEdit, onDelete }) {
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(false)
  const style = getThemeStyle(themeName)

  function handleFlip() {
    if (!answered) setFlipped(f => !f)
  }

  function handleAnswer(success) {
    setAnswered(true)
    setTimeout(() => {
      setFlipped(false)
      setAnswered(false)
      if (success) onSuccess()
      else onFail()
    }, 400)
  }

  return (
    <div className="animate-fade" style={{ width: '100%', maxWidth: 560, margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500
        }}>
          <span style={{ background: style.bg, color: style.accent, padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
            {style.label} {subthemeName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Carte {index + 1} / {total}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              title="Modifier cette carte"
              style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem',
                color: 'var(--accent)', cursor: 'pointer', fontWeight: 600
              }}
            >✏️</button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              title="Supprimer cette carte"
              style={{
                background: 'var(--danger-bg)', border: '1px solid var(--danger)',
                borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem',
                color: 'var(--danger)', cursor: 'pointer', fontWeight: 600
              }}
            >🗑️</button>
          </div>
        </div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: `linear-gradient(90deg, ${style.light}, ${style.accent})`,
            width: `${((index + 1) / total) * 100}%`,
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Card */}
      <div
        className="flip-card-scene"
        style={{ height: 300, cursor: answered ? 'default' : 'pointer' }}
        onClick={handleFlip}
      >
        <div className={`flip-card-inner${flipped ? ' flipped' : ''}`}>
          {/* Front */}
          <div className="flip-card-face" style={{
            background: 'var(--surface)', border: `2px solid ${style.light}`,
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: style.light, marginBottom: '1rem'
            }}>Question</div>
            <div style={{
              fontFamily: 'Lora, serif', fontSize: '1.15rem', fontWeight: 600,
              lineHeight: 1.6, color: 'var(--text)'
            }}>{card.question}</div>
            <div style={{
              marginTop: 'auto', paddingTop: '1.5rem',
              fontSize: '0.78rem', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <span>🔄</span> Cliquer pour retourner
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-face back" style={{
            background: style.bg, border: `2px solid ${style.accent}`,
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: style.accent, marginBottom: '1rem'
            }}>Réponse</div>
            <div style={{
              fontFamily: 'Lora, serif', fontSize: '1.05rem', lineHeight: 1.65,
              color: 'var(--text)'
            }}>{card.answer}</div>
          </div>
        </div>
      </div>

      {/* Answer buttons — shown only when flipped */}
      <div style={{
        display: 'flex', gap: '1rem', marginTop: '1.25rem',
        opacity: flipped && !answered ? 1 : 0,
        pointerEvents: flipped && !answered ? 'auto' : 'none',
        transition: 'opacity 0.25s'
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); handleAnswer(false) }}
          style={{
            flex: 1, padding: '0.85rem', borderRadius: 'var(--radius)',
            background: 'var(--danger-bg)', color: 'var(--danger)',
            fontWeight: 700, fontSize: '0.95rem', border: '2px solid var(--danger)'
          }}
        >
          ✗ À revoir
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleAnswer(true) }}
          style={{
            flex: 1, padding: '0.85rem', borderRadius: 'var(--radius)',
            background: 'var(--accent-bg)', color: 'var(--accent)',
            fontWeight: 700, fontSize: '0.95rem', border: '2px solid var(--accent)'
          }}
        >
          ✓ Connu
        </button>
      </div>
    </div>
  )
}

function ScoreScreen({ score, total, onRestart, onHome }) {
  const pct = Math.round((score / total) * 100)
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : pct >= 40 ? '💪' : '📚'
  const msg = pct >= 80 ? 'Excellent travail !' : pct >= 60 ? 'Bon résultat !' : pct >= 40 ? 'Continuez vos efforts !' : 'Il faut réviser encore !'

  return (
    <div className="animate-fade" style={{
      maxWidth: 400, margin: '4rem auto', textAlign: 'center', padding: '0 1rem'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{emoji}</div>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        padding: '2.5rem 2rem', boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Score final
        </div>
        <div style={{
          fontSize: '4rem', fontWeight: 800, lineHeight: 1,
          color: pct >= 60 ? 'var(--accent)' : 'var(--danger)',
          marginBottom: '0.25rem'
        }}>
          {pct}%
        </div>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {score} / {total} carte{total !== 1 ? 's' : ''} correctes
        </div>

        {/* Visual bar */}
        <div style={{ height: 8, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: pct >= 60 ? 'linear-gradient(90deg, var(--accent-light), var(--accent))' : 'linear-gradient(90deg, #e74c3c, var(--danger))',
            width: `${pct}%`, transition: 'width 0.8s ease'
          }} />
        </div>

        <div style={{
          fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)',
          marginBottom: '2rem', fontFamily: 'Lora, serif', fontStyle: 'italic'
        }}>
          {msg}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onRestart}
            style={{
              flex: 1, padding: '0.85rem', borderRadius: 'var(--radius)',
              background: 'var(--accent)', color: 'white', fontWeight: 700, fontSize: '0.95rem'
            }}
          >🔁 Recommencer</button>
          <button
            onClick={onHome}
            style={{
              flex: 1, padding: '0.85rem', borderRadius: 'var(--radius)',
              background: 'var(--bg2)', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem'
            }}
          >🏠 Accueil</button>
        </div>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }} onClick={onClose}>
      <div
        className="animate-fade"
        style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          padding: '2rem', width: '100%', maxWidth: 480,
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'var(--bg2)', color: 'var(--text-muted)',
            width: 32, height: 32, borderRadius: '50%', fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, multiline }) {
  const style = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1.5px solid var(--border)', borderRadius: 8,
    fontSize: '0.95rem', color: 'var(--text)',
    background: 'var(--bg)', outline: 'none',
    transition: 'border-color 0.2s',
    resize: multiline ? 'vertical' : 'none',
    fontFamily: 'Outfit, sans-serif',
    lineHeight: 1.5
  }
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>{label}</label>}
      {multiline
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style}
            onFocus={e => e.target.style.borderColor = 'var(--accent-light)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style}
            onFocus={e => e.target.style.borderColor = 'var(--accent-light)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
      }
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [loading, setLoading] = useState(true)
  const [themes, setThemes] = useState([])
  const [subthemes, setSubthemes] = useState([])
  const [flashcards, setFlashcards] = useState([])
  const [screen, setScreen] = useState('home') // home | study | score

  // Modals
  const [modal, setModal] = useState(null)
  const [modalTarget, setModalTarget] = useState(null)
  const [editCard, setEditCard] = useState(null)
  const [deleteCard, setDeleteCard] = useState(null)

  // Form state
  const [formTheme, setFormTheme] = useState('')
  const [formSubtheme, setFormSubtheme] = useState('')
  const [formQ, setFormQ] = useState('')
  const [formA, setFormA] = useState('')
  const [formSubthemeId, setFormSubthemeId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Study state
  const [deck, setDeck] = useState([])
  const [cardIndex, setCardIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [studyContext, setStudyContext] = useState(null)

  // ── Load data ──
  const loadData = useCallback(async () => {
    const [{ data: t }, { data: s }, { data: f }] = await Promise.all([
      supabase.from('themes').select('*').order('name'),
      supabase.from('subthemes').select('*').order('name'),
      supabase.from('flashcards').select('*'),
    ])
    setThemes(t || [])
    setSubthemes(s || [])
    setFlashcards(f || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Realtime subscription
  useEffect(() => {
    const sub = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => loadData())
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [loadData])

  // ── Computed structure ──
  const enrichedThemes = themes.map(t => ({
    ...t,
    subthemes: subthemes
      .filter(s => s.theme_id === t.id)
      .map(s => ({ ...s, flashcards: flashcards.filter(f => f.subtheme_id === s.id) }))
  }))

  // ── Study logic ──
  function startStudy(context) {
    let cards = []
    if (context.type === 'all') {
      cards = shuffle(flashcards)
    } else if (context.type === 'theme') {
      const subs = subthemes.filter(s => s.theme_id === context.theme.id)
      cards = shuffle(flashcards.filter(f => subs.some(s => s.id === f.subtheme_id)))
    } else if (context.type === 'subtheme') {
      cards = shuffle(flashcards.filter(f => f.subtheme_id === context.subtheme.id))
    }
    if (cards.length === 0) return

    // Enrich cards with subtheme + theme name
    const enriched = cards.map(c => {
      const sub = subthemes.find(s => s.id === c.subtheme_id)
      const th = themes.find(t => t.id === sub?.theme_id)
      return { ...c, subthemeName: sub?.name || '', themeName: th?.name || '' }
    })
    setDeck(enriched)
    setCardIndex(0)
    setScore(0)
    setStudyContext(context)
    setScreen('study')
  }

  function handleSuccess() {
    const newScore = score + 1
    setScore(newScore)
    if (cardIndex + 1 >= deck.length) {
      setScore(newScore)
      setTimeout(() => setScreen('score'), 300)
    } else setCardIndex(i => i + 1)
  }

  function handleFail() {
    if (cardIndex + 1 >= deck.length) {
      setTimeout(() => setScreen('score'), 300)
    } else setCardIndex(i => i + 1)
  }

  // ── Save functions ──
  async function saveTheme() {
    if (!formTheme.trim()) return
    setSaving(true); setError('')
    const { error: e } = await supabase.from('themes').insert({ name: formTheme.trim() })
    setSaving(false)
    if (e) { setError(e.message); return }
    setFormTheme(''); setModal(null)
    loadData()
  }

  async function saveSubtheme() {
    if (!formSubtheme.trim() || !modalTarget?.id) return
    setSaving(true); setError('')
    const { error: e } = await supabase.from('subthemes').insert({ name: formSubtheme.trim(), theme_id: modalTarget.id })
    setSaving(false)
    if (e) { setError(e.message); return }
    setFormSubtheme(''); setModal(null)
    loadData()
  }

  async function saveCard() {
    const subId = modalTarget?.id || formSubthemeId
    if (!formQ.trim() || !formA.trim() || !subId) return
    setSaving(true); setError('')
    const { error: e } = await supabase.from('flashcards').insert({
      subtheme_id: subId, question: formQ.trim(), answer: formA.trim()
    })
    setSaving(false)
    if (e) { setError(e.message); return }
    setFormQ(''); setFormA(''); setFormSubthemeId(''); setModal(null)
    loadData()
  }

  function openAddCard(subtheme) {
    setModalTarget(subtheme)
    setFormQ(''); setFormA('')
    setModal('card')
  }

  function openAddSubtheme(theme) {
    setModalTarget(theme)
    setFormSubtheme('')
    setModal('subtheme')
  }

  function openEditCard(card) {
    setEditCard({ ...card })
    setFormQ(card.question)
    setFormA(card.answer)
    setError('')
    setModal('edit-card')
  }

  function openDeleteCard(card) {
    setDeleteCard(card)
    setModal('delete-card')
  }

  async function saveEditCard() {
    if (!formQ.trim() || !formA.trim() || !editCard?.id) return
    setSaving(true); setError('')
    const { error: e } = await supabase
      .from('flashcards')
      .update({ question: formQ.trim(), answer: formA.trim() })
      .eq('id', editCard.id)
    setSaving(false)
    if (e) { setError(e.message); return }
    // Update the current deck card in memory too
    setDeck(prev => prev.map(c => c.id === editCard.id
      ? { ...c, question: formQ.trim(), answer: formA.trim() }
      : c
    ))
    setEditCard(null); setFormQ(''); setFormA(''); setModal(null)
    loadData()
  }

  async function confirmDeleteCard() {
    if (!deleteCard?.id) return
    setSaving(true)
    await supabase.from('flashcards').delete().eq('id', deleteCard.id)
    setSaving(false)
    // If deleted card is current card, skip to next
    if (deck[cardIndex]?.id === deleteCard.id) {
      if (deck.length <= 1) {
        setScreen('home')
      } else if (cardIndex >= deck.length - 1) {
        setDeck(prev => prev.filter(c => c.id !== deleteCard.id))
        setCardIndex(i => Math.max(0, i - 1))
      } else {
        setDeck(prev => prev.filter(c => c.id !== deleteCard.id))
      }
    } else {
      setDeck(prev => prev.filter(c => c.id !== deleteCard.id))
    }
    setDeleteCard(null); setModal(null)
    loadData()
  }

  // ── Render ──
  if (loading) return <LoadingScreen />

  const totalCards = flashcards.length

  return (
    <>
      <Header onHome={() => setScreen('home')} />

      <main style={{ padding: '2rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>

        {/* ── HOME SCREEN ── */}
        {screen === 'home' && (
          <>
            {/* Hero */}
            <div className="hero-block animate-fade" style={{
              background: 'linear-gradient(135deg, #1a4a7a 0%, #0d2d4f 100%)',
              borderRadius: 'var(--radius-lg)', padding: '2.5rem',
              color: 'white', marginBottom: '2.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '1.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.75, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Base partagée en temps réel
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.5rem' }}>
                  Révisez vos<br/>connaissances kiné
                </h1>
                <div style={{
                  fontFamily: 'Lora, serif', fontStyle: 'italic',
                  fontSize: '1rem', opacity: 0.9, marginBottom: '0.5rem'
                }}>
                  "Une carte par jour, le savoir pour toujours"
                </div>
                <div style={{ opacity: 0.75, fontSize: '0.9rem' }}>
                  {totalCards} cartes · {themes.length} thèmes
                </div>
              </div>
              <button
                onClick={() => startStudy({ type: 'all' })}
                disabled={totalCards === 0}
                className="hero-btn"
                style={{
                  background: 'white', color: 'var(--accent)',
                  padding: '1rem 2rem', borderRadius: 'var(--radius)',
                  fontWeight: 800, fontSize: '1.05rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  opacity: totalCards === 0 ? 0.5 : 1,
                  cursor: totalCards === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                🎲 Révision globale aléatoire
              </button>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap'
            }}>
              <button
                onClick={() => { setFormTheme(''); setError(''); setModal('theme') }}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: 8,
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <span style={{ color: 'var(--accent-light)', fontSize: '1.1rem' }}>＋</span>
                Nouveau thème
              </button>
              <button
                onClick={() => { setFormQ(''); setFormA(''); setFormSubthemeId(''); setError(''); setModalTarget(null); setModal('card-global') }}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: 8,
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <span style={{ color: 'var(--accent-light)', fontSize: '1.1rem' }}>＋</span>
                Nouvelle carte
              </button>
            </div>

            {/* Theme grid */}
            <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {enrichedThemes.map(t => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  subthemes={t.subthemes}
                  onStudy={startStudy}
                  onAddSubtheme={openAddSubtheme}
                  onAddCard={openAddCard}
                />
              ))}
            </div>
          </>
        )}

        {/* ── STUDY SCREEN ── */}
        {screen === 'study' && deck.length > 0 && cardIndex < deck.length && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <button
                onClick={() => setScreen('home')}
                style={{
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >← Quitter</button>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {studyContext?.type === 'all' && 'Révision globale'}
                {studyContext?.type === 'theme' && `Thème : ${studyContext.theme.name}`}
                {studyContext?.type === 'subtheme' && `${studyContext.theme.name} › ${studyContext.subtheme.name}`}
              </div>
            </div>
            <FlashCard
              card={deck[cardIndex]}
              subthemeName={deck[cardIndex].subthemeName}
              themeName={deck[cardIndex].themeName}
              index={cardIndex}
              total={deck.length}
              onSuccess={handleSuccess}
              onFail={handleFail}
              onEdit={() => openEditCard(deck[cardIndex])}
              onDelete={() => openDeleteCard(deck[cardIndex])}
            />
          </div>
        )}

        {/* ── SCORE SCREEN ── */}
        {screen === 'score' && (
          <ScoreScreen
            score={score}
            total={deck.length}
            onRestart={() => startStudy(studyContext)}
            onHome={() => setScreen('home')}
          />
        )}
      </main>

      {/* ── MODALS ── */}
      {modal === 'theme' && (
        <Modal title="Nouveau thème" onClose={() => setModal(null)}>
          <InputField label="Nom du thème" value={formTheme} onChange={setFormTheme} placeholder="Ex : Cardiologie" />
          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}
          <button
            onClick={saveTheme} disabled={saving || !formTheme.trim()}
            style={{
              width: '100%', padding: '0.85rem', borderRadius: 'var(--radius)',
              background: formTheme.trim() ? 'var(--accent)' : 'var(--border)',
              color: 'white', fontWeight: 700, fontSize: '0.95rem',
              cursor: formTheme.trim() ? 'pointer' : 'not-allowed'
            }}
          >{saving ? 'Enregistrement…' : 'Créer le thème'}</button>
        </Modal>
      )}

      {modal === 'subtheme' && modalTarget && (
        <Modal title={`Nouveau sous-thème — ${modalTarget.name}`} onClose={() => setModal(null)}>
          <InputField label="Nom du sous-thème" value={formSubtheme} onChange={setFormSubtheme} placeholder="Ex : Hémiplégie" />
          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}
          <button
            onClick={saveSubtheme} disabled={saving || !formSubtheme.trim()}
            style={{
              width: '100%', padding: '0.85rem', borderRadius: 'var(--radius)',
              background: formSubtheme.trim() ? 'var(--accent)' : 'var(--border)',
              color: 'white', fontWeight: 700, fontSize: '0.95rem',
              cursor: formSubtheme.trim() ? 'pointer' : 'not-allowed'
            }}
          >{saving ? 'Enregistrement…' : 'Créer le sous-thème'}</button>
        </Modal>
      )}

      {(modal === 'card' || modal === 'card-global') && (
        <Modal title="Nouvelle carte" onClose={() => setModal(null)}>
          {modal === 'card-global' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Sous-thème
              </label>
              <select
                value={formSubthemeId}
                onChange={e => setFormSubthemeId(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  border: '1.5px solid var(--border)', borderRadius: 8,
                  fontSize: '0.95rem', color: 'var(--text)',
                  background: 'var(--bg)', fontFamily: 'Outfit, sans-serif'
                }}
              >
                <option value="">— Choisir un sous-thème —</option>
                {enrichedThemes.map(t => (
                  <optgroup key={t.id} label={t.name}>
                    {t.subthemes.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
          {modal === 'card' && modalTarget && (
            <div style={{
              background: 'var(--bg2)', borderRadius: 8, padding: '0.6rem 1rem',
              marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)'
            }}>
              📁 {modalTarget.name}
            </div>
          )}
          <InputField label="Question" value={formQ} onChange={setFormQ} placeholder="Ex : Quels muscles sont atteints en premier ?" multiline />
          <InputField label="Réponse" value={formA} onChange={setFormA} placeholder="Répondez de façon complète et claire." multiline />
          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}
          <button
            onClick={saveCard}
            disabled={saving || !formQ.trim() || !formA.trim() || (modal === 'card-global' && !formSubthemeId)}
            style={{
              width: '100%', padding: '0.85rem', borderRadius: 'var(--radius)',
              background: (formQ.trim() && formA.trim() && (modal === 'card' || formSubthemeId)) ? 'var(--accent)' : 'var(--border)',
              color: 'white', fontWeight: 700, fontSize: '0.95rem',
              cursor: (formQ.trim() && formA.trim() && (modal === 'card' || formSubthemeId)) ? 'pointer' : 'not-allowed'
            }}
          >{saving ? 'Enregistrement…' : 'Créer la carte'}</button>
        </Modal>
      )}
      {modal === 'edit-card' && editCard && (
        <Modal title="Modifier la carte" onClose={() => setModal(null)}>
          <div style={{
            background: 'var(--bg2)', borderRadius: 8, padding: '0.6rem 1rem',
            marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500
          }}>
            ✏️ Modification en cours
          </div>
          <InputField label="Question" value={formQ} onChange={setFormQ} placeholder="Question…" multiline />
          <InputField label="Réponse" value={formA} onChange={setFormA} placeholder="Réponse…" multiline />
          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setModal(null)}
              style={{
                flex: 1, padding: '0.85rem', borderRadius: 'var(--radius)',
                background: 'var(--bg2)', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem'
              }}
            >Annuler</button>
            <button
              onClick={saveEditCard}
              disabled={saving || !formQ.trim() || !formA.trim()}
              style={{
                flex: 2, padding: '0.85rem', borderRadius: 'var(--radius)',
                background: (formQ.trim() && formA.trim()) ? 'var(--accent)' : 'var(--border)',
                color: 'white', fontWeight: 700, fontSize: '0.95rem',
                cursor: (formQ.trim() && formA.trim()) ? 'pointer' : 'not-allowed'
              }}
            >{saving ? 'Enregistrement…' : '✓ Enregistrer'}</button>
          </div>
        </Modal>
      )}

      {modal === 'delete-card' && deleteCard && (
        <Modal title="Supprimer la carte" onClose={() => setModal(null)}>
          <div style={{
            background: 'var(--danger-bg)', border: '1px solid var(--danger)',
            borderRadius: 8, padding: '1rem', marginBottom: '1.25rem'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              ⚠️ Êtes-vous sûr ?
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{deleteCard.question}"
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', textAlign: 'center' }}>
            Cette action est irréversible et visible par tous les utilisateurs.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setModal(null)}
              style={{
                flex: 1, padding: '0.85rem', borderRadius: 'var(--radius)',
                background: 'var(--bg2)', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem'
              }}
            >Annuler</button>
            <button
              onClick={confirmDeleteCard}
              disabled={saving}
              style={{
                flex: 1, padding: '0.85rem', borderRadius: 'var(--radius)',
                background: 'var(--danger)', color: 'white', fontWeight: 700, fontSize: '0.95rem'
              }}
            >{saving ? 'Suppression…' : '🗑️ Supprimer'}</button>
          </div>
        </Modal>
      )}
    </>
  )
}
