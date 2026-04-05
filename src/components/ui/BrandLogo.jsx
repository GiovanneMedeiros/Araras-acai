import logoAraras from "../../assets/logo-araras.png"

const SIZE_MAP = {
  sm: "h-12",
  md: "h-16",
  lg: "h-20",
}

function BrandLogo({ size = "md", className = "" }) {
  const heightClass = SIZE_MAP[size] || SIZE_MAP.md

  return (
    <img
      src={logoAraras}
      alt="Logo Arara's Acai"
      className={`${heightClass} w-auto max-w-none object-contain ${className}`}
      loading="eager"
      decoding="async"
    />
  )
}

export default BrandLogo
