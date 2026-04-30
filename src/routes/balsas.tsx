import { createFileRoute } from '@tanstack/react-router'
import BalsasPage from '@/features/Balsas'

export const Route = createFileRoute('/balsas')({
  component: BalsasPage,
})
