import { defineConfig } from "eslint/config"
import next from "eslint-config-next"

export default defineConfig([
  {
    // Los componentes de shadcn se regeneran con la CLI: no se lintean.
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "components/ui/**"],
  },
  ...next,
])
