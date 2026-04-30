import { createFileRoute } from '@tanstack/react-router'
import RetornoPage from '@/features/Retorno'

export const Route = createFileRoute('/retorno')({
  component: RetornoPage,
})
