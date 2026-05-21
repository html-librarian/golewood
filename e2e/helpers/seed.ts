import { execSync } from 'node:child_process'

export const resetE2eSeed = () => {
  execSync('npm run db:seed', {
    stdio: 'pipe',
    cwd: process.cwd(),
    env: { ...process.env, SEED_E2E: '1' },
  })
}
