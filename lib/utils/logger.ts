/**
 * Centralized logging utility
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''

    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR: ${message}${contextStr}`)
        break
      case 'warn':
        console.warn(`[${timestamp}] WARN: ${message}${contextStr}`)
        break
      case 'info':
        console.log(`[${timestamp}] INFO: ${message}${contextStr}`)
        break
      case 'debug':
        if (this.isDev) {
          console.debug(`[${timestamp}] DEBUG: ${message}${contextStr}`)
        }
        break
    }
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }
}

export const logger = new Logger()
