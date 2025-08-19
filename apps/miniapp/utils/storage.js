// utils/storage.js

// 存储前缀
const PREFIX = 'gulingtong_'

// 获取完整的存储键名
function getKey(key) {
  return PREFIX + key
}

// 同步存储
const storage = {
  // 设置数据
  set(key, value) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        type: typeof value
      }
      wx.setStorageSync(getKey(key), JSON.stringify(data))
      return true
    } catch (error) {
      console.error('存储数据失败', key, error)
      return false
    }
  },

  // 获取数据
  get(key, defaultValue = null) {
    try {
      const data = wx.getStorageSync(getKey(key))
      if (data) {
        const parsed = JSON.parse(data)
        return parsed.value
      }
      return defaultValue
    } catch (error) {
      console.error('获取数据失败', key, error)
      return defaultValue
    }
  },

  // 删除数据
  remove(key) {
    try {
      wx.removeStorageSync(getKey(key))
      return true
    } catch (error) {
      console.error('删除数据失败', key, error)
      return false
    }
  },

  // 清空所有数据
  clear() {
    try {
      const info = wx.getStorageInfoSync()
      const keys = info.keys.filter(key => key.startsWith(PREFIX))
      keys.forEach(key => {
        wx.removeStorageSync(key)
      })
      return true
    } catch (error) {
      console.error('清空数据失败', error)
      return false
    }
  },

  // 获取所有键名
  keys() {
    try {
      const info = wx.getStorageInfoSync()
      return info.keys
        .filter(key => key.startsWith(PREFIX))
        .map(key => key.replace(PREFIX, ''))
    } catch (error) {
      console.error('获取键名失败', error)
      return []
    }
  },

  // 获取存储信息
  info() {
    try {
      return wx.getStorageInfoSync()
    } catch (error) {
      console.error('获取存储信息失败', error)
      return null
    }
  },

  // 检查是否存在
  has(key) {
    try {
      const data = wx.getStorageSync(getKey(key))
      return data !== ''
    } catch (error) {
      console.error('检查数据存在失败', key, error)
      return false
    }
  }
}

// 异步存储
const asyncStorage = {
  // 设置数据
  set(key, value) {
    return new Promise((resolve, reject) => {
      try {
        const data = {
          value,
          timestamp: Date.now(),
          type: typeof value
        }
        wx.setStorage({
          key: getKey(key),
          data: JSON.stringify(data),
          success: () => resolve(true),
          fail: (error) => {
            console.error('存储数据失败', key, error)
            reject(error)
          }
        })
      } catch (error) {
        console.error('存储数据失败', key, error)
        reject(error)
      }
    })
  },

  // 获取数据
  get(key, defaultValue = null) {
    return new Promise((resolve) => {
      wx.getStorage({
        key: getKey(key),
        success: (res) => {
          try {
            const parsed = JSON.parse(res.data)
            resolve(parsed.value)
          } catch (error) {
            console.error('解析数据失败', key, error)
            resolve(defaultValue)
          }
        },
        fail: (error) => {
          console.error('获取数据失败', key, error)
          resolve(defaultValue)
        }
      })
    })
  },

  // 删除数据
  remove(key) {
    return new Promise((resolve, reject) => {
      wx.removeStorage({
        key: getKey(key),
        success: () => resolve(true),
        fail: (error) => {
          console.error('删除数据失败', key, error)
          reject(error)
        }
      })
    })
  },

  // 清空所有数据
  clear() {
    return new Promise((resolve, reject) => {
      wx.getStorageInfo({
        success: (info) => {
          const keys = info.keys.filter(key => key.startsWith(PREFIX))
          const promises = keys.map(key => {
            return new Promise((res) => {
              wx.removeStorage({
                key,
                success: () => res(true),
                fail: () => res(false)
              })
            })
          })
          
          Promise.all(promises)
            .then(() => resolve(true))
            .catch(reject)
        },
        fail: (error) => {
          console.error('清空数据失败', error)
          reject(error)
        }
      })
    })
  },

  // 获取所有键名
  keys() {
    return new Promise((resolve, reject) => {
      wx.getStorageInfo({
        success: (info) => {
          const keys = info.keys
            .filter(key => key.startsWith(PREFIX))
            .map(key => key.replace(PREFIX, ''))
          resolve(keys)
        },
        fail: (error) => {
          console.error('获取键名失败', error)
          reject(error)
        }
      })
    })
  },

  // 获取存储信息
  info() {
    return new Promise((resolve, reject) => {
      wx.getStorageInfo({
        success: resolve,
        fail: (error) => {
          console.error('获取存储信息失败', error)
          reject(error)
        }
      })
    })
  },

  // 检查是否存在
  has(key) {
    return new Promise((resolve) => {
      wx.getStorage({
        key: getKey(key),
        success: () => resolve(true),
        fail: () => resolve(false)
      })
    })
  }
}

// 带过期时间的存储
const expireStorage = {
  // 设置数据（带过期时间）
  set(key, value, expire = 0) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expire: expire > 0 ? Date.now() + expire : 0,
        type: typeof value
      }
      wx.setStorageSync(getKey(key), JSON.stringify(data))
      return true
    } catch (error) {
      console.error('存储数据失败', key, error)
      return false
    }
  },

  // 获取数据（检查过期时间）
  get(key, defaultValue = null) {
    try {
      const data = wx.getStorageSync(getKey(key))
      if (data) {
        const parsed = JSON.parse(data)
        
        // 检查是否过期
        if (parsed.expire > 0 && Date.now() > parsed.expire) {
          // 数据已过期，删除并返回默认值
          this.remove(key)
          return defaultValue
        }
        
        return parsed.value
      }
      return defaultValue
    } catch (error) {
      console.error('获取数据失败', key, error)
      return defaultValue
    }
  },

  // 删除数据
  remove(key) {
    return storage.remove(key)
  },

  // 清理过期数据
  clearExpired() {
    try {
      const info = wx.getStorageInfoSync()
      const keys = info.keys.filter(key => key.startsWith(PREFIX))
      
      keys.forEach(key => {
        try {
          const data = wx.getStorageSync(key)
          if (data) {
            const parsed = JSON.parse(data)
            if (parsed.expire > 0 && Date.now() > parsed.expire) {
              wx.removeStorageSync(key)
            }
          }
        } catch (error) {
          // 数据格式错误，直接删除
          wx.removeStorageSync(key)
        }
      })
      
      return true
    } catch (error) {
      console.error('清理过期数据失败', error)
      return false
    }
  }
}

// 缓存管理
const cache = {
  // 设置缓存（默认1小时过期）
  set(key, value, expire = 60 * 60 * 1000) {
    return expireStorage.set(key, value, expire)
  },

  // 获取缓存
  get(key, defaultValue = null) {
    return expireStorage.get(key, defaultValue)
  },

  // 删除缓存
  remove(key) {
    return expireStorage.remove(key)
  },

  // 清理所有过期缓存
  clearExpired() {
    return expireStorage.clearExpired()
  }
}

// 用户数据存储
const userStorage = {
  // 设置用户数据
  setUserData(userId, key, value) {
    const userKey = `user_${userId}_${key}`
    return storage.set(userKey, value)
  },

  // 获取用户数据
  getUserData(userId, key, defaultValue = null) {
    const userKey = `user_${userId}_${key}`
    return storage.get(userKey, defaultValue)
  },

  // 删除用户数据
  removeUserData(userId, key) {
    const userKey = `user_${userId}_${key}`
    return storage.remove(userKey)
  },

  // 清空用户所有数据
  clearUserData(userId) {
    try {
      const info = wx.getStorageInfoSync()
      const userPrefix = getKey(`user_${userId}_`)
      const keys = info.keys.filter(key => key.startsWith(userPrefix))
      
      keys.forEach(key => {
        wx.removeStorageSync(key)
      })
      
      return true
    } catch (error) {
      console.error('清空用户数据失败', userId, error)
      return false
    }
  }
}

module.exports = {
  storage,
  asyncStorage,
  expireStorage,
  cache,
  userStorage
}