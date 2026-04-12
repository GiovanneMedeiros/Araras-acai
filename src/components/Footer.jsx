import { Link } from "react-router-dom"

export default function Footer() {
  const sep = (
    <span className="hidden text-purple-400 lg:inline dark:text-zinc-500">•</span>
  )

  return (
    <footer className="relative z-10 w-full border-t border-purple-200 bg-purple-50 py-3 text-xs text-purple-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-y-1 px-4 lg:flex-row lg:flex-wrap lg:gap-x-3 lg:gap-y-0">

        <span className="font-medium">© {new Date().getFullYear()} Arara's Açaí 🍧</span>

        {sep}

        <span>
          Desenvolvido por{" "}
          <a
            href="https://www.linkedin.com/in/giovanne-medeiros/"
            target="_blank"
            rel="noopener noreferrer"
            className="italic text-purple-800 transition hover:text-purple-950 hover:underline dark:text-zinc-100 dark:hover:text-white"
          >
            Giovanne Medeiros
          </a>
        </span>

        {sep}

        <a
          href="https://wa.me/555199202978"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-800 transition hover:text-purple-950 hover:underline dark:text-zinc-100 dark:hover:text-white"
        >
          WhatsApp
        </a>

        {sep}

        <span>Viamão - RS</span>

        {sep}

        <Link
          to="/politica-de-privacidade"
          className="text-purple-800 transition hover:text-purple-950 hover:underline dark:text-zinc-100 dark:hover:text-white"
        >
          Política de Privacidade
        </Link>

        {sep}

        <span className="text-purple-700 dark:text-zinc-300">
          Sistema de Fidelidade • Todos os direitos reservados
        </span>

      </div>
    </footer>
  )
}