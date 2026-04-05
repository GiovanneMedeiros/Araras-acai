function hasAny(text, terms) {
  return terms.some((term) => text.includes(term))
}

export function getUserFriendlyErrorMessage(error, fallback = "Não foi possível concluir a ação. Tente novamente.") {
  const raw = String(error?.message || "").trim()
  if (!raw) return fallback

  const message = raw.toLowerCase()

  if (hasAny(message, ["invalid login credentials", "credentials"])) {
    return "E-mail ou senha incorretos."
  }

  if (hasAny(message, ["email not confirmed", "not confirmed"])) {
    return "Confirme seu e-mail para continuar."
  }

  if (hasAny(message, ["already registered", "already exists", "already been registered"])) {
    return "Este e-mail já está em uso."
  }

  if (hasAny(message, ["expired", "jwt", "token", "session", "refresh token"])) {
    return "Sua sessão expirou. Entre novamente para continuar."
  }

  if (hasAny(message, ["failed to fetch", "network", "fetcherror", "networkrequestfailed"])) {
    return "Falha de conexão. Verifique sua internet e tente novamente."
  }

  if (hasAny(message, ["permission denied", "not authorized", "forbidden", "rls", "row level security"])) {
    return "Você não tem permissão para realizar esta ação."
  }

  if (hasAny(message, ["schema cache", "does not exist", "column", "relation", "postgres", "supabase"])) {
    return fallback
  }

  return raw
}
