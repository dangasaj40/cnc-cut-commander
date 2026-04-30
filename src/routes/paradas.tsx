import { createFileRoute } from '@tanstack/react-router'
import ParadasPage from '@/features/Paradas'

export const Route = createFileRoute('/paradas')({
  component: ParadasPage,
})
