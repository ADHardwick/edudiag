'use client'
import { useState } from 'react'

interface Props {
  value: string[]
  onChange: (emails: string[]) => void
}

export function EmailRecipientsInput({ value, onChange }: Props) {
  const [input, setInput] = useState('')

  function add() {
    const email = input.trim().toLowerCase()
    if (!email || !email.includes('@') || value.includes(email)) return
    onChange([...value, email])
    setInput('')
  }

  function remove(email: string) {
    onChange(value.filter((e) => e !== email))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="recipient@email.com"
          className="flex-1 border border-border rounded-md px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((email) => (
            <li key={email} className="flex items-center justify-between bg-surface rounded px-3 py-1 text-sm">
              <span>{email}</span>
              <button
                type="button"
                onClick={() => remove(email)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
