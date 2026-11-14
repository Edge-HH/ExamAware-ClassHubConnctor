import { defineRendererPlugin } from '@dsz-examaware/plugin-sdk'
import PluginSettingsPage from './PluginSettingsPage.vue'
import { publishRemoteCiStatus, type RemoteCiStatus } from './status'

export default defineRendererPlugin({
  async activate(ctx) {
    if (ctx.window.kind !== 'settings') return
    const publish = () => publishRemoteCiStatus(ctx.api.settings.get() as RemoteCiStatus)
    publish()
    const stop = ctx.api.settings.onChanged(() => publish())
    ctx.scope.defer(() => stop.dispose())
    await ctx.api.ui.settings.registerPage({
      id: 'remoteci',
      label: 'RemoteCI',
      icon: 'link',
      order: 20,
      component: () => Promise.resolve(PluginSettingsPage)
    })
  }
})
