import { defineRendererPlugin } from '@dsz-examaware/plugin-sdk'
import PluginSettingsPage from './PluginSettingsPage.vue'

export default defineRendererPlugin({
  async activate(ctx) {
    if (ctx.window.kind !== 'settings') return
    await ctx.api.ui.settings.registerPage({
      id: 'remoteci',
      label: 'RemoteCI 考试',
      icon: 'assignment',
      order: 40,
      component: PluginSettingsPage
    })
  }
})
