/**
 * Configuração de Cache (Redis)
 * Se Redis não estiver disponível, usa cache em memória como fallback
 */

let redisClient = null
let memoryCache = new Map()
const CACHE_TTL = 300 // 5 minutos em segundos

// Flag para controlar se Redis está desabilitado
let redisDisabled = false
let redisReconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 3 // Reduzido para 3 tentativas

// Verifica se Redis deve ser desabilitado via variável de ambiente
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false'

// Tenta conectar ao Redis apenas se estiver habilitado
if (REDIS_ENABLED) {
    try {
        const redis = require('redis')
        
        // Redis v4 usa URL ou objeto de configuração
        const redisConfig = {
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                reconnectStrategy: (retries) => {
                    redisReconnectAttempts = retries
                    if (retries >= MAX_RECONNECT_ATTEMPTS) {
                        console.warn('[Cache] Redis: limite de tentativas atingido, desabilitando Redis e usando cache em memória')
                        redisDisabled = true
                        // Fecha conexão e desabilita
                        setTimeout(() => {
                            if (redisClient) {
                                try {
                                    if (redisClient.isOpen) {
                                        redisClient.quit().catch(() => {})
                                    }
                                } catch (e) {}
                                redisClient = null
                            }
                        }, 100)
                        return false // Para de tentar
                    }
                    return Math.min(retries * 100, 2000)
                }
            }
        }
        
        redisClient = redis.createClient(redisConfig)
        
        redisClient.on('error', (err) => {
            if (!redisDisabled && redisReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                console.warn('[Cache] Erro Redis:', err.message)
            }
        })
        
        redisClient.on('connect', () => {
            console.log('[Cache] Redis conectado com sucesso')
            redisReconnectAttempts = 0
            redisDisabled = false
        })
        
        redisClient.on('ready', () => {
            console.log('[Cache] Redis pronto para uso')
            redisReconnectAttempts = 0
            redisDisabled = false
        })
        
        redisClient.on('end', () => {
            if (redisReconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                console.warn('[Cache] Redis desabilitado, usando apenas cache em memória')
                redisDisabled = true
                redisClient = null
            }
        })
        
        // Tenta conectar com timeout
        Promise.race([
            redisClient.connect(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout de conexão')), 5000)
            )
        ]).catch((err) => {
            console.warn('[Cache] Redis não disponível, usando cache em memória:', err.message)
            redisDisabled = true
            redisClient = null
        })
    } catch (error) {
        console.warn('[Cache] Redis não disponível, usando cache em memória:', error.message)
        redisDisabled = true
        redisClient = null
    }
} else {
    console.log('[Cache] Redis desabilitado via configuração, usando cache em memória')
    redisDisabled = true
}

class CacheService {
    /**
     * Gera chave de cache
     */
    generateKey(prefix, params) {
        const paramsStr = JSON.stringify(params)
        return `dashboard:${prefix}:${Buffer.from(paramsStr).toString('base64')}`
    }
    
    /**
     * Obtém valor do cache
     */
    async get(key) {
        try {
            // Se Redis está desabilitado, usa apenas memória
            if (redisDisabled || !redisClient) {
                const cached = memoryCache.get(key)
                if (cached && cached.expires > Date.now()) {
                    return cached.value
                }
                memoryCache.delete(key)
                return null
            }
            
            // Tenta usar Redis
            if (redisClient.isOpen) {
                try {
                    const value = await redisClient.get(key)
                    if (value) {
                        return JSON.parse(value)
                    }
                } catch (error) {
                    // Se erro, desabilita Redis e usa memória
                    redisDisabled = true
                    redisClient = null
                }
            }
            
            // Cache em memória (fallback)
            const cached = memoryCache.get(key)
            if (cached && cached.expires > Date.now()) {
                return cached.value
            }
            memoryCache.delete(key)
        } catch (error) {
            // Ignora erros silenciosamente
        }
        return null
    }
    
    /**
     * Define valor no cache
     */
    async set(key, value, ttl = CACHE_TTL) {
        try {
            // Se Redis está desabilitado, usa apenas memória
            if (redisDisabled || !redisClient) {
                memoryCache.set(key, {
                    value,
                    expires: Date.now() + (ttl * 1000)
                })
                
                // Limpa cache expirado periodicamente
                if (memoryCache.size > 1000) {
                    this.cleanExpired()
                }
                return
            }
            
            // Tenta usar Redis
            if (redisClient.isOpen) {
                try {
                    await redisClient.setEx(key, ttl, JSON.stringify(value))
                    return // Sucesso
                } catch (error) {
                    // Se erro, desabilita Redis e usa memória
                    redisDisabled = true
                    redisClient = null
                }
            }
            
            // Cache em memória (fallback)
            memoryCache.set(key, {
                value,
                expires: Date.now() + (ttl * 1000)
            })
            
            // Limpa cache expirado periodicamente
            if (memoryCache.size > 1000) {
                this.cleanExpired()
            }
        } catch (error) {
            // Ignora erros silenciosamente
        }
    }
    
    /**
     * Remove valor do cache
     */
    async delete(key) {
        try {
            if (!redisDisabled && redisClient && redisClient.isOpen) {
                try {
                    await redisClient.del(key)
                } catch (error) {
                    redisDisabled = true
                    redisClient = null
                }
            }
            memoryCache.delete(key)
        } catch (error) {
            // Ignora erros silenciosamente
        }
    }
    
    /**
     * Limpa cache expirado (apenas memória)
     */
    cleanExpired() {
        const now = Date.now()
        for (const [key, cached] of memoryCache.entries()) {
            if (cached.expires <= now) {
                memoryCache.delete(key)
            }
        }
    }
    
    /**
     * Limpa todo o cache
     */
    async clear(prefix = null) {
        try {
            if (!redisDisabled && redisClient && redisClient.isOpen) {
                try {
                    if (prefix) {
                        const keys = await redisClient.keys(`dashboard:${prefix}:*`)
                        if (keys.length > 0) {
                            await redisClient.del(keys)
                        }
                    } else {
                        await redisClient.flushDb()
                    }
                } catch (error) {
                    redisDisabled = true
                    redisClient = null
                }
            }
            
            // Sempre limpa memória também
            if (prefix) {
                for (const key of memoryCache.keys()) {
                    if (key.startsWith(`dashboard:${prefix}:`)) {
                        memoryCache.delete(key)
                    }
                }
            } else {
                memoryCache.clear()
            }
        } catch (error) {
            // Ignora erros silenciosamente
        }
    }
}

module.exports = new CacheService()

