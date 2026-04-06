import { useState } from "react"

function formatPhoneInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11)

  if (!digits) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function ClientForm({ onAddClient }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [createAccount, setCreateAccount] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState({})

  function validateFields() {
    const newErrors = {}

    const cleanName = name.trim()
    const cleanPhone = String(phone || "").replace(/\D/g, "")

    if (!cleanName || cleanPhone.length < 10) {
      newErrors.general = "Preencha nome e WhatsApp para continuar."
      
      if (!cleanName) {
        newErrors.name = true
      }
      if (cleanPhone.length < 10) {
        newErrors.phone = true
      }
    }

    if (createAccount && Object.keys(newErrors).length === 0) {
      const cleanEmail = email.trim().toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!cleanEmail || !emailRegex.test(cleanEmail) || !password || password.length < 6) {
        newErrors.general = "Preencha e-mail e senha para criar o acesso à conta."

        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
          newErrors.email = true
        }
        if (!password || password.length < 6) {
          newErrors.password = true
        }
      }
    }

    setErrors(newErrors)
    return !newErrors.general
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!validateFields()) {
      return
    }

    const clientData = {
      name: name.trim(),
      phone: phone.replace(/\D/g, ""),
      email: createAccount ? email.trim().toLowerCase() : "",
      password: createAccount ? password : "",
    }

    onAddClient(clientData)

    setName("")
    setPhone("")
    setEmail("")
    setPassword("")
    setCreateAccount(false)
    setErrors({})
  }

  function handlePhoneChange(e) {
    setPhone(formatPhoneInput(e.target.value))
    if (errors.phone) {
      setErrors({ ...errors, phone: "" })
    }
  }

  function handleNameChange(e) {
    setName(e.target.value)
    if (errors.name) {
      setErrors({ ...errors, name: "" })
    }
  }

  function handleEmailChange(e) {
    setEmail(e.target.value)
    if (errors.email) {
      setErrors({ ...errors, email: "" })
    }
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value)
    if (errors.password) {
      setErrors({ ...errors, password: "" })
    }
  }

  return (
    <section className="rounded-2xl border border-[#D8D0E8] bg-white p-6 shadow-sm md:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B6B6B]">Ação rápida</p>
          <h2 className="text-xl font-bold text-[#2B2B2B] sm:text-2xl">Novo cliente</h2>
        </div>
        <span className="rounded-full bg-[#E8D8C3] px-3 py-1 text-sm text-[#6B4E2E]">
          Cadastro e fidelidade
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-xl border border-red-400/50 bg-red-500/10 p-3">
            <p className="text-sm text-red-300">{errors.general}</p>
          </div>
        )}

        <div className="rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
            Dados do cliente
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
              Nome completo
            </label>
            <input
              type="text"
              placeholder="Ex.: Juliana Nogueira"
              value={name}
              onChange={handleNameChange}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-[#2B2B2B] outline-none transition placeholder:text-[#9A948D] focus:shadow-[0_0_0_4px_rgba(91,42,134,0.10)] ${
                errors.name ? "border-red-300 focus:border-red-400" : "border-[#E8D8C3] focus:border-[#4B1E6D]"
              }`}
            />
          </div>

          <div className="mt-3 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
              WhatsApp
            </label>
            <input
              type="text"
              placeholder="(11) 90000-0000"
              value={phone}
              onChange={handlePhoneChange}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-[#2B2B2B] outline-none transition placeholder:text-[#9A948D] focus:shadow-[0_0_0_4px_rgba(91,42,134,0.10)] ${
                errors.phone ? "border-red-300 focus:border-red-400" : "border-[#E8D8C3] focus:border-[#4B1E6D]"
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] p-4">
          <button
            type="button"
            onClick={() => {
              setCreateAccount(!createAccount)
              setErrors({})
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              createAccount ? "bg-[#5B2A86]" : "bg-[#D8CFC4]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                createAccount ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
            Criar acesso à conta agora
          </label>
        </div>

        {createAccount && (
          <div className="rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
              Dados de acesso
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
                E-mail
              </label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={email}
                onChange={handleEmailChange}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-[#2B2B2B] outline-none transition placeholder:text-[#9A948D] focus:shadow-[0_0_0_4px_rgba(91,42,134,0.10)] ${
                  errors.email ? "border-red-300 focus:border-red-400" : "border-[#E8D8C3] focus:border-[#4B1E6D]"
                }`}
              />
            </div>

            <div className="mt-3 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
                Senha
              </label>
              <input
                type="password"
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-[#2B2B2B] outline-none transition placeholder:text-[#9A948D] focus:shadow-[0_0_0_4px_rgba(91,42,134,0.10)] ${
                  errors.password ? "border-red-300 focus:border-red-400" : "border-[#E8D8C3] focus:border-[#4B1E6D]"
                }`}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-2xl bg-[#5B2A86] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#6D3EA2] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createAccount ? "Cadastrar cliente com acesso" : "Cadastrar cliente"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-500">
        {createAccount
          ? "Cliente cadastrado com acesso à conta pelo e-mail e senha informados."
          : "Cliente cadastrado já aparece na busca e pode ter acesso adicionado depois."}
      </p>
    </section>
  )
}

export default ClientForm