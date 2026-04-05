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
    <section className="rounded-3xl border border-white/15 bg-slate-950/35 p-5 shadow-xl backdrop-blur-xl md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/80">Ação rápida</p>
          <h2 className="text-xl font-bold sm:text-2xl">Novo cliente</h2>
        </div>
        <span className="rounded-full border border-emerald-200/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100">
          Cadastro e fidelidade
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-xl border border-red-400/50 bg-red-500/10 p-3">
            <p className="text-sm text-red-300">{errors.general}</p>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
            Dados do cliente
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
              Nome completo
            </label>
            <input
              type="text"
              placeholder="Ex.: Juliana Nogueira"
              value={name}
              onChange={handleNameChange}
              className={`w-full rounded-2xl border bg-white/95 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_4px_rgba(167,139,250,0.2)] ${
                errors.name ? "border-red-400 focus:border-red-500" : "border-white/20 focus:border-violet-500"
              }`}
            />
          </div>

          <div className="mt-3 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
              WhatsApp
            </label>
            <input
              type="text"
              placeholder="(11) 90000-0000"
              value={phone}
              onChange={handlePhoneChange}
              className={`w-full rounded-2xl border bg-white/95 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_4px_rgba(167,139,250,0.2)] ${
                errors.phone ? "border-red-400 focus:border-red-500" : "border-white/20 focus:border-violet-500"
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <button
            type="button"
            onClick={() => {
              setCreateAccount(!createAccount)
              setErrors({})
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              createAccount ? "bg-emerald-500" : "bg-gray-400"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                createAccount ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
            Criar acesso à conta agora
          </label>
        </div>

        {createAccount && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
              Dados de acesso
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                E-mail
              </label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={email}
                onChange={handleEmailChange}
                className={`w-full rounded-2xl border bg-white/95 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_4px_rgba(167,139,250,0.2)] ${
                  errors.email ? "border-red-400 focus:border-red-500" : "border-white/20 focus:border-violet-500"
                }`}
              />
            </div>

            <div className="mt-3 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                Senha
              </label>
              <input
                type="password"
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full rounded-2xl border bg-white/95 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_4px_rgba(167,139,250,0.2)] ${
                  errors.password ? "border-red-400 focus:border-red-500" : "border-white/20 focus:border-violet-500"
                }`}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-6 py-3 font-semibold text-slate-950 shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createAccount ? "Cadastrar cliente com acesso" : "Cadastrar cliente"}
        </button>
      </form>

      <p className="mt-4 text-sm text-white/75">
        {createAccount
          ? "Cliente cadastrado com acesso à conta pelo e-mail e senha informados."
          : "Cliente cadastrado já aparece na busca e pode ter acesso adicionado depois."}
      </p>
    </section>
  )
}

export default ClientForm