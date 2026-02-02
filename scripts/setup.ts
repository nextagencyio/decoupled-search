#!/usr/bin/env tsx
/**
 * Interactive setup script for Decoupled Search
 *
 * This script helps you:
 * 1. Authenticate with Decoupled.io CLI
 * 2. Create a new Drupal space
 * 3. Import sample content
 * 4. Configure Pinecone and OpenAI
 * 5. Index content in Pinecone
 */

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { spawn, execSync, type SpawnOptions } from 'child_process'

// Colors for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color?: keyof typeof COLORS) {
  const colorCode = color ? COLORS[color] : ''
  console.log(`${colorCode}${message}${COLORS.reset}`)
}

function logStep(step: number, total: number, message: string) {
  console.log(`\n${COLORS.cyan}[${step}/${total}]${COLORS.reset} ${COLORS.bright}${message}${COLORS.reset}`)
}

function logSuccess(message: string) {
  console.log(`${COLORS.green}✓${COLORS.reset} ${message}`)
}

function logError(message: string) {
  console.log(`${COLORS.red}✗${COLORS.reset} ${message}`)
}

function logInfo(message: string) {
  console.log(`${COLORS.blue}ℹ${COLORS.reset} ${message}`)
}

async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const defaultHint = defaultValue ? ` [${defaultValue}]` : ''

  return new Promise((resolve) => {
    rl.question(`${question}${defaultHint}: `, (answer) => {
      rl.close()
      resolve(answer.trim() || defaultValue || '')
    })
  })
}

async function promptSecret(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(`${question}: `)

    const stdin = process.stdin
    const wasRaw = stdin.isRaw
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')

    let input = ''

    const onData = (char: string) => {
      if (char === '\u0003') {
        process.stdout.write('\n')
        process.exit()
      }
      if (char === '\r' || char === '\n') {
        stdin.removeListener('data', onData)
        stdin.setRawMode(wasRaw)
        stdin.pause()
        process.stdout.write('\n')
        resolve(input)
        return
      }
      if (char === '\u007F' || char === '\b') {
        if (input.length > 0) {
          input = input.slice(0, -1)
          process.stdout.write('\b \b')
        }
        return
      }
      input += char
      process.stdout.write('*'.repeat(char.length))
    }

    stdin.on('data', onData)
  })
}

async function confirm(question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? '[Y/n]' : '[y/N]'
  const answer = await prompt(`${question} ${hint}`)

  if (!answer) return defaultYes
  return answer.toLowerCase().startsWith('y')
}

interface RunCommandOptions {
  silent?: boolean
  cwd?: string
}

async function runCommand(
  cmd: string,
  args: string[],
  options: RunCommandOptions = {}
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const spawnOptions: SpawnOptions = {
      cwd: options.cwd || process.cwd(),
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
    }

    const child = spawn(cmd, args, spawnOptions)
    let output = ''

    if (options.silent) {
      child.stdout?.on('data', (data) => {
        output += data.toString()
      })
      child.stderr?.on('data', (data) => {
        output += data.toString()
      })
    }

    child.on('close', (code) => {
      resolve({ success: code === 0, output })
    })

    child.on('error', (error) => {
      resolve({ success: false, output: error.message })
    })
  })
}

function runCommandSync(command: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    return { success: true, output }
  } catch (error: any) {
    return { success: false, output: error.message }
  }
}

async function fetchCredentialsWithRetry(spaceId: number, maxRetries = 3, delayMs = 5000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    log(`\nAttempt ${attempt}/${maxRetries}: Fetching Drupal credentials...`, 'dim')

    const result = await runCommand('npx', ['decoupled-cli@latest', 'spaces', 'env', String(spaceId), '--write', '.env.local'], { silent: true })

    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      if (content.includes('DRUPAL_CLIENT_ID') || content.includes('NEXT_PUBLIC_DRUPAL_BASE_URL')) {
        return true
      }
    }

    if (attempt < maxRetries) {
      log(`Credentials not received, retrying in ${delayMs / 1000}s...`, 'yellow')
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return false
}

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const env: Record<string, string> = {}

  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key) {
        env[key] = valueParts.join('=')
      }
    }
  })

  return env
}

function writeEnvFile(filePath: string, env: Record<string, string>) {
  const content = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  fs.writeFileSync(filePath, content + '\n')
}

async function checkAuth(): Promise<boolean> {
  const result = runCommandSync('npx decoupled-cli@latest auth status 2>&1')
  return result.success && !result.output.includes('not authenticated')
}

async function waitForSpace(spaceId: number, maxWaitSeconds = 200): Promise<boolean> {
  const startTime = Date.now()
  const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let spinnerIndex = 0

  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    const result = await runCommand('npx', ['decoupled-cli@latest', 'spaces', 'get', String(spaceId)], { silent: true })

    if (result.output.includes('"status": "active"') || result.output.includes('status: active')) {
      process.stdout.write('\r' + ' '.repeat(60) + '\r')
      return true
    }

    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    process.stdout.write(`\r${spinnerChars[spinnerIndex]} Waiting for space to be ready... ${elapsed}s`)
    spinnerIndex = (spinnerIndex + 1) % spinnerChars.length

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  process.stdout.write('\r' + ' '.repeat(60) + '\r')
  return false
}

async function main() {
  console.log(`
${COLORS.cyan}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ${COLORS.bright}Decoupled Search Setup${COLORS.cyan}                                 ║
║   ${COLORS.dim}AI-powered semantic search with Drupal + Pinecone${COLORS.cyan}       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${COLORS.reset}
`)

  const totalSteps = 6
  let currentStep = 1

  const envPath = path.join(process.cwd(), '.env.local')
  let envVars = readEnvFile(envPath)
  let spaceId: number = 0
  let spaceUrl = ''

  // Step 1: Check/setup Decoupled.io authentication
  logStep(currentStep++, totalSteps, 'Checking Decoupled.io authentication')

  const isAuthenticated = await checkAuth()

  if (!isAuthenticated) {
    logInfo('You need to authenticate with Decoupled.io')
    console.log(`\nPlease run: ${COLORS.cyan}npx decoupled-cli@latest auth login${COLORS.reset}`)
    console.log('Then run this setup script again.\n')
    process.exit(1)
  }

  logSuccess('Authenticated with Decoupled.io')

  // Step 2: Create Drupal space
  logStep(currentStep++, totalSteps, 'Setting up Drupal space')

  const hasExistingSpace = envVars['NEXT_PUBLIC_DRUPAL_BASE_URL'] || envVars['DRUPAL_BASE_URL']

  if (hasExistingSpace) {
    const useExisting = await confirm('Found existing Drupal configuration. Use it?')
    if (useExisting) {
      logSuccess('Using existing Drupal space')
      const urlMatch = (envVars['NEXT_PUBLIC_DRUPAL_BASE_URL'] || envVars['DRUPAL_BASE_URL']).match(/https?:\/\/([^.]+)/)
      if (urlMatch) {
        spaceUrl = envVars['NEXT_PUBLIC_DRUPAL_BASE_URL'] || envVars['DRUPAL_BASE_URL']
      }
    } else {
      envVars = {}
    }
  }

  if (!spaceUrl) {
    const spaceName = await prompt('Space name', 'Knowledge Search')

    log('\nCreating Drupal space...', 'dim')

    const createResult = await runCommand('npx', ['decoupled-cli@latest', 'spaces', 'create', '--name', `"${spaceName}"`], { silent: true })

    const idMatch = createResult.output.match(/Space ID:\s*(\d+)|"id":\s*(\d+)|id:\s*(\d+)/)
    if (idMatch) {
      spaceId = parseInt(idMatch[1] || idMatch[2] || idMatch[3], 10)
      logSuccess(`Created space with ID: ${spaceId}`)
    } else {
      logError('Failed to create space')
      console.log(createResult.output)
      process.exit(1)
    }

    // Wait for space to be ready
    log('\nWaiting for space to be provisioned (this takes ~90 seconds)...', 'dim')
    const spaceReady = await waitForSpace(spaceId, 200)

    if (!spaceReady) {
      logError('Space provisioning timed out')
      const shouldContinue = await confirm('Continue anyway?', false)
      if (!shouldContinue) {
        process.exit(1)
      }
    } else {
      logSuccess('Space is ready')
    }
  }

  // Step 3: Import sample content
  logStep(currentStep++, totalSteps, 'Importing sample content')

  const contentPath = path.join(process.cwd(), 'data', 'search-content.json')

  if (fs.existsSync(contentPath) && spaceId) {
    log('Importing articles into Drupal...', 'dim')
    const importResult = await runCommand('npx', ['decoupled-cli@latest', 'content', 'import', contentPath, '--space', String(spaceId)])

    if (importResult.success) {
      logSuccess('Sample content imported')
    } else {
      logError('Content import failed (you can try again with: npm run setup-content)')
    }
  }

  // Step 4: Configure Drupal environment
  logStep(currentStep++, totalSteps, 'Configuring Drupal environment')

  if (spaceId) {
    const credentialsSuccess = await fetchCredentialsWithRetry(spaceId, 3, 5000)

    if (!credentialsSuccess) {
      logError('Failed to fetch credentials after 3 attempts.')
      log('You can try manually: npx decoupled-cli@latest spaces env ' + spaceId + ' --write .env.local', 'yellow')
    }
  }

  envVars = readEnvFile(envPath)

  if (envVars['NEXT_PUBLIC_DRUPAL_BASE_URL'] && !envVars['DRUPAL_BASE_URL']) {
    envVars['DRUPAL_BASE_URL'] = envVars['NEXT_PUBLIC_DRUPAL_BASE_URL']
    writeEnvFile(envPath, envVars)
  }

  if (envVars['NEXT_PUBLIC_DRUPAL_BASE_URL']) {
    logSuccess('Drupal environment configured')
    spaceUrl = envVars['NEXT_PUBLIC_DRUPAL_BASE_URL']
  }

  // Step 5: Configure Pinecone
  logStep(currentStep++, totalSteps, 'Configuring Pinecone')

  console.log(`
${COLORS.yellow}To enable semantic search, you need a Pinecone API key.${COLORS.reset}

Pinecone provides both the vector database AND built-in embeddings,
so you only need one API key!

Get a free API key at: ${COLORS.cyan}https://pinecone.io${COLORS.reset}
`)

  const configurePinecone = await confirm('Configure Pinecone now?')

  if (configurePinecone) {
    logInfo('(Input is hidden for security)')

    const pineconeKey = await promptSecret('Pinecone API Key')
    const pineconeIndex = await prompt('Pinecone Index Name', 'decoupled-search')

    if (pineconeKey) envVars['PINECONE_API_KEY'] = pineconeKey
    if (pineconeIndex) envVars['PINECONE_INDEX'] = pineconeIndex

    writeEnvFile(envPath, envVars)
    logSuccess('Pinecone configured')

    // Offer to create index and index content
    if (pineconeKey) {
      const shouldIndex = await confirm('Index content in Pinecone now?')

      if (shouldIndex) {
        const shouldReset = await confirm('Reset index first? (Recommended to avoid duplicates)', true)

        log('\nIndexing content (this may take a moment)...', 'dim')
        const indexArgs = ['tsx', 'scripts/index-content.ts']
        if (shouldReset) {
          indexArgs.push('--reset')
        }
        const indexResult = await runCommand('npx', indexArgs)

        if (indexResult.success) {
          logSuccess('Content indexed in Pinecone')
        } else {
          logError('Indexing failed. You can try again with: npm run index')
        }
      }
    }
  } else {
    log('You can add the Pinecone API key later by editing .env.local', 'yellow')
  }

  // Step 6: Complete
  logStep(currentStep++, totalSteps, 'Setup complete!')

  console.log(`
${COLORS.green}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ${COLORS.bright}Setup Complete!${COLORS.green}                                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${COLORS.reset}

${COLORS.bright}Next steps:${COLORS.reset}

1. Start the development server:
   ${COLORS.cyan}npm run dev${COLORS.reset}

2. Open ${COLORS.cyan}http://localhost:3000${COLORS.reset} in your browser

3. Try searching for topics like:
   - "How to use TypeScript"
   - "What is a vector database"
   - "React best practices"

${COLORS.dim}Space ID: ${spaceId || 'existing'}${COLORS.reset}
${spaceUrl ? `${COLORS.dim}Drupal URL: ${spaceUrl}${COLORS.reset}` : ''}
`)
}

main().catch((error) => {
  logError(`Setup failed: ${error.message}`)
  process.exit(1)
})
