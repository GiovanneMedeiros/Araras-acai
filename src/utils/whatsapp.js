function formatMoneyBRL(value) {
  const numericValue = Number(value || 0)
  return numericValue.toFixed(2).replace(".", ",")
}

const EMOJI_ACAI = String.fromCodePoint(0x1F367)
const EMOJI_TROPHY = String.fromCodePoint(0x1F3C6)
const EMOJI_ROCKET = String.fromCodePoint(0x1F680)

function encodeUtf8ForUrl(value) {
  const input = String(value || "")
  const bytes = new TextEncoder().encode(input)
  let encoded = ""

  for (const byte of bytes) {
    encoded += `%${byte.toString(16).toUpperCase().padStart(2, "0")}`
  }

  return encoded
}

function normalizeTextValue(value, fallback = "Nenhum") {
  const text = String(value || "").trim()
  return text || fallback
}

function normalizeAddons(addons) {
  if (Array.isArray(addons)) {
    const labels = addons
      .map((item) => {
        if (typeof item === "string") return item.trim()
        if (item && typeof item === "object") {
          return String(item.label || item.name || "").trim()
        }
        return ""
      })
      .filter(Boolean)

    return labels.length ? labels.join(", ") : "Nenhum"
  }

  return normalizeTextValue(addons)
}

export function generateWhatsAppMessage({
  nome,
  telefone,
  recompensa,
  pontos,
  totalResgates,
  complementos,
  valorAdicionais,
}) {
  const safeNome = normalizeTextValue(nome, "Cliente")
  const safeTelefone = normalizeTextValue(telefone, "Não informado")
  const safeRecompensa = normalizeTextValue(recompensa, "Recompensa")
  const safePontos = Number.isFinite(Number(pontos)) ? Number(pontos) : 0
  const safeTotalResgates = Number.isFinite(Number(totalResgates)) ? Number(totalResgates) : 0
  const safeComplementos = normalizeAddons(complementos)
  const safeValorAdicionais = formatMoneyBRL(valorAdicionais)

  const message = `Olá, Arara's Açaí ${EMOJI_ACAI}
Quero resgatar minha recompensa do clube! ${EMOJI_TROPHY}

*Cliente:* *_${safeNome}_*
*Telefone:* ${safeTelefone}

*Recompensa:* ${safeRecompensa}
*Pontos usados:* ${safePontos}

*Quantidade de resgates:* ${safeTotalResgates}

*Complementos:* ${safeComplementos}
*Valor dos adicionais:* R$ ${safeValorAdicionais}

Podem confirmar meu pedido para delivery, por favor? ${EMOJI_ROCKET}`

  return message
}

export function generateWhatsAppLink({ numeroLoja, mensagem }) {
  const storeDigits = String(numeroLoja || "").replace(/\D/g, "")
  const localStoreDigits = storeDigits.startsWith("55") ? storeDigits.slice(2) : storeDigits
  const messageText = String(mensagem || "")
  const mensagemCodificada = encodeUtf8ForUrl(messageText)
  return `https://api.whatsapp.com/send?phone=55${localStoreDigits}&text=${mensagemCodificada}`
}
