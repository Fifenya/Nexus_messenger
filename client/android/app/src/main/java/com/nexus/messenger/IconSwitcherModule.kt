package com.nexus.messenger

import android.content.ComponentName
import android.content.pm.PackageManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class IconSwitcherModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "IconSwitcher"

    private fun aliasComponent(variant: String): ComponentName {
        val cap = variant.replaceFirstChar { it.uppercase() }
        return ComponentName("com.nexus.messenger", "com.nexus.messenger.MainActivity$cap")
    }

    @ReactMethod
    fun setAppIcon(variant: String, allVariants: ReadableArray, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager

            // Проверяем, что алиас реально существует в манифесте
            try {
                pm.getActivityInfo(aliasComponent(variant), 0)
            } catch (e: PackageManager.NameNotFoundException) {
                promise.reject("E_UNKNOWN_VARIANT", "Alias not found for: $variant")
                return
            }

            for (i in 0 until allVariants.size()) {
                val v = allVariants.getString(i) ?: continue
                val state = if (v == variant) {
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                } else {
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED
                }
                pm.setComponentEnabledSetting(
                    aliasComponent(v),
                    state,
                    PackageManager.DONT_KILL_APP
                )
            }
            promise.resolve(variant)
        } catch (e: Exception) {
            promise.reject("E_ICON_SWITCH", e)
        }
    }

    @ReactMethod
    fun getCurrentIcon(allVariants: ReadableArray, promise: Promise) {
        val pm = reactApplicationContext.packageManager
        for (i in 0 until allVariants.size()) {
            val v = allVariants.getString(i) ?: continue
            val state = pm.getComponentEnabledSetting(aliasComponent(v))
            if (state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                promise.resolve(v)
                return
            }
        }
        promise.resolve("classic")
    }
    }
