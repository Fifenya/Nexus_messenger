package com.nexus.messenger

import android.content.ComponentName
import android.content.pm.PackageManager
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "nexus-mobile"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Отключаем intent-filter в MainActivity, чтобы на рабочем столе была только
    // одна иконка (от activity-alias, который управляется IconSwitcherModule).
    // Это делается один раз при первом запуске.
    val prefs = getSharedPreferences("nexus_prefs", MODE_PRIVATE)
    if (!prefs.getBoolean("main_activity_filter_disabled", false)) {
      try {
        val componentName = ComponentName(this, MainActivity::class.java)
        packageManager.setComponentEnabledSetting(
          componentName,
          PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
          PackageManager.DONT_KILL_APP
        )
        prefs.edit().putBoolean("main_activity_filter_disabled", true).apply()
      } catch (e: Exception) {
        // Игнорируем ошибки — не критично
      }
    }
  }
}
