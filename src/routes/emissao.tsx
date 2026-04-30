import { createFileRoute } from '@tanstack/react-router'
import EmissaoPage from '@/features/Emissao'

export const Route = createFileRoute('/emissao')({
  component: EmissaoPage,
})
